import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | string): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return '৳0.00';
  return `৳${numericAmount.toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `MG-${year}${month}${day}-${random}`;
}

export function generateWhatsAppLink(
  phone: string,
  orderDetails: {
    orderNumber: string;
    customerName: string;
    total: number;
    items: { name: string; quantity: number; price: number }[];
    address: string;
  }
): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const itemsText = orderDetails.items
    .map((item) => `• ${item.name} x ${item.quantity} = ${formatPrice(item.price * item.quantity)}`)
    .join('\n');

  const message = `🛍️ *Order Confirmation - Mart Gallery*
━━━━━━━━━━━━━━━━━━━━
*Order ID:* #${orderDetails.orderNumber}
*Customer:* ${orderDetails.customerName}
*Delivery Address:* ${orderDetails.address}

*Items:*
${itemsText}

*Total Amount:* ${formatPrice(orderDetails.total)}
━━━━━━━━━━━━━━━━━━━━
Thank you for shopping with Mart Gallery!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
