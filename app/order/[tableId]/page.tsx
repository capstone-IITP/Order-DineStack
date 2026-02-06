"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingCart, Minus, Plus, ChefHat, AlertCircle, CheckCircle2, Loader2, Utensils } from 'lucide-react';
import { getTableInfo, placeOrder, Category, MenuItem, TableInfoResponse } from '@/lib/api';
import Image from 'next/image';

interface CartItem extends MenuItem {
    quantity: number;
}

export default function TableOrderPage() {
    const params = useParams();
    const router = useRouter();
    const tableId = params.tableId as string;

    // State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tableInfo, setTableInfo] = useState<TableInfoResponse | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

    // Derived State
    const cartTotal = useMemo(() => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }, [cart]);

    const cartItemCount = useMemo(() => {
        return cart.reduce((count, item) => count + item.quantity, 0);
    }, [cart]);

    // Load table info + menu on mount
    useEffect(() => {
        const loadData = async () => {
            if (!tableId) {
                setError('Invalid QR Code. No table information found.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const data = await getTableInfo(tableId);
                setTableInfo(data);
                setError(null);
            } catch (err: any) {
                console.error("Error loading data:", err);
                const errorMessage = err?.response?.data?.error || 'Failed to load menu. Please try again or ask for help.';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [tableId]);

    // Handlers
    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = (itemId: string) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === itemId);
            if (!existing) return prev;

            if (existing.quantity > 1) {
                return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
            }
            return prev.filter(i => i.id !== itemId);
        });
    };

    const getItemQuantity = (itemId: string) => {
        return cart.find(i => i.id === itemId)?.quantity || 0;
    };

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return;

        if (!window.confirm(`Place order for ₹${cartTotal}?`)) return;

        setPlacingOrder(true);
        try {
            const orderItems = cart.map(item => ({
                menuItemId: item.id,
                quantity: item.quantity,
                price: item.price
            }));

            const result = await placeOrder(orderItems, cartTotal);

            setCart([]);
            setOrderSuccess(result.orderNumber || 'placed');

            setTimeout(() => {
                setOrderSuccess(null);
            }, 5000);

        } catch (err) {
            alert('Failed to place order. Please try again.');
        } finally {
            setPlacingOrder(false);
        }
    };

    // Loading State
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Loading menu, please wait...</p>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-orange-600 text-white rounded-full font-medium shadow-md hover:bg-orange-700 transition"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const menu = tableInfo?.categories || [];

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                        <ChefHat size={18} />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900 leading-tight">
                            {tableInfo?.restaurant.name || 'Restaurant'}
                        </h1>
                        <p className="text-xs text-gray-500">
                            Table {tableInfo?.table.number || '?'}
                        </p>
                    </div>
                </div>
            </header>

            {/* Success Banner */}
            {orderSuccess && (
                <div className="fixed top-20 left-4 right-4 z-50 bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                        <p className="font-bold text-sm">Order Placed Successfully!</p>
                        <p className="text-xs text-green-700">Order #{orderSuccess}</p>
                    </div>
                    <button onClick={() => setOrderSuccess(null)} className="text-green-600 hover:text-green-800">
                        Close
                    </button>
                </div>
            )}

            {/* Menu List */}
            <main className="p-4 space-y-8">
                {menu.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        <Utensils className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Menu is currently empty.</p>
                    </div>
                )}

                {menu.map((category) => (
                    <section key={category.id} id={category.id}>
                        <h2 className="text-lg font-bold text-gray-800 mb-4 sticky top-16 bg-gray-50/95 py-2 z-0">
                            {category.name}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {category.items.map((item) => {
                                const qty = getItemQuantity(item.id);
                                return (
                                    <div key={item.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex gap-4">
                                        {/* Item Image */}
                                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden">
                                            {item.image ? (
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <Utensils size={24} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Item Details */}
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
                                                    <span className="text-sm font-bold text-gray-700">₹{item.price}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                                            </div>

                                            {/* Add/Quantity Controls */}
                                            <div className="flex justify-end mt-3">
                                                {qty === 0 ? (
                                                    <button
                                                        onClick={() => addToCart(item)}
                                                        disabled={!item.isAvailable}
                                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition
                              ${item.isAvailable
                                                                ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 active:bg-orange-200'
                                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                    >
                                                        {item.isAvailable ? 'Add' : 'Sold Out'}
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center bg-orange-600 rounded-lg text-white shadow-sm">
                                                        <button
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="p-1.5 hover:bg-orange-700 rounded-l-lg transition"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <span className="w-6 text-center text-sm font-bold">{qty}</span>
                                                        <button
                                                            onClick={() => addToCart(item)}
                                                            className="p-1.5 hover:bg-orange-700 rounded-r-lg transition"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {category.items.length === 0 && (
                            <p className="text-sm text-gray-400 italic">No items in this category.</p>
                        )}
                    </section>
                ))}
            </main>

            {/* Floating Cart Bar */}
            {cartItemCount > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent z-20">
                    <div className="bg-gray-900 text-white rounded-2xl p-4 shadow-xl flex items-center justify-between max-w-4xl mx-auto">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-400 font-medium">{cartItemCount} items</span>
                            <span className="font-bold text-lg">₹{cartTotal.toFixed(2)}</span>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            disabled={placingOrder}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 transition disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {placingOrder ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Placing...
                                </>
                            ) : (
                                <>
                                    Place Order
                                    <ShoppingCart size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
