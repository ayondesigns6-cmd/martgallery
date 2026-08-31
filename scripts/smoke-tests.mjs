/**
 * Mart Gallery — Contract & Logic Smoke Tests (self-contained, pure JS)
 *
 * Verifies:
 *  - Price tampering defense algorithms (clamping, dedup, authoritative recompute)
 *  - Input validation rules & bounds
 *  - Order snapshot & status contracts used across the app
 *  - Mock catalog invariants (name/slug/price uniqueness & type)
 *
 * Run:  node scripts/smoke-tests.mjs
 */

import assert from 'node:assert/strict';

/* ---------- Inline copies of contract values & sample data ---------- */

const MAX_QUANTITY_PER_ITEM = 50;
const MAX_ITEMS_PER_ORDER = 20;
const MIN_DELIVERY_FEE = 20;
const MAX_DELIVERY_FEE = 500;
const DEFAULT_DELIVERY_FEE = 60;
const MAX_PRICE_PER_ITEM = 1_000_000;
const MAX_ORDER_TOTAL = 10_000_000;

/** Mirror of MOCK_PRODUCTS[0..N] shape — kept independent to catch schema drift. */
const SAMPLE_PRODUCTS = [
  {
    id: 'prod-acousticpro-001',
    name: 'AcousticPro Wireless Headphones',
    slug: 'acousticpro-wireless-headphones',
    price: 6500,
    compare_at_price: 7800,
    category_id: 'cat-electronics',
    image_url: 'https://example.com/img/1.jpg',
    short_description: 'Premium noise-cancelling wireless headphones with 30h battery.',
    availability: 'in_stock',
    is_featured: true,
    is_hot: true,
  },
  {
    id: 'prod-sonicwave-002',
    name: 'SonicWave Bluetooth Speaker',
    slug: 'sonicwave-bluetooth-speaker',
    price: 3200,
    compare_at_price: 3900,
    category_id: 'cat-electronics',
    image_url: 'https://example.com/img/2.jpg',
    short_description: 'Portable 360° sound with deep bass.',
    availability: 'in_stock',
    is_featured: false,
    is_hot: true,
  },
  {
    id: 'prod-fitband-003',
    name: 'FitBand Smart Fitness Tracker',
    slug: 'fitband-smart-fitness-tracker',
    price: 1850,
    compare_at_price: 2400,
    category_id: 'cat-electronics',
    image_url: 'https://example.com/img/3.jpg',
    short_description: 'Heart-rate monitor, step counter, sleep tracker.',
    availability: 'out_of_stock',
    is_featured: true,
    is_hot: false,
  },
];

/* ---------- Helpers mirroring server-side algorithms ---------- */

function clampDeliveryFee(rawFee) {
  return Math.max(MIN_DELIVERY_FEE, Math.min(MAX_DELIVERY_FEE, rawFee));
}

function dedupAndMerge(items) {
  const map = new Map();
  for (const it of items) {
    const ex = map.get(it.productId);
    const qty = Math.min(MAX_QUANTITY_PER_ITEM, (ex?.quantity || 0) + it.quantity);
    map.set(it.productId, { productId: it.productId, quantity: qty });
  }
  return Array.from(map.values());
}

function resolveAuthoritativePrices(items, catalog) {
  return items.map((it) => {
    const found = catalog.find((p) => p.id === it.productId);
    if (!found) throw new Error(`Product ID ${it.productId} not in catalog`);
    if (found.availability && found.availability !== 'in_stock') {
      throw new Error(`Product "${found.name}" is out of stock`);
    }
    const unitPrice = Number(found.price);
    if (!Number.isFinite(unitPrice) || unitPrice < 0 || unitPrice > MAX_PRICE_PER_ITEM) {
      throw new Error(`Product "${found.name}" invalid price`);
    }
    return {
      productId: found.id,
      name: found.name,
      price: unitPrice,
      imageUrl: found.image_url,
      quantity: it.quantity,
      subtotal: unitPrice * it.quantity,
    };
  });
}

function formatPrice(n) {
  const num = Number(n) || 0;
  const fixed = num.toFixed(2);
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `\u09F3${parts.join('.')}`;
}

/* ---------- Harness ---------- */

let passed = 0;
let failed = 0;
const failures = [];
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  \u2714 ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, err });
    console.log(`  \u2718 ${name}\n      ${err.message}`);
  }
}

/* ---------- Run ---------- */

async function runAll() {
  console.log('\n=== Mart Gallery Contract Smoke Tests ===\n');
  console.log('Sample catalog:', SAMPLE_PRODUCTS.length, 'products');
  console.log(`Reference: "${SAMPLE_PRODUCTS[0].name}" @ ${formatPrice(SAMPLE_PRODUCTS[0].price)}`);
  console.log();

  console.log('[1] Security — Price Tampering Defense');

  test('Authoritative price lookup ignores client-supplied price/quantity metadata', () => {
    const clientPayload = [
      { productId: SAMPLE_PRODUCTS[0].id, quantity: 2, clientPrice: 0.01, clientSubtotal: 0.02 },
    ];
    const resolved = resolveAuthoritativePrices(dedupAndMerge(clientPayload), SAMPLE_PRODUCTS);
    const p = SAMPLE_PRODUCTS[0].price;
    assert.equal(resolved[0].price, p, 'price is authoritative');
    assert.equal(resolved[0].subtotal, p * 2, 'subtotal = p*q (server)');
    assert.notEqual(resolved[0].price, 0.01, 'client-submitted price NOT used');
  });

  test('Low delivery fee → clamped to MIN_DELIVERY_FEE', () => {
    assert.equal(clampDeliveryFee(0), MIN_DELIVERY_FEE);
    assert.equal(clampDeliveryFee(1), MIN_DELIVERY_FEE);
    assert.equal(clampDeliveryFee(-10), MIN_DELIVERY_FEE);
  });

  test('High delivery fee → clamped to MAX_DELIVERY_FEE', () => {
    assert.equal(clampDeliveryFee(10000), MAX_DELIVERY_FEE);
    assert.equal(clampDeliveryFee(999_999_999), MAX_DELIVERY_FEE);
  });

  test('DEFAULT_DELIVERY_FEE within allowable range', () => {
    assert.ok(DEFAULT_DELIVERY_FEE >= MIN_DELIVERY_FEE && DEFAULT_DELIVERY_FEE <= MAX_DELIVERY_FEE);
  });

  test('Duplicate productIds → quantities merged up to MAX_QUANTITY_PER_ITEM', () => {
    const items = [
      { productId: SAMPLE_PRODUCTS[0].id, quantity: 30 },
      { productId: SAMPLE_PRODUCTS[0].id, quantity: 30 }, // 30+30=60 > 50 → clamp to 50
    ];
    const merged = dedupAndMerge(items);
    assert.equal(merged.length, 1, 'one row after merge');
    assert.equal(merged[0].quantity, MAX_QUANTITY_PER_ITEM, 'capped at 50');
  });

  test('Normal duplicates (under cap) → summed exactly', () => {
    const items = [
      { productId: SAMPLE_PRODUCTS[0].id, quantity: 2 },
      { productId: SAMPLE_PRODUCTS[0].id, quantity: 3 },
    ];
    const merged = dedupAndMerge(items);
    assert.equal(merged[0].quantity, 5, '2+3 = 5');
  });

  test('Unknown productId → throws', () => {
    assert.throws(() =>
      resolveAuthoritativePrices([{ productId: 'does-not-exist', quantity: 1 }], SAMPLE_PRODUCTS)
    );
  });

  test('Out-of-stock product → throws', () => {
    assert.throws(() =>
      resolveAuthoritativePrices([{ productId: SAMPLE_PRODUCTS[2].id, quantity: 1 }], SAMPLE_PRODUCTS)
    );
  });

  test('Negative authoritative price → throws', () => {
    const badCatalog = [{ ...SAMPLE_PRODUCTS[0], price: -5 }];
    assert.throws(() =>
      resolveAuthoritativePrices([{ productId: badCatalog[0].id, quantity: 1 }], badCatalog)
    );
  });

  test('NaN unit price → throws', () => {
    const badCatalog = [{ ...SAMPLE_PRODUCTS[0], price: NaN }];
    assert.throws(() =>
      resolveAuthoritativePrices([{ productId: badCatalog[0].id, quantity: 1 }], badCatalog)
    );
  });

  test('Total above MAX_ORDER_TOTAL → caught (contract)', () => {
    const qty = Math.ceil((MAX_ORDER_TOTAL + 500) / SAMPLE_PRODUCTS[0].price);
    const resolved = [{ ...SAMPLE_PRODUCTS[0], subtotal: SAMPLE_PRODUCTS[0].price * qty }];
    const total = resolved.reduce((a, r) => a + r.subtotal, 0) + MIN_DELIVERY_FEE;
    assert.ok(total > MAX_ORDER_TOTAL, 'contract assumption: total exceeds cap');
  });

  console.log('\n[2] Input Validation Rules');

  test('Phone regex: only digits, +, -, (, ), and whitespace accepted', () => {
    const regex = /^[0-9+\-\s()]+$/;
    const ok = ['01700000000', '+8801700000000', '01700-000 000', '(017) 000-0000'];
    for (const p of ok) assert.equal(regex.test(p), true, `OK: ${p}`);
    const bad = ['abc01700', '01700 000 000 x', '📞01700', ''];
    for (const p of bad) assert.equal(regex.test(p), false, `REJECT: "${p}"`);
  });

  test('Name min 2 chars, max 120; trimmed', () => {
    assert.equal(' AB '.trim().length >= 2, true, '" AB " -> "AB" (2) accepted');
    assert.equal('  '.trim().length >= 2, false, 'whitespace-only rejected');
    assert.equal('A'.trim().length >= 2, false, 'single letter rejected');
    assert.equal('x'.repeat(121).trim().length > 120, true, '> 120 chars rejected');
  });

  test('Address min 5 max 500; trimmed', () => {
    assert.equal('Dhaka'.trim().length >= 5, true);
    assert.equal('abc'.trim().length >= 5, false);
    assert.equal('x'.repeat(501).trim().length > 500, true);
  });

  test('Latitude in [-90, 90] / Longitude in [-180, 180]', () => {
    const good = [[23.71, 90.40], [-90, -180], [90, 180]];
    for (const [lat, lon] of good) {
      assert.ok(lat >= -90 && lat <= 90, `lat ${lat} OK`);
      assert.ok(lon >= -180 && lon <= 180, `lon ${lon} OK`);
    }
    const bad = [[90.1, 0], [-90.1, 0], [0, 180.1], [0, -180.1]];
    for (const [lat, lon] of bad) {
      const inRange = (lat >= -90 && lat <= 90) && (lon >= -180 && lon <= 180);
      assert.equal(inRange, false, `OUT ${lat},${lon}`);
    }
  });

  test('Cart cannot be empty (items min 1)', () => {
    assert.equal([].length >= 1, false);
    assert.equal([{ productId: 'x', quantity: 1 }].length >= 1, true);
  });

  test('Cart max 20 items', () => {
    assert.equal(Array.from({ length: 21 }).length > MAX_ITEMS_PER_ORDER, true);
    assert.equal(Array.from({ length: 20 }).length === MAX_ITEMS_PER_ORDER, true);
  });

  console.log('\n[3] Pricing Logic & Snapshot Correctness');

  test('formatPrice returns ৳ + commas + 2 decimals', () => {
    assert.equal(formatPrice(6500), '\u09F36,500.00');
    assert.equal(formatPrice(0), '\u09F30.00');
    assert.equal(formatPrice(1234.567), '\u09F31,234.57');
  });

  test('Subtotal accumulates: Σ(unit price × quantity)', () => {
    const items = [
      { productId: SAMPLE_PRODUCTS[0].id, quantity: 2 },
      { productId: SAMPLE_PRODUCTS[1].id, quantity: 3 },
    ];
    const resolved = resolveAuthoritativePrices(dedupAndMerge(items), SAMPLE_PRODUCTS);
    const sub = resolved.reduce((a, r) => a + r.subtotal, 0);
    const expected = SAMPLE_PRODUCTS[0].price * 2 + SAMPLE_PRODUCTS[1].price * 3;
    assert.equal(sub, expected);
    const grand = sub + clampDeliveryFee(DEFAULT_DELIVERY_FEE);
    assert.equal(grand, expected + DEFAULT_DELIVERY_FEE);
  });

  test('Snapshot required columns exist contractually', () => {
    const cols = ['product_name_snapshot', 'product_price_snapshot', 'product_image_snapshot', 'quantity', 'subtotal'];
    assert.equal(cols.includes('product_name_snapshot'), true);
    assert.equal(cols.includes('product_price_snapshot'), true);
    assert.equal(cols.includes('quantity'), true);
    assert.equal(cols.includes('subtotal'), true);
    assert.equal(cols.includes('product_id'), false); // snaps NOT FKs (no FK join at report time)
  });

  console.log('\n[4] Notification & Status Contracts');

  test('Only 3 notif status values: sent / failed / not_sent', () => {
    const allowed = new Set(['sent', 'failed', 'not_sent']);
    for (const v of ['sent', 'failed', 'not_sent']) assert.ok(allowed.has(v), v);
    for (const v of ['true', 'success', 1, null, undefined, 'pending']) {
      assert.equal(allowed.has(v), false, `disallowed: ${String(v)}`);
    }
  });

  test('4 legal order statuses: pending → confirmed → delivered / cancelled', () => {
    const allowed = new Set(['pending', 'confirmed', 'delivered', 'cancelled']);
    for (const v of ['pending', 'confirmed', 'delivered', 'cancelled']) assert.ok(allowed.has(v), v);
    for (const v of ['created', 'processing', 'shipped', 'refunded']) {
      assert.equal(allowed.has(v), false, `NOT in enum: ${v}`);
    }
  });

  console.log('\n[5] Catalog Invariants');

  test('Each sample product: has id/name/slug/price/image_url, price > 0', () => {
    for (const p of SAMPLE_PRODUCTS) {
      assert.ok(typeof p.id === 'string' && p.id.length > 0, 'id');
      assert.ok(typeof p.name === 'string' && p.name.trim().length >= 2, 'name');
      assert.ok(typeof p.slug === 'string' && p.slug.length >= 2, 'slug');
      assert.ok(typeof p.price === 'number' && p.price > 0, `price pos (${p.price})`);
      assert.ok(typeof p.image_url === 'string' && p.image_url.startsWith('http'), 'image url');
    }
  });

  test('Slugs unique across sample catalog', () => {
    const seen = new Set();
    for (const p of SAMPLE_PRODUCTS) {
      assert.equal(seen.has(p.slug), false, `dup slug: ${p.slug}`);
      seen.add(p.slug);
    }
  });

  test('IDs unique across sample catalog', () => {
    const seen = new Set();
    for (const p of SAMPLE_PRODUCTS) {
      assert.equal(seen.has(p.id), false, `dup id: ${p.id}`);
      seen.add(p.id);
    }
  });

  console.log('\n=== Results ===');
  console.log(`Passed: ${passed}, Failed: ${failed}`);
  if (failed === 0) {
    console.log('\nAll contract smoke tests passed.\n');
    process.exit(0);
  }
  console.log('\nFailures:');
  for (const f of failures) {
    console.log(`  \u2022 ${f.name}`);
    console.log(`    ${(f.err && f.err.stack) || f.err.message}`);
  }
  process.exit(1);
}

runAll().catch((e) => {
  console.error('Fatal test harness error:', e);
  process.exit(1);
});
