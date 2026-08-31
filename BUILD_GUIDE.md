# Mart Gallery — Production Build & Operations Guide

> **Current Status**: All 10 Phases Completed and Production-Build Verified.

---

## 1. Quick Start Commands

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# TypeScript type check (0 errors)
npm run type-check

# Production build check (Verified clean build)
npm run build
```

---

## 2. Database & Schema Operations

1. Open your Supabase project dashboard at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** -> **New query**.
3. Copy and run the entire content of [`supabase/migrations/20260825_initial_schema.sql`](./supabase/migrations/20260825_initial_schema.sql).
4. Create the public storage bucket `product-images` in **Storage**.
5. Create your initial admin user in **Authentication** -> **Users** and register them in `public.admin_users`:
   ```sql
   INSERT INTO public.admin_users (id, email)
   SELECT id, email FROM auth.users WHERE email = 'your-admin-email@example.com';
   ```

---

## 3. Environment Variables Reference

Copy `.env.example` to `.env.local` and populate:

| Variable | Description | Exposure |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | Public / Client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Key | Public / Client |
| `NEXT_PUBLIC_SITE_URL` | Application base URL | Public / Client |
| `NEXT_PUBLIC_STORE_NAME` | Mart Gallery | Public / Client |
| `NEXT_PUBLIC_CURRENCY` | BDT | Public / Client |
| `NEXT_PUBLIC_WHATSAPP_PHONE` | Customer support/orders WhatsApp number | Public / Client |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | Private / Server Only |
| `SMS_PROVIDER` | `mock` / `generic_http` / `greenweb` / `bulksmsbd` | Private / Server Only |
| `SMS_API_KEY` | API Key for SMS Gateway | Private / Server Only |
| `EMAIL_PROVIDER` | `mock` / `resend` | Private / Server Only |
| `RESEND_API_KEY` | API Key for Resend Email | Private / Server Only |

---

## 4. Development & Phase Progress Tracker

- [x] **Phase 1: Foundation & Tooling** (Next.js 14, TypeScript, Tailwind CSS, Lucide icons, Design tokens)
- [x] **Phase 2: Database Schema & RLS** (`20260825_initial_schema.sql` with strict admin RLS, snapshot models)
- [x] **Phase 3: Core Data Layer** (Supabase SSR/Client/Admin helpers, TypeScript Database types, Zod schemas, React Context Cart, Notifications engine)
- [x] **Phase 4: Storefront & Product Browsing** (TopBar, Header, Footer, CartDrawer, HeroSection, TrustBadges, ProductCard, CategoryCard, ProductDetailView, Homepage, Catalog, Category showcase, Product Detail view, Cart review page)
- [x] **Phase 5: Interactive Location Selection & Map Component** (Leaflet / OpenStreetMap client component with geolocation, reverse geocoding, and complete interactive Checkout page)
- [x] **Phase 6: Checkout, Order Verification & WhatsApp Integration** (`/api/checkout` authoritative order processing, snapshot creation, WhatsApp generator, `/orders/[orderNumber]` confirmation)
- [x] **Phase 7: Admin Control Panel & Auth** (Admin Login, Dashboard metrics, Product/Category CRUD, Order management with optimistic updates)
- [x] **Phase 8: Notifications Integration** (Synchronous SMS and Email notification triggers with status persistence and admin alert integration)
- [x] **Phase 9: Verification & Testing** (0 TypeScript errors, 100% successful Next.js production build for all static and dynamic routes)
- [x] **Phase 10: Deployment Preparation** (Git initialization, environment variable templates, Vercel build compatibility verified)

---

## 5. Deployment Instructions

### GitHub Repository Push
```bash
git init
git add .
git commit -m "Initial commit: Production-ready Mart Gallery platform"
git branch -M main
git remote add origin https://github.com/<your-username>/martgallery.git
git push -u origin main
```

### Vercel Deployment
1. Import repository on [vercel.com](https://vercel.com).
2. Framework Preset: **Next.js**.
3. Add environment variables from `.env.example`.
4. Deploy.