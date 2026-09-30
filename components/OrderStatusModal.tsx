'use client';

import { useState, useEffect } from 'react';
import { OrderResponse } from '@/types/bagel';
import { CheckCircle2, Clock, Utensils, Check, X, ShieldAlert } from 'lucide-react';

interface OrderStatusModalProps {
  order: OrderResponse | null;
  onClose: () => void;
}

export function OrderStatusModal({ order, onClose }: OrderStatusModalProps) {
  const [currentStatus, setCurrentStatus] = useState<'pending' | 'preparing' | 'ready' | 'completed'>('pending');

  useEffect(() => {
    if (!order) return;
    setCurrentStatus(order.status);

    // Simulate shop owner changing status in Strapi Admin for dynamic showcase
    const timer1 = setTimeout(() => setCurrentStatus('preparing'), 4000);
    const timer2 = setTimeout(() => setCurrentStatus('ready'), 9000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [order]);

  if (!order) return null;

  const steps = [
    { key: 'pending', label: 'Order Received', desc: 'Saved to Strapi DB', icon: Clock },
    { key: 'preparing', label: 'In the Oven', desc: 'Baker is spreading & toasting', icon: Utensils },
    { key: 'ready', label: 'Ready for Pickup', desc: 'Counter pickup at 142 Bleecker', icon: CheckCircle2 },
  ];

  const getStepIndex = (status: string) => {
    if (status === 'preparing') return 1;
    if (status === 'ready' || status === 'completed') return 2;
    return 0;
  };

  const activeIndex = getStepIndex(currentStatus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-amber-950 border border-amber-800/80 p-6 shadow-2xl text-amber-50 space-y-6">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-amber-900/60 text-amber-300 flex items-center justify-center hover:bg-amber-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" /> Order Sent to Strapi Backend!
          </div>
          <h3 className="text-2xl font-bold font-serif text-amber-100">Order #{order.orderNumber}</h3>
          <p className="text-xs text-amber-300/80">
            Thank you, <strong className="text-amber-100">{order.customerName}</strong>! Your order has been registered in the database.
          </p>
        </div>

        {/* Live Status Pipeline */}
        <div className="p-4 rounded-xl bg-amber-900/30 border border-amber-800/50 space-y-6">
          <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase tracking-wider">
            <span>Shop Owner Strapi Pipeline</span>
            <span className="animate-pulse text-amber-300">Live Status Sync</span>
          </div>

          <div className="space-y-4">
            {steps.map((step, idx) => {
              const isDone = idx < activeIndex;
              const isCurrent = idx === activeIndex;
              const StepIcon = step.icon;

              return (
                <div key={step.key} className="flex items-start gap-4">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold transition-all ${
                    isDone
                      ? 'bg-emerald-500 text-emerald-950'
                      : isCurrent
                      ? 'bg-amber-400 text-amber-950 animate-bounce'
                      : 'bg-amber-900/60 text-amber-400 border border-amber-800'
                  }`}>
                    {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : <StepIcon className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${
                      isCurrent ? 'text-amber-300' : isDone ? 'text-emerald-400' : 'text-amber-400/60'
                    }`}>
                      {step.label}
                    </div>
                    <div className="text-xs text-amber-200/70">{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Strapi Admin Integration Note */}
        <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-800/40 text-[11px] text-amber-300/80 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            The shop owner can update this order status in the <strong>Strapi Admin Panel</strong> (`/admin` -&gt; Content Manager -&gt; Orders).
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-sm shadow-md transition"
        >
          Back to Storefront
        </button>

      </div>
    </div>
  );
}
