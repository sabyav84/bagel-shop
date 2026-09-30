'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Bagel, CreamCheese, CartItem } from '@/types/bagel';
import { X, Check, Plus, Minus, Sparkles } from 'lucide-react';

interface CustomizationModalProps {
  bagel: Bagel | null;
  creamCheeses: CreamCheese[];
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export const WRAP_OPTIONS = [
  { id: 'flour-wrap', name: 'Plain Flour Wrap', icon: '🌯' },
  { id: 'spinach-wrap', name: 'Spinach Wrap', icon: '🌯' },
  { id: 'wheat-wrap', name: 'Whole Wheat Wrap', icon: '🌯' },
  { id: 'tomato-wrap', name: 'Tomato Basil Wrap', icon: '🌯' },
  { id: 'gluten-free-wrap', name: 'Gluten-Free Wrap', icon: '🌯' },
];

export const HERO_OPTIONS = [
  { id: 'hero-roll', name: 'Italian Hero Roll', icon: '🥖' },
  { id: 'kaiser-roll', name: 'Kaiser Roll', icon: '🥯' },
  { id: 'onion-roll', name: 'Onion Roll', icon: '🥯' },
  { id: 'baguette', name: 'French Baguette', icon: '🥖' },
];

export const SLICED_BREAD_OPTIONS = [
  { id: 'white-bread', name: 'White Bread', icon: '🍞' },
  { id: 'wheat-bread', name: 'Whole Wheat Bread', icon: '🍞' },
  { id: 'rye-bread', name: 'Rye Bread', icon: '🍞' },
  { id: 'sourdough', name: 'Sourdough Bread', icon: '🍞' },
  { id: 'pumpernickel', name: 'Pumpernickel Bread', icon: '🍞' },
  { id: 'brioche', name: 'Brioche Bread', icon: '🍞' },
];

export const BREAKFAST_SANDWICH_OPTIONS = [
  { id: 'everything-bagel', name: 'Everything Bagel', icon: '🥯' },
  { id: 'plain-bagel', name: 'Plain Bagel', icon: '🥯' },
  { id: 'sesame-bagel', name: 'Sesame Bagel', icon: '🥯' },
  { id: 'whole-wheat-bagel', name: 'Whole Wheat Bagel', icon: '🥯' },
  { id: 'kaiser-roll', name: 'Kaiser Roll', icon: '🥯' },
  { id: 'croissant', name: 'Plain Croissant', icon: '🥐' },
  { id: 'white-bread', name: 'White Bread', icon: '🍞' },
  { id: 'wheat-bread', name: 'Whole Wheat Bread', icon: '🍞' },
];

export function CustomizationModal({
  bagel,
  creamCheeses,
  onClose,
  onAddToCart,
}: CustomizationModalProps) {
  const [selectedCreamCheese, setSelectedCreamCheese] = useState<CreamCheese | undefined>(undefined);
  const [selectedBread, setSelectedBread] = useState<string>('Plain Flour Wrap');
  const [toasted, setToasted] = useState<'not-toasted' | 'lightly-toasted' | 'well-done' | 'scooped'>('lightly-toasted');
  const [quantity, setQuantity] = useState<number>(1);
  const [specialInstructions, setSpecialInstructions] = useState<string>('');

  useEffect(() => {
    if (bagel) {
      setToasted('lightly-toasted');
      setQuantity(1);
      setSpecialInstructions('');

      if (bagel.category === 'Bagels') {
        // Plain cream cheese is pre-selected for Bagels
        const plainCc =
          creamCheeses.find(
            (c) => c.slug === 'plain-cream-cheese' || c.name.toLowerCase().includes('plain cream cheese')
          ) || creamCheeses[0];
        setSelectedCreamCheese(plainCc);
      } else {
        // No extra cream cheese cost for non-bagel categories
        const noCc = creamCheeses.find((c) => c.price === 0) || creamCheeses[0];
        setSelectedCreamCheese(noCc);
      }

      // Default bread option for specific item categories
      if (bagel.category === 'Wraps') {
        setSelectedBread('Plain Flour Wrap');
      } else if (bagel.category === 'Deli Sandwiches' || bagel.category === 'Specialty Heroes and Subs') {
        setSelectedBread('Italian Hero Roll');
      } else if (bagel.category === 'Avocado Toast') {
        setSelectedBread('Sourdough Bread');
      } else if (bagel.category === 'Breakfast Sandwiches') {
        setSelectedBread('Everything Bagel');
      } else {
        setSelectedBread('White Bread');
      }
    }
  }, [bagel, creamCheeses]);

  if (!bagel) return null;

  // Bread choices ONLY for sandwiches, avocado toasts, wraps, deli sandwiches, specialty heroes, paninis
  const hasBreadOption = [
    'Breakfast Sandwiches',
    'Avocado Toast',
    'Wraps',
    'Deli Sandwiches',
    'Specialty Heroes and Subs',
    'Paninis',
  ].includes(bagel.category);

  // Cream cheese / Schmear options ONLY for Bagels category
  const hasSchmearOption = bagel.category === 'Bagels';

  // Toasting preference options
  const hasToastingOption = [
    'Bagels',
    'Breakfast Sandwiches',
    'Avocado Toast',
    'Wraps',
    'Deli Sandwiches',
    'Specialty Heroes and Subs',
    'Paninis',
  ].includes(bagel.category);

  // Determine specific list of options based on category
  const getBreadOptions = () => {
    if (bagel.category === 'Wraps') return WRAP_OPTIONS;
    if (bagel.category === 'Deli Sandwiches' || bagel.category === 'Specialty Heroes and Subs') return HERO_OPTIONS;
    if (bagel.category === 'Avocado Toast') return SLICED_BREAD_OPTIONS;
    if (bagel.category === 'Breakfast Sandwiches') return BREAKFAST_SANDWICH_OPTIONS;
    return SLICED_BREAD_OPTIONS;
  };

  const getBreadHeader = () => {
    if (bagel.category === 'Wraps') {
      return { title: 'Select Wrap Choice', subtitle: 'Flour, Spinach, Wheat & Tomato Wraps' };
    }
    if (bagel.category === 'Deli Sandwiches' || bagel.category === 'Specialty Heroes and Subs') {
      return { title: 'Select Hero / Roll Choice', subtitle: 'Italian Hero Rolls & Kaiser Rolls' };
    }
    if (bagel.category === 'Avocado Toast') {
      return { title: 'Select Sliced Bread Choice', subtitle: 'Artisanal Sliced Breads' };
    }
    return { title: 'Select Bread Choice', subtitle: 'Fresh Baked Breads' };
  };

  const breadOptionsList = getBreadOptions();
  const breadHeader = getBreadHeader();

  const creamCheesePrice = hasSchmearOption && selectedCreamCheese ? selectedCreamCheese.price : 0;
  const unitPrice = bagel.price + creamCheesePrice;
  const totalPrice = unitPrice * quantity;

  const handleAdd = () => {
    const item: CartItem = {
      cartId: `${bagel.id}-${hasBreadOption ? selectedBread : 'default'}-${selectedCreamCheese?.id || 'none'}-${Date.now()}`,
      bagel,
      breadOption: hasBreadOption ? selectedBread : undefined,
      creamCheese: hasSchmearOption && selectedCreamCheese && selectedCreamCheese.price > 0 ? selectedCreamCheese : undefined,
      quantity,
      toasted,
      specialInstructions,
    };
    onAddToCart(item);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl bg-amber-950 border border-amber-800/60 shadow-2xl text-amber-50 overflow-hidden flex flex-col max-h-[90vh] cursor-default"
      >
        
        {/* Header */}
        <div className="relative h-44 bg-amber-900/50 shrink-0">
          <Image
            src={bagel.imageUrl}
            alt={bagel.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-amber-950 via-amber-950/40 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-amber-950/80 border border-amber-700/50 text-amber-200 flex items-center justify-center hover:bg-amber-900 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-6 right-6">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              {bagel.category}
            </span>
            <h3 className="text-2xl font-bold font-serif text-amber-100">{bagel.name}</h3>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sans text-sm scrollbar-thin">
          <p className="text-amber-200/80 leading-relaxed text-xs">{bagel.description}</p>

          {/* 1. Bread / Wrap Choices */}
          {hasBreadOption && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                  {breadHeader.title}
                </label>
                <span className="text-xs text-amber-400/80">{breadHeader.subtitle}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin p-1 bg-amber-900/20 rounded-xl border border-amber-800/40">
                {breadOptionsList.map((option) => {
                  const isSelected = selectedBread === option.name;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedBread(option.name)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer text-left ${
                        isSelected
                          ? 'bg-amber-500 text-amber-950 border-amber-400 font-bold shadow-md'
                          : 'bg-amber-900/40 text-amber-200 border-amber-800/60 hover:border-amber-600 hover:bg-amber-900/70'
                      }`}
                    >
                      <span className="text-sm shrink-0">{option.icon}</span>
                      <span className="truncate">{option.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Toasting Level */}
          {hasToastingOption && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                Toasting Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'not-toasted', label: 'Not Toasted' },
                  { id: 'lightly-toasted', label: 'Light Toast' },
                  { id: 'well-done', label: 'Well Done' },
                  { id: 'scooped', label: 'Scooped & Toasted' },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setToasted(option.id as any)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      toasted === option.id
                        ? 'bg-amber-500 text-amber-950 border-amber-400 font-bold shadow-md'
                        : 'bg-amber-900/30 text-amber-200 border-amber-800 hover:border-amber-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Cream Cheese / Schmear Options ONLY for Bagels Category */}
          {hasSchmearOption && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Select Schmear / Cream Cheese
                </label>
                <span className="text-xs text-amber-400/80">Plain Pre-selected</span>
              </div>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1 scrollbar-thin">
                {creamCheeses.map((cc) => {
                  const isSelected = selectedCreamCheese?.id === cc.id;
                  return (
                    <div
                      key={cc.id}
                      onClick={() => setSelectedCreamCheese(cc)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-900/80 border-amber-400 text-amber-100 shadow-md'
                          : 'bg-amber-900/20 border-amber-800/60 text-amber-200 hover:bg-amber-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-amber-400 bg-amber-400 text-amber-950' : 'border-amber-600'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-amber-100">{cc.name}</div>
                          <div className="text-[11px] text-amber-300/70">{cc.description}</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-300">
                        {cc.price === 0 ? 'No Spread ($0.00)' : `+$${cc.price.toFixed(2)}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Special Instructions */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
              Special Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. Extra toasted, dressing on the side, light ice..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-amber-900/30 border border-amber-800/80 text-amber-100 placeholder-amber-400/50 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* 5. Quantity Selector */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Quantity</span>
            <div className="flex items-center gap-3 bg-amber-900/50 border border-amber-800 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg bg-amber-800/60 text-amber-200 flex items-center justify-center hover:bg-amber-700 transition cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-amber-100 w-6 text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg bg-amber-800/60 text-amber-200 flex items-center justify-center hover:bg-amber-700 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Add Button */}
        <div className="p-4 bg-amber-950 border-t border-amber-800/60 flex items-center justify-between shrink-0">
          <div>
            <span className="text-xs text-amber-400 block">Total</span>
            <span className="text-xl font-bold font-serif text-amber-100">${totalPrice.toFixed(2)}</span>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-sm shadow-xl flex items-center gap-2 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Add to Order
          </button>
        </div>

      </div>
    </div>
  );
}
