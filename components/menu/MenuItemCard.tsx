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

    // Check if item has customization groups
    const hasCustomization = item.customizationGroups && item.customizationGroups.length > 0;

    // Check if any customization is REQUIRED (minSelection > 0)
    const hasRequiredOptions = item.customizationGroups?.some(g => g.minSelection > 0);

    // Find this item in cart (all instances)
    const cartItemInstances = cartItems.filter(i => i.menuItemId === item.id);
    const totalQuantity = cartItemInstances.reduce((acc, i) => acc + i.quantity, 0);

    // Determine if we should show the stepper.
    // Show stepper if:
    // 1. Item is in cart AND
    // 2. EITHER it has no required options (treated as simple)
    // 3. OR there is exactly one instance of it in the cart (so we know which one to inc/dec)
    const showStepper = totalQuantity > 0 && (!hasRequiredOptions || cartItemInstances.length === 1);

    // If we are showing the stepper, we need to know which actual cart item ID to target.
    // If multiple instances exist (shouldn't happen for simple items, but possible for complex), 
    // we default to the LAST added instance for simple items, or the ONLY instance for complex items.
    const targetCartItem = cartItemInstances.length > 0 ? cartItemInstances[cartItemInstances.length - 1] : null;

    const handleAddClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasRequiredOptions) {
            onClick(); // Must open modal to select required options
        } else {
            // Add base item directly with no options
            addToCart({
                menuItemId: item.id,
                name: item.name,
                image: item.image,
                basePrice: item.price,
                finalPrice: item.price,
                quantity: 1,
                selectedOptions: {},
                isVegetarian: item.isVegetarian
            });
        }
    };

    const handleIncrement = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (targetCartItem) {
            updateQuantity(targetCartItem.id, 1);
        } else {
            // Fallback: Add new
            handleAddClick(e);
        }
    };

    const handleDecrement = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (targetCartItem) {
            if (targetCartItem.quantity === 1) {
                removeFromCart(targetCartItem.id);
            } else {
                updateQuantity(targetCartItem.id, -1);
            }
        }
    };

    return (
        <div
            onClick={onClick}
            className={`group relative bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100/50 transition-all duration-300 ${item.isAvailable ? 'cursor-pointer hover:shadow-md' : 'opacity-60 grayscale cursor-not-allowed'}`}
        >
            <div className="flex justify-between items-start gap-4">
                {/* Left Content */}
                <div className="flex-1 space-y-2">
                    {/* Category & Veg/Non-Veg */}
                    <div className="flex items-center gap-2 mb-1">
                        {item.isVegetarian ? (
                            <div className="w-4 h-4 rounded-[4px] border border-green-600 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-green-600"></div>
                            </div>
                        ) : (
                            <div className="w-4 h-4 rounded-[4px] border border-red-600 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-red-600"></div>
                            </div>
                        )}
                        <span className="text-[11px] font-bold text-gray-500 tracking-widest uppercase">
                            {item.category || 'SPECIAL'}
                        </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-serif-custom text-[1.1rem] font-bold text-gray-900 leading-tight">
                        {item.name}
                    </h3>

                    {/* Description */}
                    <p className="text-[0.8rem] text-gray-500 leading-relaxed line-clamp-2">
                        {item.description}
                    </p>

                    {/* Price */}
                    <div className="pt-2">
                        <span className="text-lg font-bold text-[#8D0B41]">
                            ₹{item.price.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Right Content: Vertical Stepper or Add Button */}
                <div className="relative shrink-0 flex flex-col items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {(showStepper && targetCartItem) ? (
                        <div className="flex flex-col items-center gap-1 bg-white rounded-full shadow-sm p-1 border border-gray-100">
                            {/* Plus Button (Top) */}
                            <button
                                onClick={handleIncrement}
                                className="w-8 h-8 flex items-center justify-center bg-[#8D0B41] text-white rounded-full shadow-sm active:scale-90 transition-transform"
                            >
                                <Plus className="w-4 h-4" strokeWidth={2.5} />
                            </button>

                            {/* Quantity */}
                            <span className="text-sm font-bold text-gray-900 w-8 text-center py-1">
                                {hasRequiredOptions ? (targetCartItem?.quantity || 0) : totalQuantity}
                            </span>

                            {/* Minus Button (Bottom) */}
                            <button
                                onClick={handleDecrement}
                                className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 text-gray-600 rounded-full shadow-sm hover:bg-gray-50 active:scale-90 transition-transform"
                            >
                                <Minus className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 py-2">
                            {/* Placeholder for alignment to match stepper height if needed, or just the Add button */}
                            <button
                                disabled={!item.isAvailable}
                                onClick={handleAddClick}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${item.isAvailable
                                    ? 'bg-white border border-gray-200 text-[#8D0B41] hover:bg-[#8D0B41] hover:text-white hover:shadow-md'
                                    : 'bg-gray-100 text-gray-300'
                                    }`}
                            >
                                <Plus className="w-6 h-6" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
