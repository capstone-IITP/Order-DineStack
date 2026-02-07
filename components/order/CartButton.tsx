"use client";

import { ShoppingBag, ChevronRight } from 'lucide-react';

interface CartButtonProps {
    count: number;
    total: number;
    onClick: () => void;
    theme: { bg: string; text: string; primary: string; secondary: string; accent: string };
}

export default function CartButton({ count, total, onClick, theme }: CartButtonProps) {
    if (count === 0) return null;

    return (
        <div className="fixed bottom-8 left-6 right-6 z-50 animate-bounce-in">
            <button
                onClick={onClick}
                className="w-full h-16 relative overflow-hidden rounded-2xl shadow-xl flex items-center justify-between px-1 group active:scale-[0.98] transition-transform"
                style={{ backgroundColor: theme.primary }}
            >
                {/* Frosted Glass Overlay */}
                <div className="absolute inset-0 bg-white/10 backdrop-blur-md" />

                {/* Content */}
                <div className="relative z-10 flex items-center gap-4 px-4 w-full">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white relative">
                        <ShoppingBag size={20} />
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                            {count}
                        </span>
                    </div>

                    <div className="flex flex-col items-start flex-1">
                        <span className="text-white font-bold text-sm uppercase tracking-wider">View Cart</span>
                        <span className="text-white/80 text-xs">{count} item{count > 1 ? 's' : ''} added</span>
                    </div>

                    <div className="bg-white text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 group-hover:bg-opacity-90 transition-all">
                        <span>₹{total}</span>
                        <ChevronRight size={16} className="opacity-50 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </button>
        </div>
    );
}
