'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Flame, Sparkles, Check } from 'lucide-react';
import { Product } from '@/types/database.types';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/lib/context/CartContext';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = React.useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      imageUrl: product.image_url,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const isAvailable = product.availability === 'in_stock';
  const discountPercent =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
      : null;

  return (
    <div className="group bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden">
      {/* Image & Badges */}
      <Link href={`/products/${product.slug}`} className="relative aspect-square bg-slate-100 overflow-hidden block">
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Floating Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.is_hot && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white shadow-sm">
              <Flame className="w-3 h-3 mr-0.5" />
              HOT
            </span>
          )}
          {product.is_featured && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-navy text-brand-gold-400 shadow-sm border border-brand-gold-500/20">
              <Sparkles className="w-3 h-3 mr-0.5 text-brand-gold-400" />
              FEATURED
            </span>
          )}
          {discountPercent && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-sm">
              -{discountPercent}%
            </span>
          )}
        </div>

        {!isAvailable && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-3 py-1 bg-white text-slate-800 text-xs font-bold rounded-md uppercase tracking-wider shadow">
              {product.availability.replace('_', ' ')}
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/products/${product.slug}`}>
            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-brand-gold-600 transition-colors line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {product.short_description}
          </p>
        </div>

        <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-base font-bold text-brand-navy">
                {formatPrice(product.price)}
              </span>
              {product.compare_at_price && (
                <span className="text-xs text-slate-400 line-through">
                  {formatPrice(product.compare_at_price)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium block">
              {isAvailable ? 'In Stock' : 'Unavailable'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isAvailable}
            className={`p-2.5 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
              added
                ? 'bg-emerald-600 text-white'
                : isAvailable
                ? 'bg-brand-navy text-white hover:bg-brand-gold-600 hover:text-white shadow-sm'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            aria-label="Add to cart"
          >
            {added ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
