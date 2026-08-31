'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShoppingBag, Search, Filter, MapPin, Phone, Mail, Clock,
  CheckCircle2, AlertCircle, MessageSquare, Loader2, ChevronDown,
  ChevronUp, X, Package, Save, MessageCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatPrice, formatDate } from '@/lib/utils';

type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';

interface OrderItem {
  id: string;
  product_name_snapshot: string;
  product_price_snapshot: number;
  product_image_snapshot: string | null;
  quantity: number;
  subtotal: number;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string;
  latitude: number | null;
  longitude: number | null;
  location_note: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  sms_status: string;
  email_status: string;
  notification_error: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
};

const NOTIF_STYLES: Record<string, string> = {
  sent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
  not_sent: 'bg-slate-50 text-slate-500 border-slate-200',
};

const STATUS_OPTIONS: { value: OrderStatus; label: string; icon: any; color: string }[] = [
  { value: 'pending', label: 'Pending', icon: Clock, color: 'text-amber-600' },
  { value: 'confirmed', label: 'Confirmed', icon: CheckCircle2, color: 'text-blue-600' },
  { value: 'delivered', label: 'Delivered', icon: Package, color: 'text-emerald-600' },
  { value: 'cancelled', label: 'Cancelled', icon: X, color: 'text-rose-600' },
];

export function OrdersManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      setOrders(data.orders || []);
      if (highlightId && !expandedId) {
        setTimeout(() => setExpandedId(highlightId), 100);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, highlightId, expandedId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setSavingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus, updated_at: new Date().toISOString() } : o));
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error updating status');
    } finally {
      setSavingId(null);
    }
  };

  const saveNotes = async (orderId: string) => {
    setSavingId(orderId);
    try {
      const notes = notesDraft[orderId] ?? '';
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: notes }),
      });
      if (!res.ok) throw new Error('Failed to save notes');
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, admin_notes: notes, updated_at: new Date().toISOString() } : o));
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error saving notes');
    } finally {
      setSavingId(null);
    }
  };

  const openWhatsApp = (order: Order) => {
    const cleanPhone = order.customer_phone.replace(/[^0-9]/g, '');
    const itemsText = order.order_items
      .map((item) => `• ${item.product_name_snapshot} x ${item.quantity} = ${formatPrice(item.subtotal)}`)
      .join('\n');
    const message = `🛍️ *Mart Gallery Order Follow-up*\n━━━━━━━━━━━━━━━━━━━━\n*Order ID:* #${order.order_number}\n*Status:* ${order.status.toUpperCase()}\n*Customer:* ${order.customer_name}\n\n*Items:*\n${itemsText}\n\n*Total:* ${formatPrice(order.total)}\n\nThank you for your order!`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    confirmed: orders.filter((o) => o.status === 'confirmed').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Orders</h1>
        <p className="text-xs text-slate-500 mt-1">Manage and fulfill customer orders</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={loadOrders} className="ml-auto underline">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { key: '', label: 'All Orders', count: counts.all, color: 'text-slate-700', bg: 'bg-slate-50', activeBg: 'bg-slate-200' },
            { key: 'pending', label: 'Pending', count: counts.pending, color: 'text-amber-700', bg: 'bg-amber-50', activeBg: 'bg-amber-100' },
            { key: 'confirmed', label: 'Confirmed', count: counts.confirmed, color: 'text-blue-700', bg: 'bg-blue-50', activeBg: 'bg-blue-100' },
            { key: 'delivered', label: 'Delivered', count: counts.delivered, color: 'text-emerald-700', bg: 'bg-emerald-50', activeBg: 'bg-emerald-100' },
            { key: 'cancelled', label: 'Cancelled', count: counts.cancelled, color: 'text-rose-700', bg: 'bg-rose-50', activeBg: 'bg-rose-100' },
          ].map((f) => (
            <button
              key={f.key || 'all'}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className={`p-4 rounded-xl border transition-all text-left ${
                statusFilter === f.key
                  ? `${f.activeBg} border-transparent shadow-sm ring-2 ring-offset-1 ring-brand-gold-400/50`
                  : `${f.bg} border-transparent hover:${f.activeBg}`
              }`}
            >
              <p className={`text-2xl font-extrabold ${f.color}`}>{f.count}</p>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5 uppercase tracking-wider">{f.label}</p>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order number, phone, or name..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-3 text-brand-gold-500 animate-spin" />
          <p className="text-xs text-slate-400">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-bold text-slate-600">No orders found</p>
          <p className="text-xs text-slate-400 mt-1">
            {statusFilter || searchQuery ? 'Try adjusting filters or search.' : 'Orders placed by customers will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                highlightId === order.id ? 'ring-2 ring-brand-gold-400 border-brand-gold-300' : 'border-slate-200'
              }`}
            >
              <div className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    order.status === 'delivered' ? 'bg-emerald-50' :
                    order.status === 'confirmed' ? 'bg-blue-50' :
                    order.status === 'cancelled' ? 'bg-rose-50' : 'bg-amber-50'
                  }`}>
                    <ShoppingBag className={`w-5 h-5 ${
                      order.status === 'delivered' ? 'text-emerald-600' :
                      order.status === 'confirmed' ? 'text-blue-600' :
                      order.status === 'cancelled' ? 'text-rose-600' : 'text-amber-600'
                    }`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold text-slate-900">#{order.order_number}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize border ${STATUS_STYLES[order.status]}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">{order.customer_name}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 flex-wrap">
                      <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{order.customer_phone}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(order.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 sm:ml-4">
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-slate-900">{formatPrice(order.total)}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{order.order_items.length} items</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    className="p-2 text-slate-400 hover:text-brand-navy hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    {expandedId === order.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {expandedId === order.id && (
                <div className="border-t border-slate-100 bg-slate-50/50">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 p-5 sm:p-6">
                    <div className="lg:col-span-2 space-y-5">
                      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                        <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-brand-gold-600" />
                          Delivery Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Customer</p>
                            <p className="text-xs font-bold text-slate-800">{order.customer_name}</p>
                            <p className="text-[11px] text-slate-500 inline-flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{order.customer_phone}</p>
                            {order.customer_email && (
                              <p className="text-[11px] text-slate-500 inline-flex items-center gap-1 mt-0.5 ml-2"><Mail className="w-3 h-3" />{order.customer_email}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Delivery Address</p>
                            <p className="text-xs text-slate-700">{order.delivery_address}</p>
                            {order.location_note && (
                              <p className="text-[11px] text-amber-600 mt-1 bg-amber-50 border border-amber-100 rounded px-2 py-1 inline-block">
                                Note: {order.location_note}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                        <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-brand-gold-600" />
                          Order Items
                        </h3>
                        <div className="space-y-2">
                          {order.order_items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 p-2.5 bg-slate-50/70 rounded-lg">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {item.product_image_snapshot ? (
                                  <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                    <img src={item.product_image_snapshot} alt="" className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                    <Package className="w-4 h-4 text-slate-400" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-slate-800 truncate">{item.product_name_snapshot}</p>
                                  <p className="text-[11px] text-slate-500">
                                    {formatPrice(item.product_price_snapshot)} × {item.quantity}
                                  </p>
                                </div>
                              </div>
                              <p className="text-xs font-bold text-slate-800 shrink-0">{formatPrice(item.subtotal)}</p>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-slate-100 pt-3 mt-3 space-y-1.5">
                          <div className="flex justify-between text-[11px] text-slate-500">
                            <span>Subtotal</span>
                            <span>{formatPrice(order.subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-500">
                            <span>Delivery Fee</span>
                            <span>{formatPrice(order.delivery_fee)}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-slate-100">
                            <span className="text-xs font-bold text-slate-800">Grand Total</span>
                            <span className="text-xs font-extrabold text-brand-gold-700">{formatPrice(order.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                        <h3 className="text-xs font-bold text-slate-700">Update Status</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {STATUS_OPTIONS.map((opt) => {
                            const Icon = opt.icon;
                            const active = order.status === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => updateOrderStatus(order.id, opt.value)}
                                disabled={savingId === order.id || active}
                                className={`p-2.5 rounded-lg border text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 ${
                                  active
                                    ? `${STATUS_STYLES[opt.value]} ring-2 ring-offset-1 ring-brand-gold-400/40`
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50'
                                }`}
                              >
                                {savingId === order.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Icon className={`w-3.5 h-3.5 ${active ? opt.color : 'text-slate-400'}`} />
                                )}
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                        <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-brand-gold-600" />
                          Notification Status
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                            <span className="text-[11px] font-semibold text-slate-600">SMS</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize border ${NOTIF_STYLES[order.sms_status] || NOTIF_STYLES.not_sent}`}>
                              {order.sms_status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                            <span className="text-[11px] font-semibold text-slate-600">Email</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize border ${NOTIF_STYLES[order.email_status] || NOTIF_STYLES.not_sent}`}>
                              {order.email_status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        {order.notification_error && (
                          <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg">
                            <p className="text-[10px] font-semibold text-rose-700 mb-0.5">Delivery Error</p>
                            <p className="text-[10px] text-rose-600 font-mono break-all">{order.notification_error}</p>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => openWhatsApp(order)}
                          className="w-full mt-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Contact via WhatsApp
                        </button>
                      </div>

                      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-slate-700">Admin Notes</h3>
                          {(notesDraft[order.id] !== undefined || order.admin_notes) &&
                            ((notesDraft[order.id] ?? '') !== (order.admin_notes ?? '')) && (
                            <button
                              type="button"
                              onClick={() => saveNotes(order.id)}
                              disabled={savingId === order.id}
                              className="text-[11px] font-bold text-brand-gold-600 hover:text-brand-navy inline-flex items-center gap-1 disabled:opacity-60"
                            >
                              {savingId === order.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Save className="w-3 h-3" />
                              )}
                              Save
                            </button>
                          )}
                        </div>
                        <textarea
                          rows={4}
                          value={notesDraft[order.id] ?? order.admin_notes ?? ''}
                          onChange={(e) => setNotesDraft({ ...notesDraft, [order.id]: e.target.value })}
                          placeholder="Add private notes about this order..."
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:border-transparent focus:bg-white resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
