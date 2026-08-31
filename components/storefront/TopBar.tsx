import React from 'react';
import Link from 'next/link';
import { Phone, ShieldCheck, Truck } from 'lucide-react';

export function TopBar() {
  const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '8801700000000';

  return (
    <div className="bg-brand-dark text-slate-300 text-xs py-2 border-b border-brand-slate/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center space-x-4">
          <span className="flex items-center text-brand-gold-400 font-medium">
            <Truck className="w-3.5 h-3.5 mr-1.5" />
            Fast Delivery Across Bangladesh
          </span>
          <span className="hidden md:inline-block text-slate-500">|</span>
          <span className="hidden md:flex items-center text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            100% Authentic Guaranteed
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href={`https://wa.me/${whatsappPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center hover:text-brand-gold-400 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            <span>Order Assistance via WhatsApp</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
