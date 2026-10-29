'use client';

import Link from 'next/link';
import { ShoppingBag, Utensils, Clock, Store, ShieldCheck, PackageCheck } from 'lucide-react';
import { OrderResponse } from '@/types/bagel';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenTrackOrder: () => void;
  activeOrder?: OrderResponse | null;
  onOpenActiveOrder?: () => void;
  isBackendConnected: boolean;
}

export function Navbar({
  cartCount,
  onOpenCart,
  onOpenTrackOrder,
  activeOrder,
  onOpenActiveOrder,
  isBackendConnected,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-amber-950/90 border-b border-amber-800/40 text-amber-50 transition-all shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-200 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-amber-950 flex items-center justify-center">
              <Utensils className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-amber-100 font-serif">
                Bagelicious <span className="text-amber-400">Bagels</span>
              </h1>
              {isBackendConnected ? (
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-950/80 border border-emerald-700/50 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Strapi Connected
                </span>
              ) : (
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-900/60 border border-amber-700/50 text-amber-300">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  Demo Mode
                </span>
              )}
            </div>
            <p className="hidden sm:flex text-xs text-amber-300/80 font-sans flex items-center gap-2">
              <span>Hand-Rolled Daily</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-amber-400">
                <Clock className="w-3 h-3" /> Open 6am - 3pm
              </span>
            </p>
          </div>
        </div>

        {/* Quick Info & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-900/40 border border-amber-800/40 text-xs text-amber-200">
            <Store className="w-4 h-4 text-amber-400" />
            <span>Pickup: 142 Bleecker St, NYC</span>
          </div>

          {activeOrder && onOpenActiveOrder && (
            <button
              onClick={onOpenActiveOrder}
              className="hidden sm:flex flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-xs font-bold transition shadow-md cursor-pointer animate-pulse"
              title="Click to check your active order progress"
            >
              <PackageCheck className="w-4 h-4 text-emerald-400" />
              <span>Active Order #{activeOrder.orderNumber}</span>
            </button>
          )}

          <button
            onClick={onOpenTrackOrder}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-900/50 hover:bg-amber-900 border border-amber-700/60 text-amber-200 hover:text-amber-100 text-xs font-semibold transition cursor-pointer"
            title="Track Order Status"
          >
            <PackageCheck className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Track Order</span>
          </button>

          <Link
            href="/admin"
            className="items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-900/30 hover:bg-amber-900/60 border border-amber-800/60 text-amber-300 hover:text-amber-100 text-xs font-semibold transition"
            title="Kitchen & Staff Order Dashboard"
          >
            <Utensils className="w-3.5 h-3.5 text-amber-400" />
            <span className='hidden sm:inline'>Kitchen</span>
          </Link>

          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-semibold shadow-lg shadow-amber-500/20 active:scale-95 transition-all duration-200 cursor-pointer"
            aria-label="Open Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-amber-950 text-amber-300 font-bold text-xs border border-amber-400/50 animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
