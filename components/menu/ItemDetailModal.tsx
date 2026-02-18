"use client";

import React, { useState, useMemo } from 'react';
import { ArrowLeft, Check, Leaf, ShoppingBag } from 'lucide-react';
import { MenuItem, OptionGroup, Option } from '../../types';
import { useCart } from '../../contexts/CartContext';

interface ItemDetailModalProps {
    item: MenuItem;
    onClose: () => void;
}

export default function ItemDetailModal({ item, onClose }: ItemDetailModalProps) {
    const { addToCart } = useCart();
    const [selectedOptions, setSelectedOptions] = useState<Record<string, Option[]>>({});
    const [quantity, setQuantity] = useState(1);
    const [instructions, setInstructions] = useState('');
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300);
    };

    const calculateTotal = useMemo(() => {
        let total = item.price;
        Object.values(selectedOptions).flat().forEach(opt => total += opt.priceModifier);
        return total * quantity;
    }, [item.price, selectedOptions, quantity]);

    const isValid = useMemo(() => {
        if (!item.customizationGroups) return true;
        return item.customizationGroups.every(group => {
            const currentSelection = selectedOptions[group.id] || [];
            return currentSelection.length >= group.minSelection && currentSelection.length <= group.maxSelection;
        });
    }, [item.customizationGroups, selectedOptions]);

    const handleOptionToggle = (group: OptionGroup, option: Option) => {
        setSelectedOptions(prev => {
            const current = prev[group.id] || [];
            const isSelected = current.some(o => o.id === option.id);
            if (group.maxSelection === 1) { // Radio
                return { ...prev, [group.id]: [option] };
            } else { // Checkbox
                if (isSelected) return { ...prev, [group.id]: current.filter(o => o.id !== option.id) };
                if (current.length < group.maxSelection) return { ...prev, [group.id]: [...current, option] };
                return prev;
            }
        });
    };

    const handleAddToCart = () => {
        if (!isValid) return;

        try {
            addToCart({
                menuItemId: item.id,
                name: item.name,
                image: item.image,
                basePrice: item.price,
                finalPrice: calculateTotal / quantity,
                quantity,
                selectedOptions,
                instructions,
                isVegetarian: item.isVegetarian
            });
            handleClose();
        } catch (error) {
            console.error("Error adding to cart:", error);
            // Optionally show an error toast here
        }
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={handleClose} style={{ pointerEvents: 'auto' }}></div>
            <div
                className={`bg-white w-full max-w-lg h-[92vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl transform transition-transform duration-300 pointer-events-auto ${isClosing ? 'translate-y-full' : 'translate-y-0 animate-slide-up-spring'}`}
            >
                {/* Header */}
                <div className="relative shrink-0 overflow-hidden rounded-t-3xl h-48 sm:h-56">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#5A0528] to-[#2b0213]"></div>
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#8D0B41]/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>

                    <button
                        onClick={handleClose}
                        className="absolute top-4 left-4 w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all z-10"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
                        <h2 className="text-3xl font-serif-custom font-bold leading-tight mb-2 drop-shadow-sm">{item.name}</h2>
                        <div className="flex items-center gap-3 text-sm font-medium opacity-90">
                            <span className="bg-white/10 backdrop-blur px-3 py-1 rounded-full border border-white/10">₹{item.price}</span>
                            {item.isVegetarian && <span className="flex items-center gap-1.5"><Leaf className="w-4 h-4 text-green-300" /> Vegetarian</span>}
                            {item.isSpicy && <span className="flex items-center gap-1.5">🌶️ Spicy</span>}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
                    <div className="prose prose-sm max-w-none">
                        <p className="text-gray-600 text-[15px] leading-relaxed">{item.description}</p>
                    </div>

                    {item.customizationGroups?.map(group => (
                        <div key={group.id} className="space-y-4">
                            <div className="flex justify-between items-baseline border-b border-gray-100 pb-2">
                                <h3 className="font-semibold text-gray-900 text-lg">{group.name}</h3>
                                <span className="text-xs font-bold text-[#8D0B41] bg-[#8D0B41]/5 px-2 py-1 rounded-md uppercase tracking-wide">
                                    {group.minSelection > 0 ? 'Required' : 'Optional'}
                                </span>
                            </div>
                            <div className="space-y-2.5">
                                {group.options.map(opt => {
                                    const isSelected = (selectedOptions[group.id] || []).some(o => o.id === opt.id);
                                    return (
                                        <label
                                            key={opt.id}
                                            className={`relative flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer group ${isSelected
                                                ? 'border-[#8D0B41] bg-[#FDF2F6]'
                                                : 'border-transparent bg-gray-50 hover:bg-gray-100'
                                                }`}
                                            onClick={() => handleOptionToggle(group, opt)}
                                        >
                                            <div className="flex items-center space-x-3.5">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${group.maxSelection === 1
                                                    ? isSelected ? 'border-4 border-[#8D0B41] bg-white' : 'border-2 border-gray-300 bg-white'
                                                    : isSelected ? 'bg-[#8D0B41] text-white' : 'bg-gray-200 text-transparent'
                                                    }`}>
                                                    {group.maxSelection !== 1 && <Check className="w-3.5 h-3.5" />}
                                                </div>
                                                <span className={`text-[15px] font-medium transition-colors ${isSelected ? 'text-[#8D0B41]' : 'text-gray-700'}`}>{opt.name}</span>
                                            </div>
                                            {opt.priceModifier > 0 && (
                                                <span className="text-sm font-semibold text-gray-500 group-hover:text-gray-700">+₹{opt.priceModifier}</span>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Special Instructions */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 text-lg">Special Instructions</h3>
                        <textarea
                            className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-[#8D0B41]/20 resize-none text-sm"
                            rows={3}
                            placeholder="Allergies? Extra spicy? Let us know..."
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                        ></textarea>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-gray-100 pb-8 sm:pb-6">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-gray-100 rounded-xl h-14 px-2">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-10 h-full flex items-center justify-center text-lg font-bold hover:bg-gray-200 rounded-lg transition-colors"
                            >-</button>
                            <span className="w-8 text-center font-bold text-lg">{quantity}</span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-10 h-full flex items-center justify-center text-lg font-bold hover:bg-gray-200 rounded-lg transition-colors"
                            >+</button>
                        </div>

                        <button
                            onClick={handleAddToCart}
                            disabled={!isValid}
                            className={`flex-1 h-14 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 px-6 transition-all ${isValid
                                ? 'bg-[#8D0B41] text-white hover:bg-[#B01E58] active:scale-[0.98] shadow-[#8D0B41]/25'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            <span className="font-bold">Add to Cart</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded text-base">₹{calculateTotal.toFixed(0)}</span>
                            <ShoppingBag className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
            <style jsx global>{`
        @keyframes slide-up-spring {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up-spring { animation: slide-up-spring 0.5s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        
        @keyframes fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        .animate-fade-out { animation: fade-out 0.3s ease-in forwards; }
      `}</style>
        </div>
    );
}
