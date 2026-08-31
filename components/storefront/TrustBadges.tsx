import React from 'react';
import { Truck, ShieldCheck, RefreshCw, Headphones } from 'lucide-react';

export function TrustBadges() {
  const items = [
    {
      icon: Truck,
      title: 'Fast Delivery Across BD',
      desc: 'Swift door-to-door delivery with live updates',
    },
    {
      icon: ShieldCheck,
      title: '100% Genuine Products',
      desc: 'Every product strictly checked for quality',
    },
    {
      icon: RefreshCw,
      title: '7-Day Easy Returns',
      desc: 'Hassle-free replacement policy',
    },
    {
      icon: Headphones,
      title: 'Dedicated WhatsApp Support',
      desc: 'Direct human support for every order inquiry',
    },
  ];

  return (
    <section className="py-12 bg-white border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-brand-gold-600 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
