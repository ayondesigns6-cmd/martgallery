import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Shield, Flame } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative bg-brand-dark text-white overflow-hidden py-16 sm:py-24 border-b border-brand-slate">
      {/* Subtle Background Glow Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-gold-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          {/* Tag Pill */}
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-brand-navy border border-brand-gold-500/30 text-brand-gold-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Premium Retail in Bangladesh</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight sm:leading-none">
            Refined Living. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold-400 to-amber-200">
              Uncompromising Quality.
            </span>
          </h1>

          <p className="mt-6 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Explore authentic audio gear, luxury timepieces, artisan leather, and modern lifestyle essentials with cash on delivery and verified nationwide dispatch.
          </p>

          <div className="mt-8 flex flex-wrap gap-4 items-center">
            <Link
              href="/products"
              className="px-7 py-3.5 rounded-lg bg-brand-gold-600 hover:bg-brand-gold-500 text-brand-dark font-bold text-sm flex items-center gap-2 shadow-lg shadow-brand-gold-600/20 transition-all hover:scale-[1.02]"
            >
              <span>Shop All Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/products?hot=true"
              className="px-7 py-3.5 rounded-lg bg-brand-navy hover:bg-slate-800 text-white border border-slate-700 font-semibold text-sm flex items-center gap-2 transition-colors"
            >
              <Flame className="w-4 h-4 text-red-400" />
              <span>Hot Deals</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
