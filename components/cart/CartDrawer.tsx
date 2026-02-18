"use client";

import React, { useState } from 'react';
import { X, Trash2, ChevronRight, ShoppingBag, Plus, Minus } from 'lucide-react';
import { useCart, CartItem } from '../../contexts/CartContext';
import CheckoutView from '../checkout/CheckoutView';

export default function CartDrawer() {
    const { isCartOpen, closeCart, cartItems, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
    const [view, setView] = useState<'cart' | 'checkout' | 'success'>('cart');
    const [lastOrderId, setLastOrderId] = useState<string | null>(null);

    const handleClose = () => {
        closeCart();
        setTimeout(() => {
            setView('cart'); // Reset view after closing animation
            setLastOrderId(null);
        }, 300);
    };

    const handleCheckoutSuccess = (orderId: string) => {
        setLastOrderId(orderId);
        setView('success');
    };

    if (!isCartOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto animate-fade-in"
                onClick={handleClose}
            />

            {/* Drawer */}
            <div className="relative w-full max-w-md h-full bg-slate-50 shadow-2xl transform transition-transform duration-300 pointer-events-auto animate-slide-in-right flex flex-col">

                {/* Header (Shared) */}
                {view !== 'success' && view !== 'checkout' && (
                    <div className="px-6 py-4 bg-white border-b flex items-center justify-between shrink-0">
                        <h2 className="text-xl font-serif-custom font-bold text-[#5A0528]">Your Cart</h2>
                        <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                )}


                {/* Content */}
                <div className="flex-1 overflow-hidden relative">
                    {view === 'cart' && (
                        <div className="h-full flex flex-col">
                            {cartItems.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 opacity-60">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                                        <ShoppingBag className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-700">Your cart is empty</h3>
                                    <p className="text-sm text-gray-500">Looks like you haven't added anything yet.</p>
                                    <button onClick={handleClose} className="text-[#8D0B41] font-bold text-sm underline">
                                        Browse Menu
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {/* Clear Cart */}
                                    <div className="flex justify-end">
                                        <button onClick={clearCart} className="text-xs text-red-500 flex items-center gap-1 hover:underline">
                                            <Trash2 className="w-3 h-3" /> Clear All
                                        </button>
                                    </div>

                                    {cartItems.map((item) => (
                                        <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 animate-fade-in-up">
                                            {/* Image Placeholder or Actual Image */}


                                            <div className="flex-1 flex flex-col justify-between">
                                                <div>
                                                    <h4 className="font-bold text-gray-900 line-clamp-1">{item.name}</h4>
                                                    <p className="text-xs text-gray-500 line-clamp-1">
                                                        {/* Show options mock */}
                                                        {Object.values(item.selectedOptions).flat().map(o => o.name).join(', ')}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="font-bold text-[#8D0B41]">₹{(item.finalPrice * item.quantity).toFixed(2)}</div>

                                                    <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                                                        <button
                                                            onClick={() => item.quantity > 1 ? updateQuantity(item.id, -1) : removeFromCart(item.id)}
                                                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-lg transition-colors"
                                                        >
                                                            {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-red-400" /> : <Minus className="w-3.5 h-3.5" />}
                                                        </button>
                                                        <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, 1)}
                                                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-r-lg transition-colors"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {view === 'checkout' && (
                        <div className="h-full">
                            <CheckoutView onBack={() => setView('cart')} onSuccess={handleCheckoutSuccess} />
                        </div>
                    )}

                    {view === 'success' && (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-scale-in">
                                <ShoppingBag className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-3xl font-serif-custom font-bold text-[#5A0528] mb-2">Order Placed!</h2>
                            <p className="text-gray-600 mb-8">Your order #{lastOrderId} has been sent to the kitchen.</p>
                            <button
                                onClick={handleClose}
                                className="w-full bg-[#8D0B41] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-[#B01E58] transition-all"
                            >
                                Back to Menu
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer (Cart View Only) */}
                {view === 'cart' && cartItems.length > 0 && (
                    <div className="p-4 bg-white border-t space-y-3 shrink-0 box-shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                        <div className="flex justify-between items-end">
                            <span className="text-gray-500 font-medium">Total Amount</span>
                            <span className="text-2xl font-bold text-[#8D0B41]">₹{cartTotal.toFixed(2)}</span>
                        </div>
                        <button
                            onClick={() => setView('checkout')}
                            className="w-full bg-[#8D0B41] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-[#B01E58] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                        >
                            <span>Proceed to Checkout</span>
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}
            </div>

            <style jsx global>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right { animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @keyframes scale-in {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in { animation: scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>
        </div>
    );
}
