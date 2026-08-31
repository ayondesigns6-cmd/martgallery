import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { MOCK_CATEGORIES } from '@/lib/data/mock-data';
import { ProductForm } from '@/components/admin/ProductForm';

export const revalidate = 0;

async function getCategories() {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await (adminClient.from('categories') as any).select('id, name').order('display_order');
    if (!error && data) return data;
  } catch {}
  return MOCK_CATEGORIES.map((c) => ({ id: c.id, name: c.name }));
}

export default async function AdminNewProductPage() {
  const categories = await getCategories();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Add New Product</h1>
        <p className="text-xs text-slate-500 mt-1">Create a new product listing for your catalog.</p>
      </div>
      <ProductForm mode="create" categories={categories} />
    </div>
  );
}
