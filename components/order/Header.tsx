"use client";

import { useMemo } from 'react';
import { ShoppingBag, ChevronLeft } from 'lucide-react';

interface HeaderProps {
    restaurantName: string;
    tableNumber: string;
    categories: any[];
    activeCategory: string;
    onCategoryChange: (categoryId: string) => void;
    cartItemCount: number;
    onOpenCart: () => void;
    theme: { bg: string; text: string; primary: string; secondary: string; accent: string };
}

export default function Header({
    restaurantName,
    tableNumber,
    categories,
    activeCategory,
    onCategoryChange,
    cartItemCount,
    onOpenCart,
    theme
}: HeaderProps) {
    return (
        <header className="sticky top-0 z-40 bg-[#FFFBEA]/95 backdrop-blur-sm transition-all duration-300"
            style={{ borderBottom: '1px solid rgba(232, 228, 213, 0.5)' }}>
            <div className="px-6 pt-6 pb-2 flex justify-between items-end">
                <div>
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] mb-1 opacity-80"
                        style={{ color: THEME.secondary }}>
                        {restaurantName}
                    </h2>
                    <h1 className="text-3xl font-serif" style={{ color: THEME.primary }}>
                        Table {tableNumber}
                    </h1>
                </div>
                <div className="flex gap-3">
                    {/* Cart Icon (Small version for header) */}
                    <button
                        onClick={onOpenCart}
                        className="relative p-2 rounded-full hover:bg-black/5 transition-colors"
                        aria-label="View Cart"
                    >
                        <ShoppingBag className="w-6 h-6" style={{ color: THEME.primary }} />
                        {cartItemCount > 0 && (
                            <span className="absolute top-0 right-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white animate-bounce-in"
                                style={{ backgroundColor: THEME.accent }}>
                                {cartItemCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Categories & Filters */}
            <div className="mt-4 px-6 pb-4 flex items-center gap-3 overflow-x-auto no-scrollbar snap-x">
                {categories.map((cat: any) => (
                    <button
                        key={cat.id}
                        onClick={() => onCategoryChange(cat.id)}
                        className={`flex-none px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 snap-start border ${activeCategory === cat.id
                                ? 'shadow-md scale-105'
                                : 'hover:bg-black/5 bg-transparent border-transparent'
                            }`}
                        style={{
                            backgroundColor: activeCategory === cat.id ? THEME.primary : 'transparent',
                            color: activeCategory === cat.id ? '#FFF' : THEME.primary,
                            borderColor: activeCategory === cat.id ? 'transparent' : 'rgba(0,0,0,0.1)'
                        }}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
        </header>
    );
}

const THEME = {
    bg: '#FFFBEA',
    text: '#2C2C2C',
    primary: '#1A1A1A',
    secondary: '#666666',
    accent: '#D4A373',
};
