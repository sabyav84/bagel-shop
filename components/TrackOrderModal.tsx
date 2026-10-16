'use client';

import { useState } from 'react';
import { OrderResponse } from '@/types/bagel';
import { getOrderByNumberFromSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { getOrderByNumberFromStrapi } from '@/lib/strapi';
import { Search, X, PackageCheck, AlertCircle, Clock, ArrowRight } from 'lucide-react';

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  recentOrders: OrderResponse[];
  onSelectOrder: (order: OrderResponse) => void;
}

export function TrackOrderModal({
  isOpen,
  onClose,
  recentOrders,
  onSelectOrder,
}: TrackOrderModalProps) {
  const [orderNumberInput, setOrderNumberInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumberInput.trim()) return;

    setIsSearching(true);
    setErrorMsg('');

    const searchNum = orderNumberInput.trim().toUpperCase();

    // 1. Check local recent orders first
    const localMatch = recentOrders.find(
      (o) => o.orderNumber.toUpperCase() === searchNum
    );

    if (localMatch) {
      setIsSearching(false);
      onSelectOrder(localMatch);
      onClose();
      return;
    }

    // 2. Query Supabase or Strapi database
    try {
      const fetchedOrder = isSupabaseConfigured()
        ? await getOrderByNumberFromSupabase(searchNum)
        : await getOrderByNumberFromStrapi(searchNum);

      if (fetchedOrder) {
        onSelectOrder(fetchedOrder);
        onClose();
      } else {
        setErrorMsg(`No order found matching "${searchNum}". Please check your order number.`);
      }
    } catch (err) {
      console.error('Error tracking order:', err);
      setErrorMsg('Failed to lookup order. Please check your internet connection.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-amber-950 border border-amber-800/80 p-6 shadow-2xl text-amber-50 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-amber-900/60 text-amber-300 flex items-center justify-center hover:bg-amber-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-900/60 border border-amber-700/60 text-amber-300 text-xs font-bold">
            <PackageCheck className="w-4 h-4 text-amber-400" /> Track Order Status
          </div>
          <h3 className="text-xl font-bold font-serif text-amber-100">Find Your Order</h3>
          <p className="text-xs text-amber-300/80">
            Enter your order number (e.g. <span className="font-mono text-amber-200">BGL-123456</span>) to view live preparation progress.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. BGL-748291"
              value={orderNumberInput}
              onChange={(e) => {
                setOrderNumberInput(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-amber-900/40 border border-amber-800 text-amber-100 uppercase tracking-wide placeholder:normal-case placeholder:tracking-normal placeholder:text-amber-600 focus:outline-none focus:border-amber-500 font-mono text-sm"
            />
            <Search className="w-5 h-5 text-amber-400 absolute left-3 top-3.5" />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400 flex items-center gap-1.5 bg-rose-950/40 border border-rose-800/50 p-2.5 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={isSearching || !orderNumberInput.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-bold text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition"
          >
            {isSearching ? (
              <span>Looking up order...</span>
            ) : (
              <>
                <span>Search Order</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Recent Orders List */}
        {recentOrders.length > 0 && (
          <div className="pt-3 border-t border-amber-800/60 space-y-2">
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Your Recent Orders
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {recentOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => {
                    onSelectOrder(order);
                    onClose();
                  }}
                  className="w-full p-3 rounded-xl bg-amber-900/30 border border-amber-800/60 hover:bg-amber-900/60 hover:border-amber-700 transition flex items-center justify-between text-left group"
                >
                  <div>
                    <div className="font-bold text-amber-200 text-xs font-mono">
                      #{order.orderNumber}
                    </div>
                    <div className="text-[11px] text-amber-300/70">
                      {order.customerName} • ${order.totalAmount.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 group-hover:translate-x-1 transition-transform">
                    <span className="capitalize text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-900/80 border border-amber-700/60">
                      {order.status}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
