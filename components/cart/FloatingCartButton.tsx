"use client";

import React, { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
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

    // Use circular button for ALL states (as per user request "This shouldn't appear; it should just remain the cart button")
    return (
        <button
            onClick={openCart}
            className={`fixed bottom-8 right-6 z-50 bg-[#8D0B41] text-white p-4 rounded-full shadow-lg shadow-[#8D0B41]/40 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${bump ? 'scale-110' : ''}`}
            aria-label="View Cart"
        >
            <div className="relative">
                <ShoppingBag className="w-6 h-6" />
                {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-white text-[#8D0B41] text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full shadow-md border-2 border-[#8D0B41]">
                        {cartItemCount}
                    </span>
                )}
            </div>
        </button>
    );
}
