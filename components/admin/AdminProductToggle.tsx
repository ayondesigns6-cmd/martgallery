'use client';

import React, { useOptimistic, useTransition } from 'react';

interface AdminProductToggleProps {
  productId: string;
  field: 'is_featured' | 'is_hot';
  value: boolean;
  label: string;
  activeIcon: React.ReactNode;
}

export function AdminProductToggle({ productId, field, value, label, activeIcon }: AdminProductToggleProps) {
  const [optimisticValue, setOptimisticValue] = useOptimistic(value);
  const [isPending, startTransition] = useTransition();

  const handleToggle = async () => {
    startTransition(async () => {
      setOptimisticValue(!optimisticValue);
      try {
        await fetch(`/api/admin/products/${productId}/toggle`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ field, value: !value }),
        });
      } catch {
        // Revert handled by optimistic state reset
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      title={`Toggle ${label}`}
      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
        optimisticValue
          ? 'bg-brand-gold-100 text-brand-gold-800 border border-brand-gold-300'
          : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
      } ${isPending ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
    >
      {optimisticValue ? activeIcon : null}
      <span>{label}</span>
    </button>
  );
}
