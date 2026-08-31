import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/supabase/admin-auth';
import { notifyOrderStatusTransition } from '@/lib/notifications/order-notifications';

const VALID_STATUSES = ['pending', 'confirmed', 'delivered', 'cancelled'];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const auth = await verifyAdmin();
  if (!auth.isAdmin || auth.response) return auth.response!;
  const adminClient = auth.adminClient!;

  try {
    const body = await req.json();
    const { status, admin_notes } = body;

    let existingOrder: any = null;
    try {
      const { data } = await (adminClient.from('orders') as any)
        .select('id, order_number, customer_name, customer_phone, customer_email, delivery_address, subtotal, delivery_fee, total, status, order_items (*)')
        .eq('id', params.orderId)
        .single();
      existingOrder = data;
    } catch {}

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const oldStatus: any = existingOrder.status;

    const updateData: any = {};
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updateData.status = status;
    }
    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes;
    }
    updateData.updated_at = new Date().toISOString();

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await (adminClient.from('orders') as any)
      .update(updateData)
      .eq('id', params.orderId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (status !== undefined && status !== oldStatus) {
      const notifCtx = {
        id: existingOrder.id,
        order_number: existingOrder.order_number,
        customer_name: existingOrder.customer_name,
        customer_phone: existingOrder.customer_phone,
        customer_email: existingOrder.customer_email,
        delivery_address: existingOrder.delivery_address,
        subtotal: existingOrder.subtotal,
        delivery_fee: existingOrder.delivery_fee,
        total: existingOrder.total,
        status: status as any,
        order_items: existingOrder.order_items,
      };
      // Fire notification in parallel; combine statuses into the existing order record
      notifyOrderStatusTransition(notifCtx, oldStatus, status as any)
        .then(async ({ smsStatus, emailStatus, error: notifErr }) => {
          const notifPatch: any = {};
          if (smsStatus !== 'not_sent') notifPatch.sms_status = smsStatus;
          if (emailStatus !== 'not_sent') notifPatch.email_status = emailStatus;
          if (notifErr) notifPatch.notification_error = notifErr;
          notifPatch.updated_at = new Date().toISOString();
          if (Object.keys(notifPatch).length > 0) {
            try {
              await (adminClient.from('orders') as any).update(notifPatch).eq('id', params.orderId);
            } catch {}
          }
        })
        .catch(() => {});
    }

    return NextResponse.json({ success: true, order: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const auth = await verifyAdmin();
  if (!auth.isAdmin || auth.response) return auth.response!;
  const adminClient = auth.adminClient!;

  try {
    const { data, error } = await (adminClient.from('orders') as any)
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', params.orderId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ order: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
