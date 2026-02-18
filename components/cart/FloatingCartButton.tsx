"use client";

import React, { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

export default function FloatingCartButton() {
    const { cartItemCount, openCart, isCartOpen, cartItems } = useCart();
    const [bump, setBump] = useState(false);

    useEffect(() => {
        if (cartItemCount > 0) {
            setBump(true);
            const timer = setTimeout(() => setBump(false), 300);
            return () => clearTimeout(timer);
        }
    }, [cartItemCount]);

    if (cartItemCount === 0 || isCartOpen) return null;

    return (
        <button
            onClick={openCart}
            className={`fixed bottom-6 right-6 z-40 bg-[#8D0B41] text-white p-4 rounded-full shadow-lg shadow-[#8D0B41]/40 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${bump ? 'scale-110' : ''}`}
            aria-label="View Cart"
        >
            <div className="relative">
                <ShoppingBag className="w-6 h-6" />
                <span className="absolute -top-3 -right-3 bg-white text-[#8D0B41] text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#8D0B41]">
                    {cartItemCount}
                </span>
            </div>
        </button>
    );
}
