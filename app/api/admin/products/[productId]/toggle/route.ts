import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/supabase/admin-auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  const auth = await verifyAdmin();
  if (!auth.isAdmin || auth.response) return auth.response!;
  const adminClient = auth.adminClient!;

  try {
    const body = await req.json();
    const { field, value } = body;

    if (!field || !['is_featured', 'is_hot'].includes(field)) {
      return NextResponse.json({ error: 'Invalid field' }, { status: 400 });
    }

    const updateData: any = { [field]: value };

    const { error } = await (adminClient.from('products') as any)
      .update(updateData)
      .eq('id', params.productId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
