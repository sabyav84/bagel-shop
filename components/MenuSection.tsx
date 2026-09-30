'use client';

import React, { useState } from 'react';
import { Bagel, Category, CreamCheese } from '@/types/bagel';
import { BagelCard } from './BagelCard';
import { Search, Sparkles, SlidersHorizontal, PackageCheck } from 'lucide-react';

interface MenuSectionProps {
  bagels: Bagel[];
  categories: Category[];
  creamCheeses: CreamCheese[];
  onSelectBagel: (bagel: Bagel) => void;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'Bagels': '🥯',
  'Bagels with Cream Cheese': '🧀',
  'Breakfast Sandwiches': '🥓',
  'Avocado Toast': '🥑',
  'Omelets and Platters': '🍳',
  'Wraps': '🌯',
  'Deli Sandwiches': '🥪',
  'Specialty Heroes and Subs': '🥖',
  'Paninis': '🥪',
  'Salads': '🥗',
  'Soups and Specialty Items': '🍲',
  'Muffins and Bakery': '🧁',
  'Extras': '🥚',
  'Drinks': '☕',
};

export function MenuSection({
  bagels,
  categories,
  creamCheeses,
  onSelectBagel,
}: MenuSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categoryNames = ['All', ...categories.map((c) => c.name)];

  // Group items by category order based on categories prop
  const activeCategories = selectedCategory === 'All'
    ? categories
    : categories.filter((c) => c.name === selectedCategory);

  const getFilteredItemsForCategory = (catName: string) => {
    return bagels.filter((b) => {
      const matchesCategory = b.category === catName;
      const matchesSearch =
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  };

  const totalFilteredCount = bagels.filter((b) => {
    const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).length;

  return (
    <section id="menu" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      
      {/* Menu Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-amber-800/40">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            Bagel Lab Menu
          </div>
          <h2 className="text-3xl font-bold font-serif text-amber-100">
            Browse by Category
          </h2>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
          <input
            type="text"
            placeholder="Search bagels, subs, salads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-amber-950/80 border border-amber-800/80 text-amber-100 placeholder-amber-400/50 text-xs focus:outline-none focus:border-amber-500 shadow-inner"
          />
        </div>
      </div>

      {/* Sticky Category Pills Navigation */}
      <div className="sticky top-20 z-30 bg-amber-950/95 backdrop-blur-md py-3 px-2 rounded-2xl border border-amber-800/50 shadow-xl flex items-center gap-2 overflow-x-auto scrollbar-none">
        <SlidersHorizontal className="w-4 h-4 text-amber-400 shrink-0 ml-2 mr-1" />
        {categoryNames.map((catName) => {
          const isActive = selectedCategory === catName;
          const emoji = CATEGORY_EMOJIS[catName] || '';
          return (
            <button
              key={catName}
              onClick={() => setSelectedCategory(catName)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-amber-500 text-amber-950 shadow-lg shadow-amber-500/20 font-bold'
                  : 'bg-amber-900/40 text-amber-200 border border-amber-800/60 hover:border-amber-600 hover:bg-amber-900/80'
              }`}
            >
              {emoji && <span>{emoji}</span>}
              <span>{catName}</span>
            </button>
          );
        })}
      </div>

      {/* Categorized Sections */}
      {totalFilteredCount === 0 ? (
        <div className="py-16 text-center text-amber-300/60 space-y-2">
          <p className="text-base font-semibold">No items found matching your search.</p>
          <p className="text-xs">Try selecting a different category or clearing your search term.</p>
        </div>
      ) : (
        <div className="space-y-14">
          {activeCategories.map((cat) => {
            const catItems = getFilteredItemsForCategory(cat.name);
            if (catItems.length === 0) return null;

            const emoji = CATEGORY_EMOJIS[cat.name] || '🥯';

            return (
              <div key={cat.id || cat.name} id={`cat-${cat.slug}`} className="space-y-6 pt-4">
                
                {/* Category Section Header */}
                <div className="flex items-center justify-between border-b border-amber-800/50 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-900/60 border border-amber-700/60 flex items-center justify-center text-xl shadow-md">
                      {emoji}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold font-serif text-amber-100 flex items-center gap-2">
                        {cat.name}
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-900/80 border border-amber-700/60 text-amber-300 font-sans font-medium">
                          {catItems.length} {catItems.length === 1 ? 'item' : 'items'}
                        </span>
                      </h3>
                      {cat.description && (
                        <p className="text-xs text-amber-300/70 font-sans mt-0.5">
                          {cat.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items Grid for this Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {catItems.map((item) => (
                    <BagelCard key={item.id} bagel={item} onSelect={onSelectBagel} />
                  ))}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Cream Cheese Spreads Banner Showcase */}
      <div className="mt-16 p-6 rounded-2xl bg-gradient-to-r from-amber-900/60 via-amber-950 to-amber-900/60 border border-amber-800/60 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <PackageCheck className="w-4 h-4" />
            House-Whipped Spread
          </div>
          <h3 className="text-xl font-bold font-serif text-amber-100">
            Managed in Strapi Content CMS
          </h3>
          <p className="text-xs text-amber-200/80 max-w-xl leading-relaxed">
            Our cream cheeses are whipped daily in-house. The shop owner can dynamically update spread availability, prices, and seasonal flavors directly in the Strapi Admin portal.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {creamCheeses.filter((cc) => cc.price > 0).map((cc) => (
            <span
              key={cc.id}
              className="px-3 py-1.5 rounded-lg bg-amber-900/80 border border-amber-700/50 text-amber-200 font-medium text-xs shadow-sm"
            >
              🧀 {cc.name} (+${cc.price.toFixed(2)})
            </span>
          ))}
        </div>
      </div>

    </section>
  );
}
