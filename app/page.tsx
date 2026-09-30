'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { MenuSection } from '@/components/MenuSection';
import { CustomizationModal } from '@/components/CustomizationModal';
import { CartDrawer } from '@/components/CartDrawer';
import { OrderStatusModal } from '@/components/OrderStatusModal';
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
import { Coffee } from 'lucide-react';

export default function Home() {
  const [bagels, setBagels] = useState<Bagel[]>(MOCK_BAGELS);
  const [creamCheeses, setCreamCheeses] = useState<CreamCheese[]>(MOCK_CREAM_CHEESES);
  const [categories] = useState<Category[]>(MOCK_CATEGORIES);
  
  const [selectedBagel, setSelectedBagel] = useState<Bagel | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<OrderResponse | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  useEffect(() => {
    async function loadStrapiData() {
      try {
        const [fetchedBagels, fetchedCC] = await Promise.all([
          getBagelsFromStrapi(),
          getCreamCheesesFromStrapi(),
        ]);
        if (fetchedBagels.length > 0) setBagels(fetchedBagels);
        if (fetchedCC.length > 0) setCreamCheeses(fetchedCC);
        
        // Check if strapi port is answering
        const check = await fetch('http://localhost:1337/api/bagels', { method: 'HEAD' }).catch(() => null);
        if (check && check.ok) setIsBackendConnected(true);
      } catch (err) {
        console.log('Strapi backend running in offline/demo mode', err);
      }
    }
    loadStrapiData();
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
    setIsCartOpen(true);
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
        onOrderSuccess={(order) => setSubmittedOrder(order)}
      />

      <OrderStatusModal
        order={submittedOrder}
        onClose={() => setSubmittedOrder(null)}
      />
    </div>
  );
}
