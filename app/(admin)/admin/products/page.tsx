import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatPrice } from '@/lib/utils';
import { MOCK_PRODUCTS } from '@/lib/data/mock-data';
import { Plus, Pencil, Flame, Sparkles, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AdminProductToggle } from '@/components/admin/AdminProductToggle';

export const revalidate = 0;

async function getProducts() {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await (adminClient.from('products') as any)
      .select('*, categories(name)')
      .order('created_at', { ascending: false });
    if (!error && data && data.length > 0) return data;
  } catch {}
  return MOCK_PRODUCTS.map(p => ({ ...p, categories: null }));
}

const AVAILABILITY_STYLES: Record<string, string> = {
  in_stock: 'bg-emerald-100 text-emerald-800',
  out_of_stock: 'bg-rose-100 text-rose-800',
  pre_order: 'bg-blue-100 text-blue-800',
  discontinued: 'bg-slate-100 text-slate-600',
};

export default async function AdminProductsPage() {
  const products = await getProducts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Products</h1>
          <p className="text-xs text-slate-500 mt-1">{products.length} products in catalog</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-navy text-brand-gold-400 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Product</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Price</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Badges</th>
                <th className="px-5 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map((product: any) => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{product.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-slate-600">
                      {product.categories?.name || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <span className="text-xs font-bold text-slate-900">{formatPrice(product.price)}</span>
                      {product.compare_at_price && (
                        <span className="text-[11px] text-slate-400 line-through ml-1.5">{formatPrice(product.compare_at_price)}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${AVAILABILITY_STYLES[product.availability] || 'bg-slate-100 text-slate-700'}`}>
                      {product.availability.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <AdminProductToggle
                        productId={product.id}
                        field="is_featured"
                        value={product.is_featured}
                        label="Featured"
                        activeIcon={<Sparkles className="w-3 h-3 text-brand-gold-500" />}
                      />
                      <AdminProductToggle
                        productId={product.id}
                        field="is_hot"
                        value={product.is_hot}
                        label="Hot"
                        activeIcon={<Flame className="w-3 h-3 text-red-500" />}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="p-10 text-center text-xs text-slate-400">
              <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No products yet. Add your first product.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
