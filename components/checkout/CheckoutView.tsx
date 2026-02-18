"use client";

import React, { useState } from 'react';
import { User, Phone, CheckCircle2, ChevronRight, Loader2, CreditCard } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { placeOrder } from '@/lib/api';

interface CheckoutViewProps {
    onBack: () => void;
    onSuccess: (orderId: string) => void;
}

export default function CheckoutView({ onBack, onSuccess }: CheckoutViewProps) {
    const { cartItems, cartTotal, clearCart } = useCart();
    const [name, setName] = useState(localStorage.getItem('dinestack_customer_name') || '');
    const [phone, setPhone] = useState(localStorage.getItem('dinestack_customer_phone') || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // Validate
            if (!name.trim() || !phone.trim() || phone.length < 10) {
                throw new Error("Please provide valid name and phone number.");
            }

            // Prepare payload
            const items = cartItems.map(item => ({
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                price: item.finalPrice,
                // Backend might need options/instructions. 
                // For now, API only accepts basic structure. 
                // We'll need to check if backend supports options/instructions in the order payload.
                // Assuming current API structure from lib/api.ts: 
                // items: { menuItemId: string; quantity: number; price: number }[]
            }));

            // Call API
            const deviceToken = localStorage.getItem('dinestack_device_token');
            const result = await placeOrder(items, cartTotal, undefined, deviceToken || undefined);

            if (result.success) {
                clearCart();
                onSuccess(result.orderNumber || 'ORDER-ID');
            } else {
                throw new Error("Failed to place order. Please try again.");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Something went wrong.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <div className="p-4 bg-white shadow-sm flex items-center gap-3">
                <button onClick={onBack} className="text-[#8D0B41] font-medium text-sm">Back</button>
                <h2 className="text-lg font-bold flex-1 text-center pr-8">Checkout</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Contact Info */}
                <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <User className="w-4 h-4 text-[#8D0B41]" /> Contact Details
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-[#8D0B41] font-medium"
                                placeholder="Your Name"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-[#8D0B41] font-medium"
                                placeholder="Phone Number"
                            />
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#8D0B41]" /> Order Summary
                    </h3>
                    <div className="space-y-2">
                        {cartItems.map(item => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-gray-600"><span className="font-bold">{item.quantity}x</span> {item.name}</span>
                                <span className="font-medium">₹{(item.finalPrice * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                        <div className="h-px bg-gray-100 my-2"></div>
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span className="text-[#8D0B41]">₹{cartTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}
            </div>

            <div className="p-4 bg-white border-t space-y-3">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-[#8D0B41] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-[#B01E58] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Confirm Order</span>}
                </button>
            </div>
        </div>
    );
}
