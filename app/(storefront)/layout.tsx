import React from 'react';
import { TopBar } from '@/components/storefront/TopBar';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { CartDrawer } from '@/components/storefront/CartDrawer';
import { getCategories } from '@/lib/supabase/queries';

export const revalidate = 60; // Revalidate every minute

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getCategories();

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-navy">
      <TopBar />
      <Header categories={categories} />
      <CartDrawer />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
