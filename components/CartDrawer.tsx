'use client';

import React, { useState } from 'react';
import { CartItem, OrderInput, OrderResponse } from '@/types/bagel';
import { createOrderInStrapi } from '@/lib/strapi';
import { createOrderInSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { StripePaymentSection } from './StripePaymentSection';
import { X, Trash2, ShoppingBag, Send, ShieldCheck, AlertCircle, CreditCard, Banknote, Lock } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemoveItem: (cartId: string) => void;
  onClearCart: () => void;
  onOrderSuccess: (order: OrderResponse) => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onClearCart,
  onOrderSuccess,
}: CartDrawerProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pickupTime, setPickupTime] = useState('ASAP (10-15 mins)');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'counter'>('stripe');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'firstName':
        if (!value.trim()) return 'First name is required';
        if (value.trim().length < 2) return 'Must be at least 2 characters';
        return '';
      case 'lastName':
        if (!value.trim()) return 'Last name is required';
        if (value.trim().length < 2) return 'Must be at least 2 characters';
        return '';
      case 'email': {
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Enter a valid email address';
        return '';
      }
      case 'phone': {
        if (!value.trim()) return 'Phone number is required';
        const digits = value.replace(/\D/g, '');
        if (digits.length < 10) return 'Enter a valid 10-digit phone number';
        return '';
      }
      default:
        return '';
    }
  };

  const handleBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => {
    const ccPrice = item.creamCheese ? item.creamCheese.price : 0;
    return sum + (item.bagel.price + ccPrice) * item.quantity;
  }, 0);

  const tax = subtotal * 0.08875; // NYC Sales Tax 8.875%
  const total = subtotal + tax;

  const isFormValid = Boolean(
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    phone.replace(/\D/g, '').length >= 10
  );

  const validateAllFields = () => {
    const newErrors: Record<string, string> = {
      firstName: validateField('firstName', firstName),
      lastName: validateField('lastName', lastName),
      email: validateField('email', email),
      phone: validateField('phone', phone),
    };
    setErrors(newErrors);
    setTouched({ firstName: true, lastName: true, email: true, phone: true });
    return !Object.values(newErrors).some((err) => err !== '');
  };

  const handlePlaceOrder = async (paymentDetails?: {
    method: 'stripe' | 'counter';
    status: 'paid' | 'pending';
    intentId?: string;
  }) => {
    if (items.length === 0) return;
    if (!validateAllFields()) return;

    setIsSubmitting(true);

    const orderInput: OrderInput = {
      customerName: `${firstName.trim()} ${lastName.trim()}`,
      email,
      phone,
      pickupTime,
      notes,
      items: items.map((item) => ({
        bagelName: item.bagel.name,
        breadOption: item.breadOption || 'Standard Sliced',
        creamCheeseName: item.creamCheese?.name,
        quantity: item.quantity,
        toasted: item.toasted,
        unitPrice: item.bagel.price + (item.creamCheese?.price || 0),
        specialInstructions: item.specialInstructions || '',
      })),
      totalAmount: Number(total.toFixed(2)),
      paymentMethod: paymentDetails?.method || paymentMethod,
      paymentStatus: paymentDetails?.status || (paymentMethod === 'stripe' ? 'paid' : 'pending'),
      stripePaymentIntentId: paymentDetails?.intentId,
    };

    try {
      const response = isSupabaseConfigured()
        ? await createOrderInSupabase(orderInput)
        : await createOrderInStrapi(orderInput);

      const fullOrder: OrderResponse = {
        ...response,
        email: response.email || orderInput.email,
        phone: response.phone || orderInput.phone,
        pickupTime: response.pickupTime || orderInput.pickupTime,
        notes: response.notes || orderInput.notes,
        items: (response.items && response.items.length > 0) ? response.items : orderInput.items,
        paymentMethod: response.paymentMethod || orderInput.paymentMethod,
        paymentStatus: response.paymentStatus || orderInput.paymentStatus,
      };

      // Ensure local storage is immediately updated with full preparation details
      try {
        const stored = localStorage.getItem('bagel_shop_recent_orders');
        const existing: OrderResponse[] = stored ? JSON.parse(stored) : [];
        const filtered = existing.filter((o) => o.orderNumber !== fullOrder.orderNumber);
        localStorage.setItem('bagel_shop_recent_orders', JSON.stringify([fullOrder, ...filtered]));
      } catch {}

      onClearCart();
      onOrderSuccess(fullOrder);
      setNotes('');
      onClose();
    } catch (err) {
      console.error('Order submission error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-md bg-amber-950 border-l border-amber-800/60 shadow-2xl text-amber-50 h-full flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-amber-800/60 flex items-center justify-between bg-amber-900/40">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold font-serif text-amber-100">Your Order</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-800 text-amber-300">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-amber-900/60 text-amber-300 flex items-center justify-center hover:bg-amber-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Items & Checkout Form */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          {items.length === 0 ? (
            <div className="py-16 text-center space-y-4 text-amber-300/70">
              <div className="w-16 h-16 rounded-full bg-amber-900/40 border border-amber-800 flex items-center justify-center mx-auto text-3xl">
                🥯
              </div>
              <p className="text-sm font-medium">Your cart is currently empty.</p>
              <p className="text-xs text-amber-400/60">Add fresh bagels & schmear from the menu!</p>
            </div>
          ) : (
            <>
              {/* Item List */}
              <div className="space-y-3">
                {items.map((item) => {
                  const itemPrice = (item.bagel.price + (item.creamCheese?.price || 0)) * item.quantity;
                  return (
                    <div
                      key={item.cartId}
                      className="p-3.5 rounded-xl bg-amber-900/30 border border-amber-800/60 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-amber-100 text-sm">
                          {item.quantity}x {item.bagel.name}
                        </div>
                        {item.breadOption && (
                          <div className="text-amber-300 font-medium">
                            • Choice: {item.breadOption}
                          </div>
                        )}
                        {item.creamCheese && (
                          <div className="text-amber-300 font-medium">
                            + {item.creamCheese.name} (${item.creamCheese.price.toFixed(2)})
                          </div>
                        )}
                        <div className="text-amber-400/70 capitalize">
                          Toasting: {item.toasted.replace('-', ' ')}
                        </div>
                        {item.specialInstructions && (
                          <div className="text-amber-300/80 italic text-[11px]">
                            &quot;{item.specialInstructions}&quot;
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className="font-bold font-serif text-amber-200 text-sm">
                          ${itemPrice.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.cartId)}
                          className="text-rose-400 hover:text-rose-300 p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Checkout Form */}
              <form id="order-form" onSubmit={(e) => { e.preventDefault(); handlePlaceOrder(); }} className="pt-4 border-t border-amber-800/60 space-y-4">
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Customer Information
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-amber-300/90 mb-1">First Name *</label>
                      <input
                        type="text"
                        placeholder="Alex"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          if (touched.firstName) {
                            setErrors((prev) => ({ ...prev, firstName: validateField('firstName', e.target.value) }));
                          }
                        }}
                        onBlur={() => handleBlur('firstName', firstName)}
                        className={`w-full px-3 py-2 rounded-xl bg-amber-900/40 border text-amber-100 focus:outline-none transition-colors ${
                          touched.firstName && errors.firstName
                            ? 'border-rose-500 focus:border-rose-400'
                            : 'border-amber-800 focus:border-amber-500'
                        }`}
                      />
                      {touched.firstName && errors.firstName && (
                        <p className="mt-1 text-rose-400 flex items-center gap-1 text-[11px]">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {errors.firstName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-amber-300/90 mb-1">Last Name *</label>
                      <input
                        type="text"
                        placeholder="Morgan"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          if (touched.lastName) {
                            setErrors((prev) => ({ ...prev, lastName: validateField('lastName', e.target.value) }));
                          }
                        }}
                        onBlur={() => handleBlur('lastName', lastName)}
                        className={`w-full px-3 py-2 rounded-xl bg-amber-900/40 border text-amber-100 focus:outline-none transition-colors ${
                          touched.lastName && errors.lastName
                            ? 'border-rose-500 focus:border-rose-400'
                            : 'border-amber-800 focus:border-amber-500'
                        }`}
                      />
                      {touched.lastName && errors.lastName && (
                        <p className="mt-1 text-rose-400 flex items-center gap-1 text-[11px]">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {errors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-amber-300/90 mb-1">Email *</label>
                      <input
                        type="email"
                        placeholder="alex@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (touched.email) {
                            setErrors((prev) => ({ ...prev, email: validateField('email', e.target.value) }));
                          }
                        }}
                        onBlur={() => handleBlur('email', email)}
                        className={`w-full px-3 py-2 rounded-xl bg-amber-900/40 border text-amber-100 focus:outline-none transition-colors ${
                          touched.email && errors.email
                            ? 'border-rose-500 focus:border-rose-400'
                            : 'border-amber-800 focus:border-amber-500'
                        }`}
                      />
                      {touched.email && errors.email && (
                        <p className="mt-1 text-rose-400 flex items-center gap-1 text-[11px]">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {errors.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-amber-300/90 mb-1">Phone *</label>
                      <input
                        type="tel"
                        placeholder="(555) 019-2834"
                        value={phone}
                        onChange={(e) => {
                          const formatted = formatPhone(e.target.value);
                          setPhone(formatted);
                          if (touched.phone) {
                            setErrors((prev) => ({ ...prev, phone: validateField('phone', formatted) }));
                          }
                        }}
                        onBlur={() => handleBlur('phone', phone)}
                        className={`w-full px-3 py-2 rounded-xl bg-amber-900/40 border text-amber-100 focus:outline-none transition-colors ${
                          touched.phone && errors.phone
                            ? 'border-rose-500 focus:border-rose-400'
                            : 'border-amber-800 focus:border-amber-500'
                        }`}
                      />
                      {touched.phone && errors.phone && (
                        <p className="mt-1 text-rose-400 flex items-center gap-1 text-[11px]">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-amber-300/90 mb-1">Desired Pickup Time</label>
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-amber-900/40 border border-amber-800 text-amber-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="ASAP (10-15 mins)">ASAP (10-15 mins)</option>
                      <option value="In 30 Minutes">In 30 Minutes</option>
                      <option value="In 1 Hour">In 1 Hour</option>
                      <option value="Tomorrow 8:00 AM">Tomorrow 8:00 AM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-amber-300/90 mb-1">Order Notes / Special Requests</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Please include extra napkins, allergy info..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-amber-900/40 border border-amber-800 text-amber-100 placeholder:text-amber-600/70 focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>

                  {/* Payment Method Section */}
                  <div className="pt-3 border-t border-amber-800/60 space-y-3">
                    <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-amber-400" /> Payment Method
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800/60">
                        Test Mode Available
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('stripe')}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition cursor-pointer ${
                          paymentMethod === 'stripe'
                            ? 'bg-amber-900/90 border-amber-400 text-amber-100 shadow-md ring-1 ring-amber-400/60'
                            : 'bg-amber-900/30 border-amber-800/80 text-amber-300/80 hover:bg-amber-900/50'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-xs">Test Credit Card</span>
                        <span className="text-[10px] text-amber-400/70">Stripe Sandbox (4242)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('counter')}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition cursor-pointer ${
                          paymentMethod === 'counter'
                            ? 'bg-amber-900/90 border-amber-400 text-amber-100 shadow-md ring-1 ring-amber-400/60'
                            : 'bg-amber-900/30 border-amber-800/80 text-amber-300/80 hover:bg-amber-900/50'
                        }`}
                      >
                        <Banknote className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-xs">Pay at Counter</span>
                        <span className="text-[10px] text-amber-400/70">Cash or Card in store</span>
                      </button>
                    </div>

                    {paymentMethod === 'stripe' ? (
                      <div className="pt-1">
                        <StripePaymentSection
                          totalAmount={total}
                          customerName={`${firstName.trim()} ${lastName.trim()}`}
                          customerEmail={email.trim()}
                          customerPhone={phone.trim()}
                          onPaymentSuccess={(intentId) =>
                            handlePlaceOrder({
                              method: 'stripe',
                              status: 'paid',
                              intentId,
                            })
                          }
                          isProcessing={isSubmitting}
                          setIsProcessing={setIsSubmitting}
                          formValid={isFormValid}
                        />
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-amber-900/40 border border-amber-800/80 text-xs space-y-3">
                        <p className="text-amber-300/90 leading-relaxed text-[11px]">
                          Your order will be sent to the kitchen and held for counter pickup at 142 Bleecker St. You can pay with cash or card upon arrival.
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            handlePlaceOrder({
                              method: 'counter',
                              status: 'pending',
                            })
                          }
                          disabled={isSubmitting}
                          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                          <span>Place Order & Pay at Counter (${total.toFixed(2)})</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="p-5 bg-amber-950 border-t border-amber-800/60 space-y-3">
            <div className="space-y-1.5 text-xs text-amber-300/80">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>NYC Tax (8.875%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-amber-100 pt-2 border-t border-amber-800/50 font-serif">
                <span>Total Amount</span>
                <span className="text-amber-400">${total.toFixed(2)}</span>
              </div>
            </div>
            {paymentMethod === 'stripe' && (
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-amber-400/80 pt-1">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Test payment form is ready above</span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
