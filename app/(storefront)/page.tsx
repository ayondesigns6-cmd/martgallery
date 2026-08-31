import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Flame, Grid } from 'lucide-react';
import { HeroSection } from '@/components/storefront/HeroSection';
import { TrustBadges } from '@/components/storefront/TrustBadges';
import { ProductCard } from '@/components/storefront/ProductCard';
import { CategoryCard } from '@/components/storefront/CategoryCard';
import { getCategories, getProducts } from '@/lib/supabase/queries';

export const revalidate = 60;

export default async function HomePage() {
  const [categories, featuredProducts, hotProducts] = await Promise.all([
    getCategories(),
    getProducts({ isFeatured: true, limit: 4 }),
    getProducts({ isHot: true, limit: 4 }),
  ]);

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Banner */}
      <HeroSection />

      {/* Trust Badges */}
      <TrustBadges />

      {/* Featured Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-brand-gold-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Grid className="w-3.5 h-3.5" />
              <span>Explore Categories</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Curated Collections
            </h2>
          </div>
          <Link
            href="/products"
            className="text-xs sm:text-sm font-bold text-brand-navy hover:text-brand-gold-600 flex items-center gap-1 transition-colors"
          >
            <span>View Full Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-brand-gold-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Handpicked Selection</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Featured Essentials
            </h2>
          </div>
          <Link
            href="/products?featured=true"
            className="text-xs sm:text-sm font-bold text-brand-navy hover:text-brand-gold-600 flex items-center gap-1 transition-colors"
          >
            <span>Browse All Featured</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Hot Deals Showcase */}
      {hotProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-brand-navy via-slate-900 to-brand-dark rounded-3xl p-6 sm:p-10 border border-slate-800 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
              <div>
                <div className="flex items-center space-x-2 text-red-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Flame className="w-4 h-4" />
                  <span>Limited Time Opportunities</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Hot Deals & Special Offers
                </h2>
              </div>
              <Link
                href="/products?hot=true"
                className="text-xs sm:text-sm font-bold text-brand-gold-400 hover:text-brand-gold-300 flex items-center gap-1 transition-colors"
              >
                <span>View All Deals</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {hotProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Value Proposition Statement */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-brand-gold-50 border border-brand-gold-200/60 rounded-2xl p-8 sm:p-12 text-center max-w-4xl mx-auto">
          <h3 className="text-xl sm:text-2xl font-extrabold text-brand-navy">
            Experience the Mart Gallery Standard
          </h3>
          <p className="mt-3 text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Every product in our collection is curated for longevity, aesthetic distinction, and proven functionality. Enjoy nationwide delivery across Bangladesh with cash on delivery convenience.
          </p>
          <div className="mt-6">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-navy text-white text-xs font-bold hover:bg-brand-slate transition-colors shadow-sm"
            >
              <span>Explore All Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
