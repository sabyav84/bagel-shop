'use client';

import React from 'react';
import Image from 'next/image';
import { Bagel } from '@/types/bagel';
import { Plus, Flame, CheckCircle2 } from 'lucide-react';

interface BagelCardProps {
  bagel: Bagel;
  onSelect: (bagel: Bagel) => void;
}

export function BagelCard({ bagel, onSelect }: BagelCardProps) {
  return (
    <div
      onClick={() => onSelect(bagel)}
      className="group relative flex flex-col justify-between rounded-2xl bg-amber-950/60 border border-amber-800/40 hover:border-amber-500/60 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-amber-500/10 cursor-pointer"
    >
      
      {/* Image container */}
      <div className="relative w-full h-48 bg-amber-900/40 overflow-hidden">
        <Image
          src={bagel.imageUrl}
          alt={bagel.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-amber-950 via-transparent to-transparent opacity-80" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/90 border border-amber-700/60 text-amber-200 backdrop-blur-md">
            {bagel.category}
          </span>
          {bagel.isPopular && (
            <span className="px-2 py-1 rounded-full text-xs font-bold bg-amber-500 text-amber-950 flex items-center gap-1 shadow-md">
              <Flame className="w-3 h-3 fill-amber-950" /> Bestseller
            </span>
          )}
        </div>

        {/* Price tag */}
        <div className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-amber-950/90 border border-amber-600/50 text-amber-300 font-bold font-serif text-sm shadow-md backdrop-blur-md">
          ${bagel.price.toFixed(2)}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="text-xl font-bold font-serif text-amber-100 group-hover:text-amber-400 transition-colors">
            {bagel.name}
          </h3>
          <p className="text-xs text-amber-200/75 leading-relaxed line-clamp-2 font-sans">
            {bagel.description}
          </p>
        </div>

        <div className="pt-2 border-t border-amber-900/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>In Stock</span>
            {bagel.calories && (
              <span className="text-amber-400/60 ml-1">• {bagel.calories} cal</span>
            )}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onSelect(bagel); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Customize
          </button>
        </div>
      </div>

    </div>
  );
}
