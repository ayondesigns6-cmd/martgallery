import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/lib/context/CartContext';

export const metadata: Metadata = {
  title: 'Mart Gallery | Premium Retail Collection',
  description: 'Shop top quality lifestyle and retail products with trusted fast delivery across Bangladesh at Mart Gallery.',
  icons: {
    icon: '/logo-icon.png',
    apple: '/logo-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col bg-brand-bg text-brand-navy antialiased">
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
