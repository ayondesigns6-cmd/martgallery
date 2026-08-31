'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Plus, Pencil, Save, Trash2, X, Loader2, GripVertical, Check, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  displayOrder: string;
}

export function CategoriesManager({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Category>>({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [newCategory, setNewCategory] = useState<CategoryFormData>({ name: '', slug: '', description: '', displayOrder: '0' });
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (showNewForm && newCategory.name && !newCategory.slug) {
      const timer = setTimeout(() => {
        setNewCategory((prev) => ({
          ...prev,
          slug: prev.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, ''),
        }));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [newCategory.name, showNewForm, newCategory.slug]);

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      display_order: cat.display_order,
    });
    setShowNewForm(false);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
    setError(null);
  };

  const saveEdit = async (catId: string) => {
    if (!editData.name || !editData.slug) {
      setError('Name and slug are required');
      return;
    }
    setLoading(catId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories/${catId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editData.name,
          slug: editData.slug,
          description: editData.description || null,
          displayOrder: editData.display_order ?? 0,
        }),
      });
      if (!res.ok) throw new Error('Failed to update category');
      setEditingId(null);
      setEditData({});
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error updating category');
    } finally {
      setLoading(null);
    }
  };

  const createCategory = async () => {
    if (!newCategory.name || !newCategory.slug) {
      setError('Name and slug are required');
      return;
    }
    setLoading('new');
    setError(null);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategory.name,
          slug: newCategory.slug,
          description: newCategory.description || null,
          displayOrder: parseInt(newCategory.displayOrder) || 0,
        }),
      });
      if (!res.ok) throw new Error('Failed to create category');
      setShowNewForm(false);
      setNewCategory({ name: '', slug: '', description: '', displayOrder: '0' });
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error creating category');
    } finally {
      setLoading(null);
    }
  };

  const deleteCategory = async (catId: string) => {
    if (!confirm('Delete this category? This action cannot be undone.')) return;
    setLoading(catId);
    try {
      const res = await fetch(`/api/admin/categories/${catId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete category');
      setCategories((prev) => prev.filter((c) => c.id !== catId));
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error deleting category');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Categories</h1>
          <p className="text-xs text-slate-500 mt-1">{categories.length} product categories</p>
        </div>
        <button
          type="button"
          onClick={() => { setShowNewForm(true); setEditingId(null); setError(null); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-navy text-brand-gold-400 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add New Category
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {showNewForm && (
        <div className="bg-brand-gold-50 border-2 border-brand-gold-300 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-gold-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-brand-navy">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-bold">New Category</span>
            </div>
            <button
              type="button"
              onClick={() => { setShowNewForm(false); setError(null); }}
              className="text-slate-500 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Name *</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Electronics"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Slug *</label>
              <input
                type="text"
                value={newCategory.slug}
                onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value.toLowerCase() })}
                placeholder="electronics"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:border-transparent font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Display Order</label>
              <input
                type="number"
                value={newCategory.displayOrder}
                onChange={(e) => setNewCategory({ ...newCategory, displayOrder: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:border-transparent font-mono"
              />
            </div>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-1 lg:items-end">
              <button
                type="button"
                onClick={createCategory}
                disabled={loading === 'new'}
                className="flex-1 px-4 py-2 text-xs font-bold bg-brand-navy text-brand-gold-400 rounded-lg hover:bg-slate-800 disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
              >
                {loading === 'new' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description</label>
              <textarea
                rows={2}
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Category description..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <Tag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p>No categories yet. Create your first category above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {categories.map((cat) => (
              <div key={cat.id} className="px-6 py-4">
                {editingId === cat.id ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-start">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Name</label>
                      <input
                        type="text"
                        value={editData.name || ''}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Slug</label>
                      <input
                        type="text"
                        value={editData.slug || ''}
                        onChange={(e) => setEditData({ ...editData, slug: e.target.value.toLowerCase() })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:border-transparent font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Order</label>
                      <input
                        type="number"
                        value={editData.display_order ?? 0}
                        onChange={(e) => setEditData({ ...editData, display_order: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:border-transparent font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-1 flex gap-2 lg:items-end">
                      <button
                        type="button"
                        onClick={() => saveEdit(cat.id)}
                        disabled={loading === cat.id}
                        className="flex-1 px-3 py-2 text-xs font-bold bg-brand-gold-600 text-brand-dark rounded-lg hover:bg-brand-gold-500 disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
                      >
                        {loading === cat.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-5">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Description</label>
                      <textarea
                        rows={2}
                        value={editData.description || ''}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg bg-brand-gold-100 text-brand-gold-700 flex items-center justify-center shrink-0">
                        <Tag className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-slate-900">{cat.name}</p>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-mono">
                            Order {cat.display_order}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">/{cat.slug}</p>
                        {cat.description && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{cat.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(cat)}
                        disabled={loading === cat.id}
                        className="p-2 text-slate-500 hover:text-brand-navy hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit category"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCategory(cat.id)}
                        disabled={loading === cat.id}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
