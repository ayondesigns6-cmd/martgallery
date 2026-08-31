'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertCircle,
  Phone,
  User,
  Mail,
  MapPin,
  FileText,
  Loader2,
} from 'lucide-react';
import { useCart } from '@/lib/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { DynamicLocationPicker } from '@/components/map/MapWrapper';
import { checkoutSchema } from '@/lib/validations/checkout';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, itemCount, clearCart } = useCart();

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deliveryAddress: '',
    locationNote: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const [deliveryArea, setDeliveryArea] = useState<'inside_dhaka' | 'outside_dhaka'>('inside_dhaka');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const deliveryFee = deliveryArea === 'inside_dhaka' ? 60 : 120;
  const grandTotal = subtotal + deliveryFee;

  const handleLocationChange = (loc: { latitude: number; longitude: number; address?: string }) => {
    setFormData((prev) => ({
      ...prev,
      latitude: loc.latitude,
      longitude: loc.longitude,
      deliveryAddress: prev.deliveryAddress || loc.address || '',
    }));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError(null);

    // Validate payload with Zod
    const payload = {
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerEmail: formData.customerEmail || undefined,
      deliveryAddress: formData.deliveryAddress,
      latitude: formData.latitude,
      longitude: formData.longitude,
      locationNote: formData.locationNote || undefined,
      items: items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      })),
    };

    const validation = checkoutSchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          deliveryFee,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to place order. Please try again.');
      }

      clearCart();
      router.push(`/orders/${data.orderNumber}?new=true`);
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred. Please contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-12 max-w-md mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Your cart is empty</h2>
          <p className="text-xs text-slate-500 mt-2">
            Please add items to your cart before proceeding to checkout.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-brand-navy text-white text-xs font-bold rounded-lg hover:bg-brand-slate transition-colors"
          >
            <span>Browse Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 pb-44 lg:pb-10">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Order Checkout</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete your delivery details. Cash on delivery available across Bangladesh.
        </p>
      </div>

      {submitError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <form id="checkout-form" onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: Customer Details & Map (8 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Customer Personal Details */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 space-y-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <User className="w-4 h-4 text-brand-gold-600" />
              <span>Customer Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanvir Hossain"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    inputMode="text"
                    autoComplete="name"
                    className={`w-full pl-9 pr-3 py-3 text-xs sm:text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:bg-white transition-all ${
                      errors.customerName ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-200'
                    }`}
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                </div>
                {errors.customerName && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.customerName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="017XXXXXXXX"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    inputMode="tel"
                    autoComplete="tel"
                    className={`w-full pl-9 pr-3 py-3 text-xs sm:text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:bg-white transition-all ${
                      errors.customerPhone ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-200'
                    }`}
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                </div>
                {errors.customerPhone && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.customerPhone}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address <span className="text-slate-400 font-normal">(Optional for invoice)</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  inputMode="email"
                  autoComplete="email"
                  className={`w-full pl-9 pr-3 py-3 text-xs sm:text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:bg-white transition-all ${
                    errors.customerEmail ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-200'
                  }`}
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
              </div>
              {errors.customerEmail && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.customerEmail}</p>
              )}
            </div>
          </div>

          {/* Delivery Location & Map */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 space-y-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-brand-gold-600" />
              <span>Delivery Address & Location Pin</span>
            </h2>

            {/* Delivery Region Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Delivery Region:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryArea('inside_dhaka')}
                  className={`p-3 sm:p-4 rounded-xl border text-left flex items-center justify-between transition-all active:scale-[0.98] ${
                    deliveryArea === 'inside_dhaka'
                      ? 'border-brand-gold-600 bg-brand-gold-50/50 ring-1 ring-brand-gold-500'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Inside Dhaka</span>
                    <span className="text-[11px] text-slate-500">Regular Delivery: ৳60</span>
                  </div>
                  {deliveryArea === 'inside_dhaka' && (
                    <CheckCircle2 className="w-4 h-4 text-brand-gold-600" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryArea('outside_dhaka')}
                  className={`p-3 sm:p-4 rounded-xl border text-left flex items-center justify-between transition-all active:scale-[0.98] ${
                    deliveryArea === 'outside_dhaka'
                      ? 'border-brand-gold-600 bg-brand-gold-50/50 ring-1 ring-brand-gold-500'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Outside Dhaka</span>
                    <span className="text-[11px] text-slate-500">Nationwide Courier: ৳120</span>
                  </div>
                  {deliveryArea === 'outside_dhaka' && (
                    <CheckCircle2 className="w-4 h-4 text-brand-gold-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Interactive Map Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Pin Location on Map:
              </label>
              <DynamicLocationPicker onLocationChange={handleLocationChange} />
            </div>

            {/* Full Street Address Text */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Delivery Address <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="House / Flat / Road / Area details..."
                value={formData.deliveryAddress}
                onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                className={`w-full p-3 text-xs sm:text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:bg-white transition-all ${
                  errors.deliveryAddress ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-200'
                }`}
              />
              {errors.deliveryAddress && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.deliveryAddress}</p>
              )}
            </div>

            {/* Location Note / Landmark */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Special Delivery Instructions <span className="text-slate-400 font-normal">(Optional landmark / floor)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Near City Bank, 3rd Floor Apt 4B"
                  value={formData.locationNote}
                  onChange={(e) => setFormData({ ...formData, locationNote: e.target.value })}
                  className="w-full pl-9 pr-3 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:bg-white"
                />
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Placement (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 lg:sticky lg:top-24">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs font-semibold text-brand-gold-600 bg-brand-gold-50 px-2 py-0.5 rounded-full">
                {itemCount} Items
              </span>
            </h2>

            {/* Item List Preview */}
            <div className="max-h-52 sm:max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1">
              {items.map((item) => (
                <div key={item.id} className="py-3 flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="48px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-slate-800 line-clamp-1">{item.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-brand-navy whitespace-nowrap">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Cost Breakdown */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge ({deliveryArea === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}):</span>
                <span className="font-semibold text-slate-900">{formatPrice(deliveryFee)}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Total Payable:</span>
                <span className="text-xl sm:text-2xl font-extrabold text-brand-navy whitespace-nowrap">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {/* Payment Method Notice */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Payment Method: <strong>Cash on Delivery</strong> (Pay upon receiving package)</span>
            </div>

            {/* Place Order CTA Button - visible only on desktop; duplicated as sticky bottom on mobile */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="hidden lg:flex w-full py-3.5 px-6 rounded-xl bg-brand-navy text-brand-gold-400 hover:bg-slate-800 text-sm font-bold items-center justify-center gap-2 shadow-lg shadow-brand-navy/10 transition-all disabled:opacity-50 active:scale-[0.99] min-h-[48px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Order...</span>
                </>
              ) : (
                <>
                  <span>Confirm Order & Place Request</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Guarantees */}
            <div className="space-y-2 pt-2 text-[11px] text-slate-500 hidden sm:block">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand-gold-600 shrink-0" />
                <span>Fast nationwide dispatch within 24-48 hours</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Genuine original products guaranteed</span>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Mobile Sticky Bottom Bar: Total + CTA (always visible on small screens) */}
      <div className="lg:hidden fixed left-0 right-0 bottom-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 shadow-[0_-4px_14px_rgba(15,23,42,0.08)]">
        <div className="px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total</p>
              <p className="text-lg font-extrabold text-brand-navy whitespace-nowrap">{formatPrice(grandTotal)}</p>
            </div>
            <button
              type="submit"
              form="checkout-form"
              disabled={isSubmitting}
              className="flex-1 max-w-xs min-h-[48px] py-3 px-4 rounded-xl bg-brand-navy text-brand-gold-400 hover:bg-slate-800 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-navy/10 transition-all disabled:opacity-60 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Place Order</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Pay cash on delivery — No payment now</span>
          </div>
        </div>
      </div>
    </div>
  );
}