'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Phone, Plus, Minus, Check, Shield, Truck, RotateCcw, Flame, Sparkles } from 'lucide-react';
import { Product } from '@/types/database.types';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/lib/context/CartContext';

interface ProductDetailViewProps {
  product: Product;
  categoryName?: string;
}

export function ProductDetailView({ product, categoryName }: ProductDetailViewProps) {
  const { addItem, openCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(product.image_url);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const images = [product.image_url, ...(product.gallery_images || [])].filter(
    (val, idx, self) => self.indexOf(val) === idx && Boolean(val)
  );

  const isAvailable = product.availability === 'in_stock';
  const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '8801700000000';

  const discountPercent =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
      : null;

  const handleAddToCart = () => {
    addItem(
      {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        imageUrl: product.image_url,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleDirectBuy = () => {
    addItem(
      {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        imageUrl: product.image_url,
      },
      quantity
    );
    openCart();
  };

  const directWhatsAppUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
    `Hello Mart Gallery! I want to order:\n• *Product:* ${product.name}\n• *Price:* ${formatPrice(
      product.price
    )}\n• *Quantity:* ${quantity}\nPlease confirm availability and delivery details.`
  )}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 lg:p-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
        {/* Left: Images */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-xl bg-slate-100 border border-slate-200 overflow-hidden">
            <Image
              src={selectedImage}
              alt={product.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {product.is_hot && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-500 text-white shadow-md">
                  <Flame className="w-3.5 h-3.5 mr-1" />
                  HOT DEAL
                </span>
              )}
              {product.is_featured && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-brand-navy text-brand-gold-400 shadow-md border border-brand-gold-500/30">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-brand-gold-400" />
                  FEATURED
                </span>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                    selectedImage === img
                      ? 'border-brand-gold-600 ring-2 ring-brand-gold-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Image src={img} alt={`${product.name} ${idx + 1}`} fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & Controls */}
        <div className="flex flex-col justify-between">
          <div className="space-y-6">
            {categoryName && (
              <span className="text-xs font-bold uppercase tracking-wider text-brand-gold-600 bg-brand-gold-50 px-3 py-1 rounded-full">
                {categoryName}
              </span>
            )}

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {product.name}
            </h1>

            {/* Pricing Section */}
            <div className="flex items-baseline space-x-3 pb-4 border-b border-slate-100">
              <span className="text-3xl font-extrabold text-brand-navy">
                {formatPrice(product.price)}
              </span>
              {product.compare_at_price && (
                <span className="text-base text-slate-400 line-through">
                  {formatPrice(product.compare_at_price)}
                </span>
              )}
              {discountPercent && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  Save {discountPercent}%
                </span>
              )}
            </div>

            {/* Short Description */}
            <p className="text-sm text-slate-600 leading-relaxed">
              {product.short_description}
            </p>

            {/* Availability */}
            <div className="flex items-center space-x-2 text-xs font-semibold">
              <span className="text-slate-500">Status:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full ${
                  isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {isAvailable ? 'In Stock — Ready to Dispatch' : product.availability.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            {/* Quantity and Actions */}
            {isAvailable && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center space-x-4">
                  <span className="text-xs font-semibold text-slate-700">Quantity:</span>
                  <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 text-slate-600 hover:text-brand-navy"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 text-sm font-bold text-slate-900 min-w-[32px] text-center">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 text-slate-600 hover:text-brand-navy"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className={`py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      added
                        ? 'bg-emerald-600 text-white'
                        : 'bg-brand-navy text-white hover:bg-slate-800 shadow-md'
                    }`}
                  >
                    {added ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                    <span>{added ? 'Added to Cart' : 'Add to Cart'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDirectBuy}
                    className="py-3.5 px-6 rounded-xl font-bold text-sm bg-brand-gold-600 text-brand-dark hover:bg-brand-gold-500 shadow-md transition-colors"
                  >
                    Buy Now
                  </button>
                </div>

                {/* Direct WhatsApp Ordering */}
                <Link
                  href={directWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl border border-emerald-500/30 bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 flex items-center justify-center gap-2 transition-colors mt-2"
                >
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>Order Directly via WhatsApp</span>
                </Link>
              </div>
            )}
          </div>

          {/* Micro Guarantees */}
          <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center">
              <Truck className="w-5 h-5 text-brand-gold-600 mb-1" />
              <span className="text-[11px] font-bold text-slate-800">Nationwide Delivery</span>
              <span className="text-[10px] text-slate-400">2-4 Days</span>
            </div>
            <div className="flex flex-col items-center">
              <Shield className="w-5 h-5 text-brand-gold-600 mb-1" />
              <span className="text-[11px] font-bold text-slate-800">100% Genuine</span>
              <span className="text-[10px] text-slate-400">Verified Quality</span>
            </div>
            <div className="flex flex-col items-center">
              <RotateCcw className="w-5 h-5 text-brand-gold-600 mb-1" />
              <span className="text-[11px] font-bold text-slate-800">7-Day Return</span>
              <span className="text-[10px] text-slate-400">Hassle Free</span>
            </div>
          </div>
        </div>
      </div>

      {/* Full Description Section */}
      <div className="mt-12 pt-8 border-t border-slate-100">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Detailed Product Description</h3>
        <div className="prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed space-y-4">
          <p>{product.full_description}</p>
        </div>
      </div>
    </div>
  );
}
