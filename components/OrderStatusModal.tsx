'use client';

import { useState, useEffect } from 'react';
import { OrderResponse } from '@/types/bagel';
import {
  getOrderByNumberFromSupabase,
  isSupabaseConfigured,
  supabase,
} from '@/lib/supabase';
import { getOrderByNumberFromStrapi } from '@/lib/strapi';
import {
  CheckCircle2,
  Clock,
  Check,
  X,
  ShieldAlert,
  Flame,
  PackageCheck,
  Sparkles,
} from 'lucide-react';

interface OrderStatusModalProps {
  order: OrderResponse | null;
  onClose: () => void;
}

export function OrderStatusModal({ order, onClose }: OrderStatusModalProps) {
  const [currentStatus, setCurrentStatus] = useState<'pending' | 'preparing' | 'ready' | 'completed'>('pending');

  useEffect(() => {
    if (!order) return;
    setCurrentStatus(order.status);

    // Fetch latest status from database or local storage
    const fetchLatestStatus = async () => {
      try {
        // 1. Try Supabase
        if (isSupabaseConfigured()) {
          const remoteOrder = await getOrderByNumberFromSupabase(order.orderNumber);
          if (remoteOrder?.status) {
            setCurrentStatus(remoteOrder.status);
            return;
          }
        } else {
          // 2. Try Strapi
          const remoteOrder = await getOrderByNumberFromStrapi(order.orderNumber);
          if (remoteOrder?.status) {
            setCurrentStatus(remoteOrder.status);
            return;
          }
        }

        // 3. Check localStorage (for local/demo orders updated via Admin panel)
        const local = localStorage.getItem('bagel_shop_recent_orders');
        if (local) {
          const parsed: OrderResponse[] = JSON.parse(local);
          const match = parsed.find((o) => o.orderNumber === order.orderNumber);
          if (match?.status) {
            setCurrentStatus(match.status);
          }
        }
      } catch (err) {
        // Silently keep current status on network glitches
      }
    };

    // Initial check
    fetchLatestStatus();

    // Poll every 3 seconds while modal is open
    const pollInterval = setInterval(fetchLatestStatus, 3000);

    // Listen for storage events (updates from /admin in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bagel_shop_recent_orders' && e.newValue) {
        try {
          const parsed: OrderResponse[] = JSON.parse(e.newValue);
          const match = parsed.find((o) => o.orderNumber === order.orderNumber);
          if (match?.status) {
            setCurrentStatus(match.status);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Supabase Realtime subscription if available
    let realtimeChannel: any = null;
    if (isSupabaseConfigured()) {
      try {
        realtimeChannel = supabase
          .channel(`order-sync-${order.orderNumber}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'orders',
              filter: `order_number=eq.${order.orderNumber}`,
            },
            (payload) => {
              if (payload.new && (payload.new as any).status) {
                setCurrentStatus((payload.new as any).status);
              }
            }
          )
          .subscribe();
      } catch {
        // Fallback polling is already running
      }
    }

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('storage', handleStorageChange);
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [order]);

  if (!order) return null;

  const steps = [
    { key: 'pending', label: 'Order Received', desc: 'Received & queued in kitchen', icon: Clock },
    { key: 'preparing', label: 'In the Oven', desc: 'Baker is spreading & toasting', icon: Flame },
    { key: 'ready', label: 'Ready for Pickup', desc: 'Counter pickup at 142 Bleecker St', icon: PackageCheck },
  ];

  const getStepIndex = (status: string) => {
    if (status === 'preparing') return 1;
    if (status === 'ready') return 2;
    if (status === 'completed') return 3;
    return 0;
  };

  const activeIndex = getStepIndex(currentStatus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-amber-950 border border-amber-800/80 p-6 shadow-2xl text-amber-50 space-y-6">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-amber-900/60 text-amber-300 flex items-center justify-center hover:bg-amber-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          {order.paymentStatus === 'paid' ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" /> Paid with Card • Order Confirmed!
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-900/60 border border-amber-700/60 text-amber-300 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" /> Order Registered • Pay at Counter
            </div>
          )}

          <h3 className="text-2xl font-bold font-serif text-amber-100">Order #{order.orderNumber}</h3>
          
          <div className="text-xs text-amber-300/80 space-y-0.5">
            <p>
              Thank you, <strong className="text-amber-100">{order.customerName}</strong>! Your order is being handled live.
            </p>
            <p className="text-amber-400 font-medium">
              Total: ${order.totalAmount.toFixed(2)} • {order.paymentStatus === 'paid' ? 'Paid Online' : 'Pay at Pickup Counter'}
            </p>
          </div>
        </div>

        {/* Live Status Pipeline */}
        <div className="p-4 rounded-xl bg-amber-900/30 border border-amber-800/50 space-y-6">
          <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase tracking-wider">
            <span>Kitchen Preparation Pipeline</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Sync
            </span>
          </div>

          <div className="space-y-4">
            {steps.map((step, idx) => {
              const isDone = idx < activeIndex;
              const isCurrent = idx === activeIndex;
              const StepIcon = step.icon;

              return (
                <div key={step.key} className="flex items-start gap-4">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold transition-all ${
                      isDone
                        ? 'bg-emerald-500 text-emerald-950'
                        : isCurrent
                        ? 'bg-amber-400 text-amber-950 ring-4 ring-amber-400/20 animate-pulse'
                        : 'bg-amber-900/60 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : <StepIcon className="w-4 h-4" />}
                  </div>
                  <div>
                    <div
                      className={`text-sm font-bold flex items-center gap-1.5 ${
                        isCurrent ? 'text-amber-300' : isDone ? 'text-emerald-400' : 'text-amber-400/60'
                      }`}
                    >
                      <span>{step.label}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-amber-900/80 text-amber-200 border border-amber-700/60">
                          Current Stage
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-amber-200/70">{step.desc}</div>
                  </div>
                </div>
              );
            })}

            {/* Completed Banner if order is fully completed */}
            {currentStatus === 'completed' && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Order completed and picked up. Enjoy your fresh bagels!</span>
              </div>
            )}
          </div>
        </div>

        {/* Order Items Preview */}
        {order.items && order.items.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-900/30 border border-amber-800/50 text-xs space-y-2">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
              <span>Items Being Prepared ({order.items.length})</span>
              <span className="text-amber-300 font-mono">${order.totalAmount.toFixed(2)}</span>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs text-amber-200 gap-2 border-b border-amber-800/30 pb-1">
                  <div>
                    <span className="font-bold text-amber-100">{item.quantity}x {item.bagelName}</span>
                    {item.creamCheeseName && (
                      <span className="text-amber-300/90 text-[11px] block">+ {item.creamCheeseName}</span>
                    )}
                    {item.specialInstructions && (
                      <span className="text-amber-400/80 italic text-[10px] block">Note: {item.specialInstructions}</span>
                    )}
                  </div>
                  <span className="text-amber-300 font-mono text-[11px]">
                    ${(item.unitPrice * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Admin Note */}
        <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-800/40 text-[11px] text-amber-300/80 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Connected to the live kitchen order system. As staff advance your order in the <strong>Kitchen Dashboard</strong>, this pipeline updates automatically.
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-sm shadow-md transition cursor-pointer"
        >
          Close Status Window
        </button>

      </div>
    </div>
  );
}
