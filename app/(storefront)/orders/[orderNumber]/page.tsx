import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  Package,
  XCircle,
} from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatPrice, formatDate, generateWhatsAppLink } from '@/lib/utils';
import { Order, OrderItem } from '@/types/database.types';

export const revalidate = 0; // Fresh lookup on every render

interface OrderPageProps {
  params: {
    orderNumber: string;
  };
  searchParams: {
    new?: string;
  };
}

async function getOrderDetails(orderNumber: string): Promise<{ order: Order; items: OrderItem[] } | null> {
  try {
    const adminClient = createAdminClient();
    const { data: order, error: orderError } = await (adminClient.from('orders') as any)
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (!orderError && order) {
      const { data: items } = await (adminClient.from('order_items') as any)
        .select('*')
        .eq('order_id', (order as Order).id);

      return { order: order as Order, items: (items || []) as OrderItem[] };
    }
  } catch {
    // Fallback if DB offline
  }

  return null;
}

export default async function OrderConfirmationPage({ params, searchParams }: OrderPageProps) {
  const isNewOrder = searchParams.new === 'true';
  const orderData = await getOrderDetails(params.orderNumber);

  const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '8801700000000';

  const order = orderData?.order;
  const items = orderData?.items || [];

  // Generate WhatsApp confirmation URL if order is found
  const whatsappUrl = order
    ? generateWhatsAppLink(whatsappPhone, {
        orderNumber: order.order_number,
        customerName: order.customer_name,
        total: order.total,
        address: order.delivery_address,
        items: items.map((i) => ({
          name: i.product_name_snapshot,
          quantity: i.quantity,
          price: Number(i.product_price_snapshot),
        })),
      })
    : `https://wa.me/${whatsappPhone}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Banner if freshly placed */}
      {isNewOrder && (
        <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-center sm:text-left">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold">Order Received Successfully!</h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                Thank you! Your order ID is <strong>#{params.orderNumber}</strong>.
              </p>
            </div>
          </div>
          <Link
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition-colors shadow shrink-0 flex items-center gap-2"
          >
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>Instant WhatsApp Confirmation</span>
          </Link>
        </div>
      )}

      {/* Main Order Card */}
      {order ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-8 shadow-sm">
          {/* Header & Status Pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Order Invoice Reference
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                #{order.order_number}
              </h1>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Placed on {formatDate(order.created_at)}</span>
              </p>
            </div>

            {/* Status Badge */}
            <div className="shrink-0 self-start sm:self-center">
              {order.status === 'pending' && (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                  <span>Status: Pending Review</span>
                </span>
              )}
              {order.status === 'confirmed' && (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>Status: Order Confirmed</span>
                </span>
              )}
              {order.status === 'delivered' && (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Status: Delivered</span>
                </span>
              )}
              {order.status === 'cancelled' && (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Status: Cancelled</span>
                </span>
              )}
            </div>
          </div>

          {/* Customer & Delivery Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs text-slate-700">
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Customer Details
              </h3>
              <p><strong>Name:</strong> {order.customer_name}</p>
              <p><strong>Phone:</strong> {order.customer_phone}</p>
              {order.customer_email && <p><strong>Email:</strong> {order.customer_email}</p>}
            </div>

            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Delivery Address
              </h3>
              <p className="leading-relaxed flex items-start gap-1.5">
                <MapPin className="w-4 h-4 text-brand-gold-600 shrink-0 mt-0.5" />
                <span>{order.delivery_address}</span>
              </p>
              {order.location_note && (
                <p className="text-slate-500 italic mt-1">Note: {order.location_note}</p>
              )}
            </div>
          </div>

          {/* Itemized Snapshot Breakdown */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Ordered Items
            </h3>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {items.length === 0 ? (
                <div className="p-4 text-xs text-slate-500 italic">No item snapshots recorded.</div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      {item.product_image_snapshot && (
                        <div className="relative w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                          <Image
                            src={item.product_image_snapshot}
                            alt={item.product_name_snapshot}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{item.product_name_snapshot}</h4>
                        <p className="text-[11px] text-slate-500">
                          {formatPrice(item.product_price_snapshot)} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-brand-navy">
                      {formatPrice(item.subtotal)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
            <div className="text-slate-500 space-y-1">
              <p>Payment Method: <strong className="text-slate-800">Cash on Delivery</strong></p>
              <p>Delivery Fee: <strong className="text-slate-800">{formatPrice(order.delivery_fee)}</strong></p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 block">Total Amount Payable:</span>
              <span className="text-2xl font-extrabold text-brand-navy">{formatPrice(order.total)}</span>
            </div>
          </div>

          {/* Direct WhatsApp Action Button */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
            <Link
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold text-center flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Contact Store Support on WhatsApp</span>
            </Link>

            <Link
              href="/products"
              className="py-3.5 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold text-center transition-colors"
            >
              Back to Catalog
            </Link>
          </div>
        </div>
      ) : (
        /* Order Lookup Box when directly accessed or order number not found in DB */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-6 text-center max-w-md mx-auto shadow-sm">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-brand-gold-600 mx-auto">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Order Reference Lookup</h2>
            <p className="text-xs text-slate-500 mt-1">
              Order ID <strong>#{params.orderNumber}</strong> has been logged. For live tracking or instant assistance, connect with our support team.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <Link
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Confirm via WhatsApp Hotline</span>
            </Link>

            <Link
              href="/products"
              className="w-full py-3 px-6 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold block transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}