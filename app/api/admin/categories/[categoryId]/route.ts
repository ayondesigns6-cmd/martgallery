import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/supabase/admin-auth';
import { categorySchema } from '@/lib/validations/product';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const auth = await verifyAdmin();
  if (!auth.isAdmin || auth.response) return auth.response!;
  const adminClient = auth.adminClient!;

  try {
    const body = await req.json();
    const validated = categorySchema.partial().parse(body);

    const updateData: any = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.slug !== undefined) updateData.slug = validated.slug;
    if (validated.description !== undefined) updateData.description = validated.description || null;
    if (validated.displayOrder !== undefined) updateData.display_order = validated.displayOrder;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await (adminClient.from('categories') as any)
      .update(updateData)
      .eq('id', params.categoryId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, category: data });
  } catch (error: any) {
    if (error.issues) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const auth = await verifyAdmin();
  if (!auth.isAdmin || auth.response) return auth.response!;
  const adminClient = auth.adminClient!;

  try {
    const { error } = await (adminClient.from('categories') as any)
      .delete()
      .eq('id', params.categoryId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
