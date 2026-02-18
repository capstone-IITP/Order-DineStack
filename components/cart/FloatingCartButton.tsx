"use client";

import React, { useEffect, useState } from 'react';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

export default function FloatingCartButton() {
    const { cartItemCount, openCart, isCartOpen, cartTotal } = useCart();
    const [bump, setBump] = useState(false);

    useEffect(() => {
        if (cartItemCount > 0) {
            setBump(true);
            const timer = setTimeout(() => setBump(false), 300);
            return () => clearTimeout(timer);
        }
    }, [cartItemCount]);

    // Hide if drawer is open to avoid overlap/redundancy
    if (isCartOpen) return null;

    // Use the "Glass Cart" Bar design when items are present
    if (cartItemCount > 0) {
        return (
            <div className="fixed bottom-8 left-6 right-6 z-50 animate-bounce-in">
                <button
                    onClick={openCart}
                    className="w-full h-16 relative overflow-hidden rounded-2xl shadow-xl flex items-center justify-between px-1 group active:scale-[0.98] transition-transform"
                    style={{
                        backgroundColor: '#8B1E3F', // Use standard primary color or theme
                        color: 'white',
                        boxShadow: '0 10px 30px -10px rgba(139, 30, 63, 0.5)'
                    }}
                >
                    {/* Sheen */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

                    <div className="flex items-center gap-4 pl-4 relative z-10">
                        <div className="bg-white/20 px-3 py-1.5 rounded-lg flex flex-col leading-none">
                            <span className="text-[10px] text-white/80 font-bold uppercase">Items</span>
                            <span className="text-lg font-bold text-white text-center">{cartItemCount}</span>
                        </div>
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider">Total</span>
                            <span className="text-xl font-black text-white">₹{cartTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="pr-5 relative z-10 flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wide">
                        Checkout <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                </button>
                <style jsx>{`
                    @keyframes bounce-in {
                        0% { transform: scale(0.9) translateY(20px); opacity: 0; }
                        50% { transform: scale(1.05) translateY(-5px); opacity: 1; }
                        100% { transform: scale(1) translateY(0); opacity: 1; }
                    }
                    .animate-bounce-in { animation: bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                `}</style>
            </div>
        );
    }

    // Default Circular Button for empty cart (if we want to show it)
    // The user previously asked for it to be always visible, even if empty.
    return (
        <button
            onClick={openCart}
            className={`fixed bottom-5 right-5 z-50 bg-[#8D0B41] text-white p-4 rounded-full shadow-lg shadow-[#8D0B41]/40 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${bump ? 'scale-110' : ''}`}
            aria-label="View Cart"
        >
            <div className="relative">
                <ShoppingBag className="w-6 h-6" />
                {/* No badge needed here as logic splits for > 0 */}
            </div>
        </button>
    );
}
