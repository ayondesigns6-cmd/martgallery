'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Save, Loader2, X, Plus, ArrowLeft, Trash2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface ProductFormData {
  name: string;
  slug: string;
  price: string;
  compareAtPrice: string;
  categoryId: string;
  imageUrl: string;
  galleryImages: string[];
  shortDescription: string;
  fullDescription: string;
  isFeatured: boolean;
  isHot: boolean;
  availability: 'in_stock' | 'out_of_stock' | 'pre_order' | 'discontinued';
}

const AVAILABILITY_OPTIONS = [
  { value: 'in_stock', label: 'In Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
  { value: 'pre_order', label: 'Pre Order' },
  { value: 'discontinued', label: 'Discontinued' },
];

interface ProductFormProps {
  initialData?: Partial<ProductFormData> & { id?: string };
  mode: 'create' | 'edit';
  categories: Category[];
}

export function ProductForm({ initialData, mode, categories }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [form, setForm] = useState<ProductFormData>({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    price: initialData?.price !== undefined ? String(initialData.price) : '',
    compareAtPrice: initialData?.compareAtPrice !== undefined ? String(initialData.compareAtPrice || '') : '',
    categoryId: initialData?.categoryId || '',
    imageUrl: initialData?.imageUrl || '',
    galleryImages: initialData?.galleryImages || [],
    shortDescription: initialData?.shortDescription || '',
    fullDescription: initialData?.fullDescription || '',
    isFeatured: initialData?.isFeatured || false,
    isHot: initialData?.isHot || false,
    availability: (initialData?.availability as any) || 'in_stock',
  });

  useEffect(() => {
    if (mode === 'create') {
      const handleNameToSlug = () => {
        setForm((prev) => ({
          ...prev,
          slug: prev.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, ''),
        }));
      };
      if (form.name && !initialData?.slug) {
        const timer = setTimeout(handleNameToSlug, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [form.name, mode, initialData?.slug]);

  const update = <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addGalleryImage = () => {
    if (!newGalleryUrl.trim()) return;
    update('galleryImages', [...form.galleryImages, newGalleryUrl.trim()]);
    setNewGalleryUrl('');
  };

  const removeGalleryImage = (idx: number) => {
    update('galleryImages', form.galleryImages.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        price: parseFloat(form.price),
        compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : null,
        categoryId: form.categoryId || null,
        imageUrl: form.imageUrl,
        galleryImages: form.galleryImages,
        shortDescription: form.shortDescription,
        fullDescription: form.fullDescription,
        isFeatured: form.isFeatured,
        isHot: form.isHot,
        availability: form.availability,
      };

      const url = mode === 'create'
        ? '/api/admin/products'
        : `/api/admin/products/${initialData?.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-navy"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-xs font-bold bg-brand-navy text-brand-gold-400 rounded-xl hover:bg-slate-800 disabled:opacity-60 inline-flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? 'Saving...' : mode === 'create' ? 'Create Product' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 text-slate-700">
              <Package className="w-4 h-4 text-brand-gold-600" />
              <h2 className="text-sm font-bold">Product Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Product Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="AcousticPro Wireless Headphones"
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">URL Slug *</label>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => update('slug', e.target.value.toLowerCase())}
                  placeholder="acousticpro-wireless-headphones"
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:border-transparent font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Short Description *</label>
                  <textarea
                    required
                    rows={2}
                    value={form.shortDescription}
                    onChange={(e) => update('shortDescription', e.target.value)}
                    placeholder="Brief summary shown on cards"
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => update('categoryId', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:border-transparent"
                  >
                    <option value="">— Uncategorised —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Description *</label>
                <textarea
                  required
                  rows={6}
                  value={form.fullDescription}
                  onChange={(e) => update('fullDescription', e.target.value)}
                  placeholder="Detailed product description..."
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:border-transparent resize-y"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-700">Product Images</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Main Image URL *</label>
                <input
                  type="url"
                  required
                  value={form.imageUrl}
                  onChange={(e) => update('imageUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:border-transparent font-mono"
                />
                {form.imageUrl && (
                  <div className="mt-2 w-24 h-24 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 relative">
                    <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Gallery Images</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addGalleryImage(); } }}
                    placeholder="https://..."
                    className="flex-1 px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:border-transparent font-mono"
                  />
                  <button
                    type="button"
                    onClick={addGalleryImage}
                    className="px-4 py-2.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
                {form.galleryImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {form.galleryImages.map((url, idx) => (
                      <div key={idx} className="relative w-full aspect-square rounded-lg border border-slate-200 overflow-hidden bg-slate-50 group">
                        <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-700">Pricing</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Price (BDT) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => update('price', e.target.value)}
                  placeholder="6500.00"
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:border-transparent font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Compare At Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.compareAtPrice}
                  onChange={(e) => update('compareAtPrice', e.target.value)}
                  placeholder="7800.00"
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:border-transparent font-mono"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-700">Status & Badges</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Availability</label>
                <select
                  value={form.availability}
                  onChange={(e) => update('availability', e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:border-transparent"
                >
                  {AVAILABILITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => update('isFeatured', e.target.checked)}
                    className="w-4 h-4 text-brand-gold-600 rounded focus:ring-brand-gold-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Featured Product</span>
                    <span className="text-[10px] text-slate-500">Show on homepage featured section</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={form.isHot}
                    onChange={(e) => update('isHot', e.target.checked)}
                    className="w-4 h-4 text-brand-gold-600 rounded focus:ring-brand-gold-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Hot Deal</span>
                    <span className="text-[10px] text-slate-500">Mark as hot / on sale</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {mode === 'edit' && initialData?.id && (
            <DeleteProductButton productId={initialData.id} />
          )}
        </div>
      </div>
    </form>
  );
}

function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/products');
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  };

  if (!confirm) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-6">
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100"
        >
          <Trash2 className="w-4 h-4" /> Delete Product
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-6 space-y-3">
      <p className="text-xs font-bold text-rose-700">Confirm deletion?</p>
      <p className="text-[11px] text-slate-500">This action cannot be undone.</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirm(false)}
          className="flex-1 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="flex-1 px-3 py-2 text-xs font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          Delete
        </button>
      </div>
    </div>
  );
}
