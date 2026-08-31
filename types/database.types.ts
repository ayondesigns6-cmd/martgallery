export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProductAvailability = 'in_stock' | 'out_of_stock' | 'pre_order' | 'discontinued';
export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';
export type NotificationStatus = 'not_sent' | 'sent' | 'failed';

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          price: number;
          compare_at_price: number | null;
          category_id: string | null;
          image_url: string;
          gallery_images: string[];
          short_description: string;
          full_description: string;
          is_featured: boolean;
          is_hot: boolean;
          availability: ProductAvailability;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          price: number;
          compare_at_price?: number | null;
          category_id?: string | null;
          image_url: string;
          gallery_images?: string[];
          short_description: string;
          full_description: string;
          is_featured?: boolean;
          is_hot?: boolean;
          availability?: ProductAvailability;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          price?: number;
          compare_at_price?: number | null;
          category_id?: string | null;
          image_url?: string;
          gallery_images?: string[];
          short_description?: string;
          full_description?: string;
          is_featured?: boolean;
          is_hot?: boolean;
          availability?: ProductAvailability;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          delivery_address: string;
          latitude: number | null;
          longitude: number | null;
          location_note: string | null;
          subtotal: number;
          delivery_fee: number;
          total: number;
          status: OrderStatus;
          sms_status: NotificationStatus;
          email_status: NotificationStatus;
          notification_error: string | null;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          customer_name: string;
          customer_phone: string;
          customer_email?: string | null;
          delivery_address: string;
          latitude?: number | null;
          longitude?: number | null;
          location_note?: string | null;
          subtotal: number;
          delivery_fee?: number;
          total: number;
          status?: OrderStatus;
          sms_status?: NotificationStatus;
          email_status?: NotificationStatus;
          notification_error?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          customer_name?: string;
          customer_phone?: string;
          customer_email?: string | null;
          delivery_address?: string;
          latitude?: number | null;
          longitude?: number | null;
          location_note?: string | null;
          subtotal?: number;
          delivery_fee?: number;
          total?: number;
          status?: OrderStatus;
          sms_status?: NotificationStatus;
          email_status?: NotificationStatus;
          notification_error?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name_snapshot: string;
          product_price_snapshot: number;
          product_image_snapshot: string | null;
          quantity: number;
          subtotal: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name_snapshot: string;
          product_price_snapshot: number;
          product_image_snapshot?: string | null;
          quantity: number;
          subtotal: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_name_snapshot?: string;
          product_price_snapshot?: number;
          product_image_snapshot?: string | null;
          quantity?: number;
          subtotal?: number;
          created_at?: string;
        };
      };
    };
  };
}

export type Category = Database['public']['Tables']['categories']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type AdminUser = Database['public']['Tables']['admin_users']['Row'];
