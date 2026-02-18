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
            className={`group relative bg-white rounded-3xl p-5 shadow-sm border border-gray-100/50 transition-all duration-300 ${item.isAvailable ? 'cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1' : 'opacity-60 grayscale cursor-not-allowed'}`}
        >
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        {item.isVegetarian ? (
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
                    {/* Add Button or Stepper */}
                    {showStepper && targetCartItem ? (
                        <div className="flex items-center bg-[#8D0B41] rounded-full shadow-md text-white h-10 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                            <button onClick={handleDecrement} className="w-8 h-full flex items-center justify-center hover:bg-black/10 rounded-l-full transition-colors">
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-6 text-center text-sm font-bold flex justify-center">{/* Show total quantity for this item type, or just this instance? For simple items, it's total. For complex, if we show stepper, it's that instance's qty. */}{hasRequiredOptions ? targetCartItem.quantity : totalQuantity}</span>
                            <button onClick={handleIncrement} className="w-8 h-full flex items-center justify-center hover:bg-black/10 rounded-r-full transition-colors">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            disabled={!item.isAvailable}
                            onClick={handleAddClick}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${item.isAvailable
                                ? 'bg-gray-50 text-[#8D0B41] hover:bg-[#8D0B41] hover:text-white hover:shadow-md hover:scale-110'
                                : 'bg-gray-100 text-gray-300'
                                }`}
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    )}

                    {/* Badge for multiple variants (Conflict state) */}
                    {/* If we have multiple variants of a complex item, we DO NOT show stepper (ambiguous), so we show Add button + Badge */}
                    {totalQuantity > 0 && !showStepper && (
                        <div className="bg-[#8D0B41] text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm animate-scale-in">
                            {totalQuantity} in cart
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
