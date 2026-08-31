import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { ProductDetailView } from '@/components/storefront/ProductDetailView';
import { ProductCard } from '@/components/storefront/ProductCard';
import { getProductBySlug, getCategories, getRelatedProducts } from '@/lib/supabase/queries';

export const revalidate = 60;

interface ProductDetailPageProps {
  params: {
    slug: string;
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const [categories, relatedProducts] = await Promise.all([
    getCategories(),
    getRelatedProducts(product.id, product.category_id, 4),
  ]);

  const category = categories.find((c) => c.id === product.category_id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-brand-navy transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-brand-navy transition-colors">
          Products
        </Link>
        {category && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              href={`/categories/${category.slug}`}
              className="hover:text-brand-navy transition-colors"
            >
              {category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Interactive Product View */}
      <ProductDetailView product={product} categoryName={category?.name} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="pt-8 border-t border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">You May Also Like</h2>
            <Link
              href="/products"
              className="text-xs font-semibold text-brand-gold-600 hover:text-brand-navy transition-colors"
            >
              View All Products
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
