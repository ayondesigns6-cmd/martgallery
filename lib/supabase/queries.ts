import { createClient } from '@/lib/supabase/client';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '@/lib/data/mock-data';
import { Category, Product } from '@/types/database.types';

export interface ProductFilterOptions {
  categorySlug?: string;
  isFeatured?: boolean;
  isHot?: boolean;
  search?: string;
  availability?: string;
  sort?: 'price-asc' | 'price-desc' | 'newest' | 'name';
  limit?: number;
}

export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data && data.length > 0) {
      return data as Category[];
    }
  } catch (err) {
    // Fallback to mock data
  }
  return MOCK_CATEGORIES;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (!error && data) {
      return data as Category;
    }
  } catch (err) {
    // Fallback to mock data
  }
  return MOCK_CATEGORIES.find((cat) => cat.slug === slug) || null;
}

export async function getProducts(options: ProductFilterOptions = {}): Promise<Product[]> {
  try {
    const supabase = createClient();
    let query = supabase.from('products').select('*');

    if (options.isFeatured !== undefined) {
      query = query.eq('is_featured', options.isFeatured);
    }
    if (options.isHot !== undefined) {
      query = query.eq('is_hot', options.isHot);
    }
    if (options.availability) {
      query = query.eq('availability', options.availability);
    }
    if (options.categorySlug) {
      const category = await getCategoryBySlug(options.categorySlug);
      if (category) {
        query = query.eq('category_id', category.id);
      }
    }
    if (options.search) {
      query = query.ilike('name', `%${options.search}%`);
    }

    if (options.sort === 'price-asc') {
      query = query.order('price', { ascending: true });
    } else if (options.sort === 'price-desc') {
      query = query.order('price', { ascending: false });
    } else if (options.sort === 'name') {
      query = query.order('name', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data as Product[];
    }
  } catch (err) {
    // Fallback to mock data
  }

  // Filter mock products
  let products = [...MOCK_PRODUCTS];

  if (options.isFeatured !== undefined) {
    products = products.filter((p) => p.is_featured === options.isFeatured);
  }
  if (options.isHot !== undefined) {
    products = products.filter((p) => p.is_hot === options.isHot);
  }
  if (options.availability) {
    products = products.filter((p) => p.availability === options.availability);
  }
  if (options.categorySlug) {
    const cat = MOCK_CATEGORIES.find((c) => c.slug === options.categorySlug);
    if (cat) {
      products = products.filter((p) => p.category_id === cat.id);
    }
  }
  if (options.search) {
    const s = options.search.toLowerCase();
    products = products.filter(
      (p) => p.name.toLowerCase().includes(s) || p.short_description.toLowerCase().includes(s)
    );
  }

  if (options.sort === 'price-asc') {
    products.sort((a, b) => a.price - b.price);
  } else if (options.sort === 'price-desc') {
    products.sort((a, b) => b.price - a.price);
  } else if (options.sort === 'name') {
    products.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  if (options.limit) {
    products = products.slice(0, options.limit);
  }

  return products;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();

    if (!error && data) {
      return data as Product;
    }
  } catch (err) {
    // Fallback to mock data
  }
  return MOCK_PRODUCTS.find((p) => p.slug === slug) || null;
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string | null,
  limit: number = 4
): Promise<Product[]> {
  try {
    const supabase = createClient();
    let query = supabase.from('products').select('*').neq('id', productId);
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    const { data, error } = await query.limit(limit);
    if (!error && data && data.length > 0) {
      return data as Product[];
    }
  } catch (err) {
    // Fallback to mock data
  }

  return MOCK_PRODUCTS.filter((p) => p.id !== productId && (categoryId ? p.category_id === categoryId : true)).slice(0, limit);
}
