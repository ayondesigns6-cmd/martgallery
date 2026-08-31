import React from 'react';
import Link from 'next/link';
import { ArrowRight, Layers } from 'lucide-react';
import { Category } from '@/types/database.types';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group relative bg-white p-6 rounded-xl border border-slate-200/80 hover:border-brand-gold-500/50 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
    >
      <div>
        <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-brand-navy flex items-center justify-center text-slate-700 group-hover:text-brand-gold-400 transition-colors mb-4">
          <Layers className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-navy transition-colors">
          {category.name}
        </h3>
        {category.description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {category.description}
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-gold-600 group-hover:text-brand-navy transition-colors">
        <span>Explore Collection</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}
