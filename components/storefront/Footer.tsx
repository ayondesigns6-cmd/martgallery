import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Shield, RotateCcw, Clock } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const rawPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '8801676711783';
  const whatsappPhone = rawPhone.replace(/[^0-9]/g, '');

  return (
    <footer className="bg-brand-dark text-slate-300 pt-16 pb-12 border-t border-brand-slate">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-slate-800">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-brand-navy border border-slate-700/50 flex items-center justify-center text-brand-gold-400 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">100% Genuine Products</h4>
              <p className="text-xs text-slate-400 mt-0.5">Strict quality check on every single item</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-brand-navy border border-slate-700/50 flex items-center justify-center text-brand-gold-400 shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">7-Day Easy Return</h4>
              <p className="text-xs text-slate-400 mt-0.5">Hassle-free replacement policy</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-brand-navy border border-slate-700/50 flex items-center justify-center text-brand-gold-400 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Nationwide Express Delivery</h4>
              <p className="text-xs text-slate-400 mt-0.5">Cash on delivery available all over Bangladesh</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 py-12">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="inline-block bg-white rounded-xl px-3 py-2 shadow-sm border border-slate-700/50 hover:opacity-95 transition-opacity">
              <Image
                src="/logo.png"
                alt="Mart Gallery"
                width={140}
                height={48}
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mart Gallery is your premier destination for curated electronics, luxury timepieces, and artisan lifestyle essentials in Bangladesh.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/products" className="hover:text-brand-gold-400 transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/products?featured=true" className="hover:text-brand-gold-400 transition-colors">
                  Featured Collection
                </Link>
              </li>
              <li>
                <Link href="/products?hot=true" className="hover:text-brand-gold-400 transition-colors">
                  Hot Deals & Offers
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-brand-gold-400 transition-colors">
                  My Shopping Cart
                </Link>
              </li>
              <li>
                <a
                  href="https://ishmamayon.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-gold-400 transition-colors"
                >
                  Developer
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Customer Support
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/checkout" className="hover:text-brand-gold-400 transition-colors">
                  Order Checkout
                </Link>
              </li>
              <li>
                <span className="text-slate-400">Payment: Cash on Delivery / Mobile Banking</span>
              </li>
              <li>
                <span className="text-slate-400">Standard Delivery: 2-4 Business Days</span>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Direct Contact
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-brand-gold-500 shrink-0 mt-0.5" />
                <span className="text-slate-300">Dhaka, Bangladesh</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <Link
                  href={`https://wa.me/${whatsappPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-gold-400 transition-colors"
                >
                  WhatsApp: +880 1676-711783
                </Link>
              </li>
              <li className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-brand-gold-500 shrink-0" />
                <span className="text-slate-300">support@martgallery.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© {currentYear} Mart Gallery. All rights reserved.</p>
          <div className="flex space-x-6 text-slate-400">
            <span>Secure Checkout</span>
            <span>•</span>
            <span>Nationwide Logistics</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
