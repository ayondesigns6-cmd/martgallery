import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/supabase/admin-auth';
import { productSchema } from '@/lib/validations/product';

export async function POST(req: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.isAdmin || auth.response) return auth.response!;
  const adminClient = auth.adminClient!;

  try {
    const body = await req.json();
    const validated = productSchema.parse(body);

    const { data, error } = await (adminClient.from('products') as any)
      .insert({
        name: validated.name,
        slug: validated.slug,
        price: validated.price,
        compare_at_price: validated.compareAtPrice || null,
        category_id: validated.categoryId || null,
        image_url: validated.imageUrl,
        gallery_images: validated.galleryImages || [],
        short_description: validated.shortDescription,
        full_description: validated.fullDescription,
        is_featured: validated.isFeatured,
        is_hot: validated.isHot,
        availability: validated.availability,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: data });
  } catch (error: any) {
    if (error.issues) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
