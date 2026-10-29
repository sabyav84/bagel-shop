'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { MenuSection } from '@/components/MenuSection';
import { CustomizationModal } from '@/components/CustomizationModal';
import { CartDrawer } from '@/components/CartDrawer';
import { OrderStatusModal } from '@/components/OrderStatusModal';
import { TrackOrderModal } from '@/components/TrackOrderModal';
import {
  Bagel,
  CreamCheese,
  Category,
  CartItem,
  OrderResponse,
} from '@/types/bagel';
import {
  getBagelsFromStrapi,
  getCreamCheesesFromStrapi,
  MOCK_CATEGORIES,
  MOCK_BAGELS,
  MOCK_CREAM_CHEESES,
} from '@/lib/strapi';
import {
  getBagelsFromSupabase,
  getCreamCheesesFromSupabase,
  isSupabaseConfigured,
} from '@/lib/supabase';
import { Coffee } from 'lucide-react';

export default function Home() {
  const [bagels, setBagels] = useState<Bagel[]>(MOCK_BAGELS);
  const [creamCheeses, setCreamCheeses] = useState<CreamCheese[]>(MOCK_CREAM_CHEESES);
  const [categories] = useState<Category[]>(MOCK_CATEGORIES);
  
  const [selectedBagel, setSelectedBagel] = useState<Bagel | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<OrderResponse | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderResponse[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Load recent orders from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bagel_shop_recent_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setRecentOrders(parsed);
      }
    } catch {
      // Ignore storage error
    }
  }, []);

  const handleOrderSuccess = (order: OrderResponse) => {
    setSubmittedOrder(order);
    setRecentOrders((prev) => {
      const filtered = prev.filter((o) => o.orderNumber !== order.orderNumber);
      const updated = [order, ...filtered];
      try {
        localStorage.setItem('bagel_shop_recent_orders', JSON.stringify(updated));
      } catch {
        // Ignore storage error
      }
      return updated;
    });
  };

  useEffect(() => {
    async function loadMenuData() {
      try {
        if (isSupabaseConfigured()) {
          const [fetchedBagels, fetchedCC] = await Promise.all([
            getBagelsFromSupabase(),
            getCreamCheesesFromSupabase(),
          ]);
          if (fetchedBagels.length > 0) setBagels(fetchedBagels);
          if (fetchedCC.length > 0) setCreamCheeses(fetchedCC);
          setIsBackendConnected(true);
        } else {
          const [fetchedBagels, fetchedCC] = await Promise.all([
            getBagelsFromStrapi(),
            getCreamCheesesFromStrapi(),
          ]);
          if (fetchedBagels.length > 0) setBagels(fetchedBagels);
          if (fetchedCC.length > 0) setCreamCheeses(fetchedCC);
          
          const check = await fetch('http://localhost:1337/api/bagels', { method: 'HEAD' }).catch(() => null);
          if (check && check.ok) setIsBackendConnected(true);
        }
      } catch (err) {
        console.log('Backend running in offline/demo mode', err);
      }
    }
    loadMenuData();
  }, []);

  const handleAddToCart = (item: CartItem) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (existing) =>
          existing.bagel.id === item.bagel.id &&
          (existing.breadOption ?? '') === (item.breadOption ?? '') &&
          (existing.creamCheese?.id ?? '') === (item.creamCheese?.id ?? '') &&
          existing.toasted === item.toasted &&
          (existing.specialInstructions ?? '') === (item.specialInstructions ?? '')
      );

      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + item.quantity,
        };
        return updated;
      }

      return [...prev, item];
    });
  };

  const handleRemoveFromCart = (cartId: string) => {
    setCartItems((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const scrollToMenu = () => {
    const el = document.getElementById('menu');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-amber-950 text-amber-50 font-sans flex flex-col justify-between selection:bg-amber-500 selection:text-amber-950">
      <div>
        {/* Navigation Bar */}
        <Navbar
          cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
          activeOrder={submittedOrder || (recentOrders.length > 0 ? recentOrders[0] : null)}
          onOpenActiveOrder={() => {
            const orderToOpen = submittedOrder || recentOrders[0];
            if (orderToOpen) setSubmittedOrder(orderToOpen);
          }}
          isBackendConnected={isBackendConnected}
        />

        {/* Hero Section */}
        <Hero onExploreMenu={scrollToMenu} />

        {/* Menu Section */}
        <MenuSection
          bagels={bagels}
          categories={categories}
          creamCheeses={creamCheeses}
          onSelectBagel={(bagel) => setSelectedBagel(bagel)}
        />
      </div>

      {/* Footer */}
      <footer className="bg-amber-950 border-t border-amber-900 py-8 text-center text-xs text-amber-400/60 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Coffee className="w-4 h-4 text-amber-500" />
          <span>Bagelicious Bagel Shop • Built with Next.js 16 & Strapi v5</span>
        </div>
        <p>1031 NY-112, Port Jefferson Station, NY 11776 • (631) 642-0741</p>
        <div className="pt-1">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-900/40 hover:bg-amber-900/80 border border-amber-800 text-amber-300 hover:text-amber-100 transition text-[11px]"
          >
            <span>Staff / Kitchen Orders Dashboard →</span>
          </Link>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <CustomizationModal
        bagel={selectedBagel}
        creamCheeses={creamCheeses}
        onClose={() => setSelectedBagel(null)}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onOrderSuccess={handleOrderSuccess}
      />

      <TrackOrderModal
        isOpen={isTrackOrderOpen}
        onClose={() => setIsTrackOrderOpen(false)}
        recentOrders={recentOrders}
        onSelectOrder={(order) => setSubmittedOrder(order)}
      />

      <OrderStatusModal
        order={submittedOrder}
        onClose={() => setSubmittedOrder(null)}
      />
    </div>
  );
}
