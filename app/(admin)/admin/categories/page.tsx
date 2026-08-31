import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { MOCK_CATEGORIES } from '@/lib/data/mock-data';
import { CategoriesManager } from '@/components/admin/CategoriesManager';

export const revalidate = 0;

async function getCategories() {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await (adminClient.from('categories') as any)
      .select('*')
      .order('display_order', { ascending: true });
    if (!error && data && data.length > 0) return data;
  } catch {}
  return MOCK_CATEGORIES;
}

export default async function AdminCategoriesPage() {
  const categories = await getCategories();
  return <CategoriesManager initialCategories={categories} />;
}
