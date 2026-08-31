import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/supabase/admin-auth';
import { productSchema } from '@/lib/validations/product';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  const auth = await verifyAdmin();
  if (!auth.isAdmin || auth.response) return auth.response!;
  const adminClient = auth.adminClient!;

  try {
    const body = await req.json();
    const validated = productSchema.partial().parse(body);

    const updateData: any = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.slug !== undefined) updateData.slug = validated.slug;
    if (validated.price !== undefined) updateData.price = validated.price;
    if (validated.compareAtPrice !== undefined) updateData.compare_at_price = validated.compareAtPrice || null;
    if (validated.categoryId !== undefined) updateData.category_id = validated.categoryId || null;
    if (validated.imageUrl !== undefined) updateData.image_url = validated.imageUrl;
    if (validated.galleryImages !== undefined) updateData.gallery_images = validated.galleryImages;
    if (validated.shortDescription !== undefined) updateData.short_description = validated.shortDescription;
    if (validated.fullDescription !== undefined) updateData.full_description = validated.fullDescription;
    if (validated.isFeatured !== undefined) updateData.is_featured = validated.isFeatured;
    if (validated.isHot !== undefined) updateData.is_hot = validated.isHot;
    if (validated.availability !== undefined) updateData.availability = validated.availability;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await (adminClient.from('products') as any)
      .update(updateData)
      .eq('id', params.productId)
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  const auth = await verifyAdmin();
  if (!auth.isAdmin || auth.response) return auth.response!;
  const adminClient = auth.adminClient!;

  try {
    const { error } = await (adminClient.from('products') as any)
      .delete()
      .eq('id', params.productId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
