import { NextRequest, NextResponse } from 'next/server';
import { checkoutSchema, MAX_PRICE_PER_ITEM, MIN_DELIVERY_FEE, MAX_DELIVERY_FEE, DEFAULT_DELIVERY_FEE, MAX_QUANTITY_PER_ITEM, MAX_ORDER_TOTAL } from '@/lib/validations/checkout';
import { createAdminClient } from '@/lib/supabase/admin';
import { MOCK_PRODUCTS } from '@/lib/data/mock-data';
import { generateOrderNumber, generateWhatsAppLink, formatPrice } from '@/lib/utils';
import { getSmsProvider } from '@/lib/notifications/sms';
import { getEmailProvider } from '@/lib/notifications/email';
import { notifyNewOrderAdmin } from '@/lib/notifications/order-notifications';
import { Order, OrderItem } from '@/types/database.types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = checkoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid order input data.',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const {
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      latitude,
      longitude,
      locationNote,
      items,
    } = validation.data;

    const rawDeliveryFee = typeof body.deliveryFee === 'number' ? body.deliveryFee : DEFAULT_DELIVERY_FEE;
    const deliveryFee = Math.max(MIN_DELIVERY_FEE, Math.min(MAX_DELIVERY_FEE, rawDeliveryFee));

    // 1. Deduplicate product IDs by merging quantities (defense against duplicate tampering)
    const dedupedItems = new Map<string, { productId: string; quantity: number }>();
    for (const item of items) {
      const existing = dedupedItems.get(item.productId);
      const mergedQty = Math.min(
        MAX_QUANTITY_PER_ITEM,
        (existing?.quantity || 0) + item.quantity
      );
      dedupedItems.set(item.productId, { productId: item.productId, quantity: mergedQty });
    }
    const normalizedItems = Array.from(dedupedItems.values());

    // 2. Authoritative price & stock lookup from DB / Mock fallback
    const productIds = normalizedItems.map((i) => i.productId);
    let dbProducts: any[] = [];

    try {
      const adminClient = createAdminClient();
      const { data, error } = await (adminClient.from('products') as any)
        .select('*')
        .in('id', productIds);

      if (!error && data && data.length > 0) {
        dbProducts = data;
      }
    } catch {
      // Fallback if DB connection is unavailable
    }

    // Merge DB products with Mock products if needed
    const resolvedItems = normalizedItems.map((item) => {
      const found =
        dbProducts.find((p) => p.id === item.productId) ||
        MOCK_PRODUCTS.find((p) => p.id === item.productId);

      if (!found) {
        throw new Error(`Product ID ${item.productId} was not found in catalog.`);
      }

      if (found.availability && found.availability !== 'in_stock') {
        throw new Error(`Product "${found.name}" is currently out of stock.`);
      }

      const unitPrice = Number(found.price);
      if (!isFinite(unitPrice) || unitPrice < 0 || unitPrice > MAX_PRICE_PER_ITEM) {
        throw new Error(`Product "${found.name}" has an invalid price.`);
      }
      const subtotal = unitPrice * item.quantity;

      return {
        productId: found.id,
        name: found.name,
        price: unitPrice,
        imageUrl: found.image_url,
        quantity: item.quantity,
        subtotal,
      };
    });

    // 3. Authoritative Price Calculations with Bounds
    const calculatedSubtotal = resolvedItems.reduce((acc, i) => acc + i.subtotal, 0);
    const grandTotal = calculatedSubtotal + deliveryFee;

    if (!isFinite(grandTotal) || grandTotal <= 0) {
      throw new Error('Invalid order total.');
    }
    if (grandTotal > MAX_ORDER_TOTAL) {
      throw new Error(`Order total exceeds maximum of ${formatPrice(MAX_ORDER_TOTAL)}. Place multiple orders.`);
    }

    const orderNumber = generateOrderNumber();

    // 3. Insert Order into Supabase
    let createdOrderId = `ord-${Date.now()}`;
    let dbInsertSuccess = false;

    try {
      const adminClient = createAdminClient();
      const { data: orderData, error: orderError } = await (adminClient.from('orders') as any)
        .insert({
          order_number: orderNumber,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail || null,
          delivery_address: deliveryAddress,
          latitude: latitude || null,
          longitude: longitude || null,
          location_note: locationNote || null,
          subtotal: calculatedSubtotal,
          delivery_fee: deliveryFee,
          total: grandTotal,
          status: 'pending',
          sms_status: 'not_sent',
          email_status: 'not_sent',
        })
        .select('id')
        .single();

      if (!orderError && orderData) {
        createdOrderId = orderData.id;
        dbInsertSuccess = true;

        // Insert Order Items Snapshot
        const orderItemsPayload = resolvedItems.map((item) => ({
          order_id: createdOrderId,
          product_id: item.productId,
          product_name_snapshot: item.name,
          product_price_snapshot: item.price,
          product_image_snapshot: item.imageUrl,
          quantity: item.quantity,
          subtotal: item.subtotal,
        }));

        await (adminClient.from('order_items') as any).insert(orderItemsPayload);
      }
    } catch (err: any) {
      console.warn('[Checkout API] Supabase write notice:', err.message);
    }

    // 4. Synchronous Notifications & Accurate Status Tracking
    let smsStatus: 'sent' | 'failed' | 'not_sent' = 'not_sent';
    let emailStatus: 'sent' | 'failed' | 'not_sent' = 'not_sent';
    let notificationError: string | null = null;

    // Send SMS to customer
    try {
      const smsProvider = getSmsProvider();
      const itemList = resolvedItems.map((i) => `${i.name} x${i.quantity}`).join(', ');
      const smsMessage = `Mart Gallery: Order #${orderNumber} received! ${itemList.slice(0, 80)}. Total: ${formatPrice(grandTotal)}. Track via WhatsApp.`;
      const smsRes = await smsProvider.sendSms({
        to: customerPhone,
        message: smsMessage,
      });
      smsStatus = smsRes.success ? 'sent' : 'failed';
      if (!smsRes.success) notificationError = `SMS: ${smsRes.error}`;
    } catch (err: any) {
      smsStatus = 'failed';
      notificationError = `SMS Exception: ${err.message}`;
    }

    // Send Email if email provided (rich format with item table)
    if (customerEmail) {
      try {
        const itemsRows = resolvedItems.map((i) => `
          <tr>
            <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">
              <div style="font-weight:600;">${i.name}</div>
              <div style="font-size:11px;color:#64748b;">${formatPrice(i.price)} × ${i.quantity}</div>
            </td>
            <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">
              ${formatPrice(i.subtotal)}
            </td>
          </tr>
        `).join('');
        const emailProvider = getEmailProvider();
        const emailRes = await emailProvider.sendEmail({
          to: customerEmail,
          subject: `Mart Gallery - Invoice #${orderNumber}`,
          html: `
            <div style="font-family:system-ui,Arial,sans-serif;max-width:640px;margin:0 auto;">
              <div style="background:#0f172a;color:#f59e0b;padding:24px;border-radius:16px 16px 0 0;">
                <h1 style="margin:0;font-size:22px;">Thank you, ${customerName}!</h1>
                <p style="margin:6px 0 0;color:#d4a44a;font-size:13px;">Your order has been received.</p>
              </div>
              <div style="padding:28px;background:white;border:1px solid #e2e8f0;border-radius:0 0 16px 16px;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
                  <div style="padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                    <p style="margin:0 0 4px;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Order ID</p>
                    <p style="margin:0;font-weight:700;color:#0f172a;">#${orderNumber}</p>
                  </div>
                  <div style="padding:12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;">
                    <p style="margin:0 0 4px;font-size:10px;color:#92400e;text-transform:uppercase;letter-spacing:0.05em;">Amount Due (COD)</p>
                    <p style="margin:0;font-weight:800;color:#92400e;">${formatPrice(grandTotal)}</p>
                  </div>
                </div>
                <h3 style="margin:0 0 10px;font-size:14px;color:#0f172a;">Order Items</h3>
                <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
                  <thead>
                    <tr style="background:#f1f5f9;">
                      <th style="padding:10px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Product</th>
                      <th style="padding:10px;text-align:right;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>${itemsRows}</tbody>
                </table>
                <div style="border-top:2px solid #e2e8f0;padding-top:14px;display:grid;gap:6px;margin-bottom:20px;">
                  <div style="display:flex;justify-content:space-between;font-size:12px;color:#64748b;">
                    <span>Subtotal</span><span>${formatPrice(calculatedSubtotal)}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:12px;color:#64748b;">
                    <span>Delivery Fee</span><span>${formatPrice(deliveryFee)}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:800;color:#0f172a;margin-top:4px;">
                    <span>Grand Total</span><span style="color:#b45309;">${formatPrice(grandTotal)}</span>
                  </div>
                </div>
                <div style="padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                  <p style="margin:0 0 4px;font-size:11px;color:#64748b;font-weight:600;">Delivery Address</p>
                  <p style="margin:0;font-size:13px;color:#0f172a;">${deliveryAddress}</p>
                  ${locationNote ? `<p style="margin:6px 0 0;font-size:12px;color:#92400e;">Note: ${locationNote}</p>` : ''}
                </div>
              </div>
            </div>
          `,
        });
        emailStatus = emailRes.success ? 'sent' : 'failed';
        if (!emailRes.success) {
          notificationError = notificationError
            ? `${notificationError} | Email: ${emailRes.error}`
            : `Email: ${emailRes.error}`;
        }
      } catch (err: any) {
        emailStatus = 'failed';
        if (!notificationError) notificationError = `Email Exception: ${err.message}`;
      }
    }

    // Fire admin notification email in parallel (non-blocking)
    const notifCtx = {
      id: createdOrderId,
      order_number: orderNumber,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail || null,
      delivery_address: deliveryAddress,
      subtotal: calculatedSubtotal,
      delivery_fee: deliveryFee,
      total: grandTotal,
      status: 'pending' as const,
      order_items: resolvedItems.map((i) => ({
        product_name_snapshot: i.name,
        product_price_snapshot: i.price,
        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
    };
    // Do not await to avoid blocking the response; errors are logged internally
    notifyNewOrderAdmin(notifCtx).catch(() => {});

    // Update order status tracking in database
    if (dbInsertSuccess) {
      try {
        const adminClient = createAdminClient();
        await (adminClient.from('orders') as any)
          .update({
            sms_status: smsStatus,
            email_status: emailStatus,
            notification_error: notificationError,
          })
          .eq('id', createdOrderId);
      } catch {
        // Ignore background tracking write error
      }
    }

    // 5. Generate Formatted WhatsApp Confirmation URL
    const rawStorePhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '8801676711783';
    const storePhone = rawStorePhone.replace(/[^0-9]/g, '');
    const whatsappUrl = generateWhatsAppLink(storePhone, {
      orderNumber,
      customerName,
      total: grandTotal,
      address: deliveryAddress,
      items: resolvedItems.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
    });

    return NextResponse.json({
      success: true,
      orderId: createdOrderId,
      orderNumber,
      total: grandTotal,
      whatsappUrl,
      smsStatus,
      emailStatus,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Server failed to process order.',
      },
      { status: 500 }
    );
  }
}