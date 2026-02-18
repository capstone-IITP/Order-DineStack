"use client";

import React from 'react';
import { Plus, Minus, Star } from 'lucide-react';
import { MenuItem } from '../../types';
import { useCart } from '../../contexts/CartContext';

interface MenuItemCardProps {
    item: MenuItem;
    onClick: () => void; // Open modal
}

export default function MenuItemCard({ item, onClick }: MenuItemCardProps) {
    const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();

    // Check if item has customization
    const hasCustomization = item.customizationGroups && item.customizationGroups.length > 0;

    // Find this item in cart (only counts simple items if no customization, or all instances)
    // Logic: 
    // - If customizable: "Add" always opens modal. Badge shows total count.
    // - If simple: "Add" acts as +1. Stepper appears.

    const cartItemInstances = cartItems.filter(i => i.menuItemId === item.id);
    const totalQuantity = cartItemInstances.reduce((acc, i) => acc + i.quantity, 0);

    // For simple items, we need the specific cartItemId to update quantity directly from card
    const simpleCartItem = !hasCustomization && cartItemInstances.length > 0 ? cartItemInstances[0] : null;

    const handleAddSimple = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasCustomization) {
            onClick();
        } else {
            addToCart({
                menuItemId: item.id,
                name: item.name,
                image: item.image,
                basePrice: item.price,
                finalPrice: item.price,
                quantity: 1,
                selectedOptions: {}
            });
        }
    };

    const handleIncrement = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (simpleCartItem) {
            updateQuantity(simpleCartItem.id, 1);
        } else {
            // Should not happen if UI is correct
            handleAddSimple(e);
        }
    };

    const handleDecrement = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (simpleCartItem) {
            if (simpleCartItem.quantity === 1) {
                removeFromCart(simpleCartItem.id);
            } else {
                updateQuantity(simpleCartItem.id, -1);
            }
        }
    };

    return (
        <div
            onClick={onClick}
            className={`group relative bg-white rounded-3xl p-5 shadow-sm border border-gray-100/50 transition-all duration-300 ${item.isAvailable ? 'cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1' : 'opacity-60 grayscale cursor-not-allowed'}`}
        >
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        {item.isVeg ? (
                            <span className="shrink-0 flex items-center justify-center w-4 h-4 rounded-[4px] border border-green-600 top-0.5 relative">
                                <span className="w-2 h-2 rounded-full bg-green-600"></span>
                            </span>
                        ) : (
                            <span className="shrink-0 flex items-center justify-center w-4 h-4 rounded-[4px] border border-red-600 top-0.5 relative">
                                <span className="w-2 h-2 rounded-full bg-red-600"></span>
                            </span>
                        )}
                        <h4 className="font-serif-custom text-lg font-bold text-gray-900 leading-tight group-hover:text-[#8D0B41] transition-colors">{item.name}</h4>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{item.description}</p>

                    <div className="flex items-center gap-3 pt-2">
                        <span className="font-semibold text-lg text-gray-900">₹{item.price}</span>
                        {item.isPopular && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current" /> Popular
                            </span>
                        )}
                        {item.isSpicy && (
                            <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider rounded-lg">Spicy</span>
                        )}
                    </div>
                </div>

                <div className="relative shrink-0 flex flex-col items-end gap-2">
                    {/* Image Mock if needed, or just button */}

                    {/* Add Button or Stepper */}
                    {!hasCustomization && totalQuantity > 0 ? (
                        <div className="flex items-center bg-[#8D0B41] rounded-full shadow-md text-white h-10 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                            <button onClick={handleDecrement} className="w-8 h-full flex items-center justify-center hover:bg-black/10 rounded-l-full transition-colors">
                                {totalQuantity === 1 ? <Minus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                            </button>
                            <span className="w-4 text-center text-sm font-bold">{totalQuantity}</span>
                            <button onClick={handleIncrement} className="w-8 h-full flex items-center justify-center hover:bg-black/10 rounded-r-full transition-colors">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            disabled={!item.isAvailable}
                            onClick={handleAddSimple} // If customized, onClick (parent) handles it. But we stop propagation?
                            // Actually, if customized, we want the button to just open modal.
                            // If simple, we want it to Add. 
                            // Let's refine: 
                            // If available:
                            //    Check hasCustomization. 
                            //       Yes: Render standard "Plus" button. onClick -> calls onClick (open modal).
                            //       No:  Render "Plus" button. onClick -> handleAddSimple (adds to cart).
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${item.isAvailable
                                ? 'bg-gray-50 text-[#8D0B41] hover:bg-[#8D0B41] hover:text-white hover:shadow-md hover:scale-110'
                                : 'bg-gray-100 text-gray-300'
                                }`}
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    )}

                    {/* Badge for customized items that are in cart */}
                    {hasCustomization && totalQuantity > 0 && (
                        <div className="bg-[#8D0B41] text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm animate-scale-in">
                            {totalQuantity} in cart
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
