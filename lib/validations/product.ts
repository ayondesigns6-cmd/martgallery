import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase alphanumeric characters and hyphens'),
  price: z.number().min(0, 'Price cannot be negative'),
  compareAtPrice: z.number().min(0, 'Compare price cannot be negative').nullable().optional(),
  categoryId: z.string().uuid('Invalid category ID').nullable().optional(),
  imageUrl: z.string().url('Main image URL must be a valid URL'),
  galleryImages: z.array(z.string().url()).default([]),
  shortDescription: z.string().min(5, 'Short description must be at least 5 characters'),
  fullDescription: z.string().min(10, 'Full description must be at least 10 characters'),
  isFeatured: z.boolean().default(false),
  isHot: z.boolean().default(false),
  availability: z.enum(['in_stock', 'out_of_stock', 'pre_order', 'discontinued']).default('in_stock'),
});

export const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase alphanumeric characters and hyphens'),
  description: z.string().optional().or(z.literal('')),
  displayOrder: z.number().int().default(0),
});

export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
