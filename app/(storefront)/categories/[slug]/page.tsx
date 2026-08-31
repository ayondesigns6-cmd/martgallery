import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { ProductCard } from '@/components/storefront/ProductCard';
import { getCategoryBySlug, getProducts } from '@/lib/supabase/queries';

export const revalidate = 60;

interface CategoryPageProps {
  params: {
    slug: string;
  };
  searchParams: {
    sort?: 'price-asc' | 'price-desc' | 'newest' | 'name';
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const category = await getCategoryBySlug(params.slug);

  if (!category) {
    notFound();
  }

  const { sort = 'newest' } = searchParams;
  const products = await getProducts({
    categorySlug: params.slug,
    sort,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-brand-navy transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-brand-navy transition-colors">
          Products
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-semibold">{category.name}</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-gold-600">
            Category Showcase
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-1">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl leading-relaxed">
              {category.description}
            </p>
          )}
        </div>

        {/* Sorting Bar */}
        <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs shrink-0 self-start md:self-auto">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-500 font-medium">Sort:</span>
          <Link
            href={`/categories/${params.slug}?sort=newest`}
            className={`px-2 py-1 rounded ${
              sort === 'newest' ? 'bg-white shadow-xs font-bold text-slate-900' : 'text-slate-600'
            }`}
          >
            Newest
          </Link>
          <Link
            href={`/categories/${params.slug}?sort=price-asc`}
            className={`px-2 py-1 rounded ${
              sort === 'price-asc' ? 'bg-white shadow-xs font-bold text-slate-900' : 'text-slate-600'
            }`}
          >
            Price: Low-High
          </Link>
          <Link
            href={`/categories/${params.slug}?sort=price-desc`}
            className={`px-2 py-1 rounded ${
              sort === 'price-desc' ? 'bg-white shadow-xs font-bold text-slate-900' : 'text-slate-600'
            }`}
          >
            Price: High-Low
          </Link>
        </div>
      </div>

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12">
          <h3 className="text-base font-bold text-slate-900">No items currently available</h3>
          <p className="text-xs text-slate-500 mt-1">
            We are actively stocking new arrivals for {category.name}.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-navy text-white text-xs font-semibold rounded-lg hover:bg-brand-slate transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Browse All Collections</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
