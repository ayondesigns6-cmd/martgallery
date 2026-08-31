import React from 'react';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '@/lib/data/mock-data';
import { ProductForm } from '@/components/admin/ProductForm';

export const revalidate = 0;

async function getProduct(productId: string) {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await (adminClient.from('products') as any)
      .select('*')
      .eq('id', productId)
      .single();
    if (!error && data) return data;
  } catch {}
  const mock = MOCK_PRODUCTS.find((p) => p.id === productId);
  return mock || null;
}

async function getCategories() {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await (adminClient.from('categories') as any).select('id, name').order('display_order');
    if (!error && data) return data;
  } catch {}
  return MOCK_CATEGORIES.map((c) => ({ id: c.id, name: c.name }));
}

export default async function AdminEditProductPage({ params }: { params: { productId: string } }) {
  const [product, categories] = await Promise.all([getProduct(params.productId), getCategories()]);

  if (!product) {
    notFound();
  }

  const initialData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    compareAtPrice: product.compare_at_price,
    categoryId: product.category_id,
    imageUrl: product.image_url,
    galleryImages: product.gallery_images || [],
    shortDescription: product.short_description,
    fullDescription: product.full_description,
    isFeatured: product.is_featured,
    isHot: product.is_hot,
    availability: product.availability,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Edit Product</h1>
        <p className="text-xs text-slate-500 mt-1">Update product details and listing configuration.</p>
      </div>
      <ProductForm mode="edit" initialData={initialData} categories={categories} />
    </div>
  );
}
