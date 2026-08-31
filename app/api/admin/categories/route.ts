import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/supabase/admin-auth';
import { categorySchema } from '@/lib/validations/product';

export async function GET(req: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.isAdmin || auth.response) return auth.response!;
  const adminClient = auth.adminClient!;

  try {
    const { data, error } = await (adminClient.from('categories') as any)
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ categories: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.isAdmin || auth.response) return auth.response!;
  const adminClient = auth.adminClient!;

  try {
    const body = await req.json();
    const validated = categorySchema.parse(body);

    const { data, error } = await (adminClient.from('categories') as any)
      .insert({
        name: validated.name,
        slug: validated.slug,
        description: validated.description || null,
        display_order: validated.displayOrder,
      })
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
