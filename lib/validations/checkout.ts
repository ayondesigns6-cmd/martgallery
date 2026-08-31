import { z } from 'zod';

export const MAX_QUANTITY_PER_ITEM = 50;
export const MAX_ITEMS_PER_ORDER = 20;
export const MIN_DELIVERY_FEE = 20;
export const MAX_DELIVERY_FEE = 500;
export const DEFAULT_DELIVERY_FEE = 60;
export const MAX_PRICE_PER_ITEM = 1000000;
export const MAX_ORDER_TOTAL = 10000000;

export const checkoutItemSchema = z.object({
  productId: z.string().min(1, 'Product ID required').max(64, 'Product ID too long'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(MAX_QUANTITY_PER_ITEM, `Max ${MAX_QUANTITY_PER_ITEM} per item`),
});

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, 'Name must be at least 2 characters').max(120, 'Name too long'),
  customerPhone: z
    .string()
    .trim()
    .min(10, 'Please enter a valid phone number')
    .max(20, 'Phone number too long')
    .regex(/^[0-9+\-\s()]+$/, 'Phone number contains invalid characters'),
  customerEmail: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  deliveryAddress: z.string().trim().min(5, 'Please provide a detailed delivery address').max(500, 'Address too long'),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  locationNote: z.string().trim().max(300, 'Note is too long').optional().or(z.literal('')),
  items: z.array(checkoutItemSchema).min(1, 'Cart cannot be empty').max(MAX_ITEMS_PER_ORDER, `Max ${MAX_ITEMS_PER_ORDER} items per order`),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckoutItemInput = z.infer<typeof checkoutItemSchema>;

