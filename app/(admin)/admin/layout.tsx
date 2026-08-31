import React from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <AdminSidebar />
      {/* Main content — offset for sidebar on desktop, top bar on mobile */}
      <div className="lg:pl-60 pt-14 lg:pt-0">
        <main className="min-h-screen p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
