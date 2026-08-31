'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

export const DynamicLocationPicker = dynamic(
  () => import('./LocationPicker').then((mod) => mod.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 sm:h-72 w-full rounded-xl border border-slate-200 bg-slate-100 flex flex-col items-center justify-center text-slate-400 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-brand-gold-600" />
        <span className="text-xs font-semibold">Loading Map Engine...</span>
      </div>
    ),
  }
);