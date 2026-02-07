"use client";

import { X, Minus, Plus, ChefHat, ArrowRight } from 'lucide-react';

interface CartItem {
    menuItemId: string;
    quantity: number;
    notes?: string;
    name: string; // Enriched item
    price: number;
}

interface CartSheetProps {
    isOpen: boolean;
    onClose: () => void;
    cartItems: CartItem[];
    totalAmount: number;
    onIncrease: (id: string) => void;
    onDecrease: (id: string) => void;
    onPlaceOrder: (notes?: string) => void;
    isPlacingOrder: boolean;
    theme: { bg: string; text: string; primary: string; secondary: string; accent: string };
}

export default function CartSheet({
    isOpen,
    onClose,
    cartItems,
    totalAmount,
    onIncrease,
    onDecrease,
    onPlaceOrder,
    isPlacingOrder,
    theme
}: CartSheetProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="w-full bg-white rounded-t-[40px] max-h-[85vh] flex flex-col shadow-2xl animate-slide-up relative"
                style={{ backgroundColor: theme.bg }}>

                {/* Handle Bar */}
                <div className="w-full flex justify-center pt-4 pb-2" onClick={onClose}>
                    <div className="w-12 h-1.5 rounded-full bg-stone-300/50" />
                </div>

                {/* Header */}
                <div className="px-8 pb-4 border-b border-stone-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-serif font-bold" style={{ color: theme.primary }}>Your Order</h2>
                        <p className="text-sm text-stone-500">{cartItems.length} items selected</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                        <X size={24} style={{ color: theme.secondary }} />
                    </button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {cartItems.map((item) => (
                        <div key={item.menuItemId} className="flex gap-4">
                            {/* Quantity Controls */}
                            <div className="flex flex-col items-center gap-2 bg-white rounded-full py-2 px-1 shadow-sm border border-stone-100 h-fit">
                                <button onClick={() => onIncrease(item.menuItemId)} className="p-1 hover:bg-stone-50 rounded-full text-stone-600">
                                    <Plus size={14} />
                                </button>
                                <span className="font-bold text-sm w-6 text-center">{item.quantity}</span>
                                <button onClick={() => onDecrease(item.menuItemId)} className="p-1 hover:bg-stone-50 rounded-full text-stone-400">
                                    <Minus size={14} />
                                </button>
                            </div>

                            {/* Item Details */}
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-medium text-lg leading-tight" style={{ color: theme.primary }}>
                                        {item.name}
                                    </h4>
                                    <span className="font-bold ml-2" style={{ color: theme.primary }}>
                                        ₹{item.price * item.quantity}
                                    </span>
                                </div>
                                <p className="text-xs text-stone-500 mb-2">₹{item.price} per item</p>

                                {/* Notes (Simplified for now) */}
                                <button className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity" style={{ color: theme.accent }}>
                                    <ChefHat size={12} />
                                    Add cooking instructions
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-white border-t border-stone-100 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-stone-500 font-medium">Grand Total</span>
                        <span className="text-3xl font-bold" style={{ color: theme.primary }}>
                            ₹{totalAmount}
                        </span>
                    </div>

                    <button
                        onClick={() => onPlaceOrder()}
                        disabled={isPlacingOrder}
                        className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
                        style={{ backgroundColor: theme.primary, color: '#FFF' }}
                    >
                        {isPlacingOrder ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Sending order...
                            </>
                        ) : (
                            <>
                                <span>Place Order</span>
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}

                        {/* Shimmer Effect */}
                        {!isPlacingOrder && (
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
                        )}
                    </button>

                    <p className="text-center text-[10px] mt-4 text-stone-400">
                        By placing order you agree to our Terms of Service
                    </p>
                </div>
            </div>
        </div>
    );
}
