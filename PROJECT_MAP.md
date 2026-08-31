# Mart Gallery — Project Architecture Map

This file provides a concise architectural roadmap of the Mart Gallery codebase.

---

## 1. Directory Structure & Responsibilities

```
martgallery/
├── app/
│   ├── (storefront)/               # Customer-facing storefront routes
│   │   ├── page.tsx                # Homepage (Hero, Featured, Hot, Category collections)
│   │   ├── products/               # Catalog & Search
│   │   │   ├── page.tsx            # Filterable product grid
│   │   │   └── [slug]/page.tsx     # Product details & image gallery
│   │   ├── cart/page.tsx           # Cart review
│   │   ├── checkout/page.tsx       # Checkout & Location picker
│   │   └── orders/[id]/page.tsx    # Order confirmation & status lookup
│   ├── (admin)/admin/              # Administrative control panel
│   │   ├── login/page.tsx          # Admin login
│   │   ├── layout.tsx              # Admin layout & auth guard
│   │   ├── page.tsx                # Dashboard metrics
│   │   ├── products/               # Product CRUD & stock management
│   │   ├── categories/             # Category management
│   │   └── orders/                 # Order processing & status updater
│   ├── api/                        # Server route handlers
│   │   ├── checkout/route.ts       # Authoritative order creation & snapshot recording
│   │   ├── admin/                  # Protected admin mutation APIs
│   │   └── upload/route.ts         # Image storage handler
│   ├── globals.css                 # Global styling & Tailwind directives
│   └── layout.tsx                  # Root layout with CartProvider
├── components/
│   ├── storefront/                 # Header, Footer, Hero, ProductCard, CartDrawer
│   ├── admin/                      # AdminNav, StatsCard, ProductForm, OrderStatusBadge
│   ├── common/                     # Button, Input, Modal, Badge, Toast
│   └── map/                        # Leaflet / OpenStreetMap client component
├── lib/
│   ├── context/
│   │   └── CartContext.tsx         # Pure React Context + localStorage cart
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client (@supabase/ssr)
│   │   ├── server.ts               # Server Component Supabase client
│   │   └── admin.ts                # Privileged Service-Role Supabase client
│   ├── notifications/
│   │   ├── sms.ts                  # SMS gateway adapter (Greenweb/BulkSMSBD/Mock)
│   │   └── email.ts                # Email gateway adapter (Resend/SMTP/Mock)
│   ├── validations/
│   │   ├── checkout.ts             # Zod schema for checkout inputs
│   │   └── product.ts              # Zod schema for products and categories
│   └── utils.ts                    # BDT currency formatter, WhatsApp link generator
├── types/
│   └── database.types.ts           # TypeScript database schema types
├── supabase/
│   └── migrations/
│       └── 20260825_initial_schema.sql # Database schema, RLS, storage & indexes
├── PLAN.md                         # Architecture & implementation blueprint
├── BUILD_GUIDE.md                  # Development & operations guide
└── PROJECT_MAP.md                  # Codebase architecture map
```

---

## 2. Core Data Flow

1. **Browsing**: Customer queries catalog via Next.js Server Components with direct Supabase public read access.
2. **Cart**: Managed client-side via `CartContext` with `localStorage` persistence.
3. **Checkout**: 
   - Client sends `{ customer, items: [{ productId, quantity }] }` to `/api/checkout`.
   - Server validates payload via Zod, queries authoritative prices and stock from Supabase DB.
   - Server inserts immutable records into `orders` and `order_items` (snapshots).
   - Server attempts synchronous SMS/Email dispatch and records actual delivery status.
   - Server responds with `{ orderNumber, total, whatsappUrl }`.
4. **Admin**: Authenticated admins manage products, categories, and order fulfillment protected by `is_admin()` RLS security.
