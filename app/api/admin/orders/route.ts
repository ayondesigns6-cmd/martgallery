import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/supabase/admin-auth';

export async function GET(req: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.isAdmin || auth.response) return auth.response!;
  const adminClient = auth.adminClient!;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query: any = adminClient.from('orders').select(`
      *,
      order_items (id, product_name_snapshot, product_price_snapshot, quantity, subtotal)
    `);

    if (status && ['pending', 'confirmed', 'delivered', 'cancelled'].includes(status)) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`order_number.ilike.%${search}%,customer_phone.ilike.%${search}%,customer_name.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
