import React from 'react';
import Link from 'next/link';
import { Sparkles, Flame, SlidersHorizontal, Search, RefreshCw } from 'lucide-react';
import { ProductCard } from '@/components/storefront/ProductCard';
import { getCategories, getProducts } from '@/lib/supabase/queries';

export const revalidate = 60;

interface ProductsPageProps {
  searchParams: {
    category?: string;
    search?: string;
    featured?: string;
    hot?: string;
    sort?: 'price-asc' | 'price-desc' | 'newest' | 'name';
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category, search, featured, hot, sort = 'newest' } = searchParams;

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({
      categorySlug: category,
      search,
      isFeatured: featured === 'true' ? true : undefined,
      isHot: hot === 'true' ? true : undefined,
      sort,
    }),
  ]);

  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
            {activeCategory
              ? activeCategory.name
              : featured === 'true'
              ? 'Featured Collection'
              : hot === 'true'
              ? 'Hot Deals & Offers'
              : search
              ? `Search results for "${search}"`
              : 'All Products'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Showing {products.length} {products.length === 1 ? 'item' : 'items'} in our catalog
          </p>
        </div>

        {/* Quick Filter Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/products"
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              !category && !featured && !hot
                ? 'bg-brand-navy text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Items
          </Link>
          <Link
            href="/products?featured=true"
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors ${
              featured === 'true'
                ? 'bg-brand-navy text-brand-gold-400'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-gold-500" />
            <span>Featured</span>
          </Link>
          <Link
            href="/products?hot=true"
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors ${
              hot === 'true'
                ? 'bg-red-500 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-red-500" />
            <span>Hot Deals</span>
          </Link>
        </div>
      </div>

      {/* Category Pills & Sorting Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        {/* Category Horizontal Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Category:
          </span>
          {categories.map((cat) => {
            const isActive = category === cat.slug;
            return (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}${sort ? `&sort=${sort}` : ''}`}
                className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-all ${
                  isActive
                    ? 'bg-brand-gold-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Sort by:</span>
          <div className="flex gap-1 text-xs">
            <Link
              href={`/products?${category ? `category=${category}&` : ''}${
                search ? `search=${search}&` : ''
              }sort=newest`}
              className={`px-2 py-1 rounded ${
                sort === 'newest' ? 'bg-slate-200 font-bold text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Newest
            </Link>
            <Link
              href={`/products?${category ? `category=${category}&` : ''}${
                search ? `search=${search}&` : ''
              }sort=price-asc`}
              className={`px-2 py-1 rounded ${
                sort === 'price-asc' ? 'bg-slate-200 font-bold text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Price: Low-High
            </Link>
            <Link
              href={`/products?${category ? `category=${category}&` : ''}${
                search ? `search=${search}&` : ''
              }sort=price-desc`}
              className={`px-2 py-1 rounded ${
                sort === 'price-desc' ? 'bg-slate-200 font-bold text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Price: High-Low
            </Link>
          </div>
        </div>
      </div>

      {/* Product Grid or Empty State */}
      {products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No products found</h3>
          <p className="text-xs text-slate-500 mt-1">
            We could not find any products matching your current filters.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-navy text-white text-xs font-semibold rounded-lg hover:bg-brand-slate transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
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
