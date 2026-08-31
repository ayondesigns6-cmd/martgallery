import { getSmsProvider } from '@/lib/notifications/sms';
import { getEmailProvider } from '@/lib/notifications/email';
import { formatPrice } from '@/lib/utils';

type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';

export interface NotificationOrderContext {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  order_items?: {
    product_name_snapshot: string;
    product_price_snapshot: number;
    quantity: number;
    subtotal: number;
  }[];
}

export async function notifyNewOrderAdmin(order: NotificationOrderContext): Promise<{ success: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail) return { success: true };

  try {
    const itemsHtml = order.order_items?.length
      ? order.order_items
          .map(
            (i) => `
              <tr>
                <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">${i.product_name_snapshot}</td>
                <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:center;">${i.quantity}</td>
                <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatPrice(i.subtotal)}</td>
              </tr>
            `
          )
          .join('')
      : '';

    const html = `
      <div style="font-family:system-ui,Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0f172a;color:#f59e0b;padding:20px;border-radius:12px 12px 0 0;">
          <h2 style="margin:0;">New Order #${order.order_number}</h2>
        </div>
        <div style="padding:24px;background:white;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
          <p style="margin:0 0 16px;"><strong>Customer:</strong> ${order.customer_name}</p>
          <p style="margin:0 0 16px;"><strong>Phone:</strong> ${order.customer_phone}</p>
          ${order.customer_email ? `<p style="margin:0 0 16px;"><strong>Email:</strong> ${order.customer_email}</p>` : ''}
          <p style="margin:0 0 16px;"><strong>Delivery Address:</strong> ${order.delivery_address}</p>
          ${order.order_items?.length ? `
            <h3 style="margin:20px 0 8px;">Items</h3>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <thead><tr style="background:#f1f5f9;"><th style="padding:8px 10px;text-align:left;">Product</th><th style="padding:8px 10px;text-align:center;">Qty</th><th style="padding:8px 10px;text-align:right;">Total</th></tr></thead>
              <tbody>${itemsHtml}</tbody>
            </table>
          ` : ''}
          <div style="margin-top:20px;padding:16px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;">
            <p style="margin:0;"><strong>Grand Total:</strong> ${formatPrice(order.total)}</p>
          </div>
        </div>
      </div>
    `;

    const emailRes = await getEmailProvider().sendEmail({
      to: adminEmail,
      subject: `[New Order] #${order.order_number} - ${formatPrice(order.total)}`,
      html,
    });
    return { success: emailRes.success, error: emailRes.error };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function notifyOrderStatusTransition(
  order: NotificationOrderContext,
  oldStatus: OrderStatus | null,
  newStatus: OrderStatus
): Promise<{ smsStatus: 'sent' | 'failed' | 'not_sent'; emailStatus: 'sent' | 'failed' | 'not_sent'; error?: string }> {
  let smsStatus: 'sent' | 'failed' | 'not_sent' = 'not_sent';
  let emailStatus: 'sent' | 'failed' | 'not_sent' = 'not_sent';
  let error: string | undefined;

  const statusLabels: Record<OrderStatus, string> = {
    pending: 'Pending Review',
    confirmed: 'Confirmed',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  const statusMessages: Record<OrderStatus, { sms: string; emailTitle: string; emailBody: string }> = {
    pending: {
      sms: `Mart Gallery: Order #${order.order_number} is under review. We'll confirm shortly.`,
      emailTitle: `Order #${order.order_number} Received`,
      emailBody: `Thank you for your order! It has been received and is pending review by our team. We will contact you shortly to confirm delivery details.`,
    },
    confirmed: {
      sms: `Mart Gallery: Order #${order.order_number} is CONFIRMED! Total ${formatPrice(order.total)}. Delivery in progress.`,
      emailTitle: `Order #${order.order_number} Confirmed`,
      emailBody: `Great news! Your order has been confirmed. Our delivery team is preparing your package and will deliver to: ${order.delivery_address}.`,
    },
    delivered: {
      sms: `Mart Gallery: Order #${order.order_number} has been DELIVERED. Thank you for shopping with us!`,
      emailTitle: `Order #${order.order_number} Delivered`,
      emailBody: `Your order has been successfully delivered! Thank you for shopping with Mart Gallery. We hope to see you again soon.`,
    },
    cancelled: {
      sms: `Mart Gallery: Order #${order.order_number} has been CANCELLED. Contact us if this was in error.`,
      emailTitle: `Order #${order.order_number} Cancelled`,
      emailBody: `Your order has been cancelled. If you did not request this cancellation or have any questions, please contact us via WhatsApp immediately.`,
    },
  };

  if (newStatus === oldStatus) {
    return { smsStatus, emailStatus };
  }

  const msg = statusMessages[newStatus];

  try {
    const smsRes = await getSmsProvider().sendSms({
      to: order.customer_phone,
      message: msg.sms,
    });
    smsStatus = smsRes.success ? 'sent' : 'failed';
    if (!smsRes.success) error = `SMS: ${smsRes.error}`;
  } catch (err: any) {
    smsStatus = 'failed';
    error = `SMS Exception: ${err.message}`;
  }

  if (order.customer_email) {
    try {
      const html = `
        <div style="font-family:system-ui,Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#0f172a;color:#f59e0b;padding:20px;border-radius:12px 12px 0 0;">
            <h2 style="margin:0;">${msg.emailTitle}</h2>
          </div>
          <div style="padding:24px;background:white;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
            <p style="margin:0 0 16px;">Hi ${order.customer_name},</p>
            <p style="margin:0 0 16px;">${msg.emailBody}</p>
            <div style="margin-top:20px;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
              <p style="margin:0 0 6px;"><strong>Order ID:</strong> #${order.order_number}</p>
              <p style="margin:0 0 6px;"><strong>Status:</strong> <span style="font-weight:bold;color:#0f172a;">${statusLabels[newStatus]}</span></p>
              <p style="margin:0;"><strong>Total:</strong> ${formatPrice(order.total)}</p>
            </div>
          </div>
        </div>
      `;
      const emailRes = await getEmailProvider().sendEmail({
        to: order.customer_email,
        subject: `Mart Gallery - ${msg.emailTitle}`,
        html,
      });
      emailStatus = emailRes.success ? 'sent' : 'failed';
      if (!emailRes.success) {
        error = error ? `${error} | Email: ${emailRes.error}` : `Email: ${emailRes.error}`;
      }
    } catch (err: any) {
      emailStatus = 'failed';
      error = error ? `${error} | Email Exception: ${err.message}` : `Email Exception: ${err.message}`;
    }
  }

  return { smsStatus, emailStatus, error };
}
