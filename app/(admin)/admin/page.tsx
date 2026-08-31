import React from 'react';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { Package, ShoppingBag, Tag, AlertTriangle, TrendingUp, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '@/lib/data/mock-data';

export const revalidate = 0;

async function getDashboardStats() {
  try {
    const adminClient = createAdminClient();

    const [
      { count: totalProducts },
      { count: totalCategories },
      { count: pendingOrders },
      { count: totalOrders },
      { data: recentOrders },
      { data: outOfStockProducts },
    ] = await Promise.all([
      (adminClient.from('products') as any).select('*', { count: 'exact', head: true }),
      (adminClient.from('categories') as any).select('*', { count: 'exact', head: true }),
      (adminClient.from('orders') as any).select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      (adminClient.from('orders') as any).select('*', { count: 'exact', head: true }),
      (adminClient.from('orders') as any)
        .select('id, order_number, customer_name, customer_phone, total, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      (adminClient.from('products') as any)
        .select('id, name, availability')
        .eq('availability', 'out_of_stock')
        .limit(5),
    ]);

    return {
      totalProducts: totalProducts ?? MOCK_PRODUCTS.length,
      totalCategories: totalCategories ?? MOCK_CATEGORIES.length,
      pendingOrders: pendingOrders ?? 0,
      totalOrders: totalOrders ?? 0,
      recentOrders: recentOrders ?? [],
      outOfStockProducts: outOfStockProducts ?? [],
    };
  } catch {
    return {
      totalProducts: MOCK_PRODUCTS.length,
      totalCategories: MOCK_CATEGORIES.length,
      pendingOrders: 0,
      totalOrders: 0,
      recentOrders: [],
      outOfStockProducts: [],
    };
  }
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-rose-100 text-rose-800',
};

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    { label: 'Total Products', value: stats.totalProducts, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Categories', value: stats.totalCategories, icon: Tag, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
        <p className="text-xs text-slate-500 mt-1">Welcome back. Here is what is happening with your store today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-xs text-brand-gold-600 hover:text-brand-navy font-semibold flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats.recentOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>No orders yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {stats.recentOrders.map((order: any) => (
                <Link
                  key={order.id}
                  href={`/admin/orders?highlight=${order.id}`}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-brand-navy">
                      #{order.order_number}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {order.customer_name} · {order.customer_phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-xs font-bold text-slate-900">{formatPrice(order.total)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${STATUS_STYLES[order.status] || 'bg-slate-100 text-slate-700'}`}>
                      {order.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Alerts Panel */}
        <div className="space-y-4">
          {/* Out of Stock */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900">Out of Stock</h2>
            </div>
            {stats.outOfStockProducts.length === 0 ? (
              <div className="p-5 text-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto mb-1" />
                <p className="text-xs text-slate-400">All products in stock.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {stats.outOfStockProducts.map((p: any) => (
                  <div key={p.id} className="px-5 py-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-300 shrink-0" />
                    <p className="text-xs text-slate-700 font-medium truncate">{p.name}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="px-5 py-3 border-t border-slate-100">
              <Link href="/admin/products" className="text-xs text-brand-gold-600 font-semibold hover:text-brand-navy">
                Manage Products →
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-brand-navy rounded-2xl p-5 space-y-3">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Quick Actions</h2>
            <Link
              href="/admin/products/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-gold-600 text-brand-dark rounded-xl text-xs font-bold hover:bg-brand-gold-500 transition-colors"
            >
              <Package className="w-4 h-4" />
              <span>Add New Product</span>
            </Link>
            <Link
              href="/admin/orders"
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white rounded-xl text-xs font-semibold hover:bg-white/20 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>View Pending Orders</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
