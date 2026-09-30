'use client';

import { Flame, Sparkles, ShoppingBag, ArrowRight } from 'lucide-react';

interface HeroProps {
  onExploreMenu: () => void;
}

export function Hero({ onExploreMenu }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950 text-amber-50 py-16 sm:py-24">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-12">
        
        {/* Left Copy */}
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-800/50 border border-amber-600/40 text-xs font-semibold text-amber-300 tracking-wide uppercase shadow-inner">
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
            Wood-Fired NYC Style Kettle-Boiled
          </div>

          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-serif text-amber-100 leading-tight">
            Authentic Hand-Rolled <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 bg-clip-text text-transparent">
              Bagels & Artisanal Spreads
            </span>
          </h2>

          <p className="text-lg text-amber-200/80 leading-relaxed font-sans">
            Boiled in honeyed water, seeded by hand, and baked on burlap boards. 
            Select your bagel, pair it with house-made whipped cream cheese, and place your order directly to our baking line.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2">
            <button
              onClick={onExploreMenu}
              className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-base shadow-xl shadow-amber-500/25 transition-all duration-200 flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              <ShoppingBag className="w-5 h-5" />
              Order Fresh Bagels
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-900/40 border border-amber-800/50 text-amber-200 text-xs">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Next.js + Strapi v5 Architecture Demo</span>
            </div>
          </div>
        </div>

        {/* Right Feature Card */}
        <div className="w-full sm:w-auto flex-1 max-w-md">
          <div className="relative p-6 rounded-2xl bg-amber-900/40 border border-amber-700/40 shadow-2xl backdrop-blur-sm space-y-4">
            <div className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-500 to-amber-400 text-amber-950 font-bold text-xs px-3 py-1 rounded-full shadow-lg">
              Fresh Batch Out Now 🔥
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-amber-800/80 border border-amber-600/50 flex items-center justify-center text-3xl font-serif">
                🥯
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-100 font-serif">Today&apos;s Baker Special</h3>
                <p className="text-xs text-amber-300">Everything Bagel + Scallion & Chive Schmear</p>
              </div>
            </div>

            <div className="border-t border-amber-800/50 pt-4 flex items-center justify-between text-xs text-amber-200">
              <span>Avg. Prep Time: <strong className="text-amber-400">8 mins</strong></span>
              <span>Daily Stock: <strong className="text-emerald-400">Fresh & Warm</strong></span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
