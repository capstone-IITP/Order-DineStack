"use client";

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShoppingCart, Minus, Plus, ChefHat, AlertCircle, CheckCircle2, Loader2, Utensils } from 'lucide-react';
import { initSession, getMenu, placeOrder, SessionData, Category, MenuItem } from '@/lib/api';
import Image from 'next/image';

interface CartItem extends MenuItem {
    quantity: number;
}

const IdentityForm = ({ onComplete }: { onComplete: (name: string, phone: string) => void }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || name.trim().length < 2) {
            setError('Please enter a valid name');
            return;
        }
        if (!phone.trim() || !/^\d{10}$/.test(phone.trim())) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }

        onComplete(name.trim(), phone.trim());
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600">
                        <ChefHat size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome!</h1>
                    <p className="text-gray-500 text-sm">Please enter your details to view the menu</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Name</label>
                        <input
                            type="text"
                            required
                            placeholder="Your Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition shadow-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Phone Number</label>
                        <input
                            type="tel"
                            required
                            placeholder="10-digit Mobile Number"
                            value={phone}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                setPhone(val);
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition shadow-sm"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-600/20 transition transform active:scale-[0.98]"
                    >
                        Continue to Menu
                    </button>
                </form>

                <p className="text-center text-xs text-gray-400">
                    Your details are used only for order management.
                </p>
            </div>
        </div>
    );
};

function OrderContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    // State
    const [loading, setLoading] = useState(true);
    const [identity, setIdentity] = useState<{ name: string; phone: string } | null>(null);
    const [showIdentityForm, setShowIdentityForm] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [session, setSession] = useState<SessionData | null>(null);
    const [menu, setMenu] = useState<Category[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

    // Derived State
    const restaurantId = searchParams.get('r');
    const tableId = searchParams.get('t');

    const cartTotal = useMemo(() => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }, [cart]);

    const cartItemCount = useMemo(() => {
        return cart.reduce((count, item) => count + item.quantity, 0);
    }, [cart]);

    // Effects
    useEffect(() => {
        const loadData = async () => {
            if (!restaurantId || !tableId) {
                setError('Invalid QR Code. Missing restaurant or table information.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                // 1. Init Session
                const sessionData = await initSession(restaurantId, tableId);
                setSession(sessionData);

                // 2. Load Menu
                const menuData = await getMenu(restaurantId);
                setMenu(menuData);

                setError(null);
            } catch (err: any) {
                console.error("Error loading data:", err);
                setError('Failed to load menu. Please try again or ask for help.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
        loadData();
    }, [restaurantId, tableId]);

    // Identity Logic
    useEffect(() => {
        const name = localStorage.getItem('dinestack_customer_name');
        const phone = localStorage.getItem('dinestack_customer_phone');
        if (name && phone && /^\d{10}$/.test(phone)) {
            setIdentity({ name, phone });
            setShowIdentityForm(false);
        } else {
            setShowIdentityForm(true);
        }
    }, []);

    const handleIdentitySubmit = (name: string, phone: string) => {
        localStorage.setItem('dinestack_customer_name', name);
        localStorage.setItem('dinestack_customer_phone', phone);
        setIdentity({ name, phone });
        setShowIdentityForm(false);
    };

    const handleIdentityReset = () => {
        if (window.confirm("Are you sure you want to change your details?")) {
            localStorage.removeItem('dinestack_customer_name');
            localStorage.removeItem('dinestack_customer_phone');
            setIdentity(null);
            setShowIdentityForm(true);
        }
    };

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

        // Optional: Add simple confirmation
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

            // For now, show success inline
            setTimeout(() => {
                setOrderSuccess(null);
            }, 5000);

        } catch (err) {
            alert('Failed to place order. Please try again.');
        } finally {
            setPlacingOrder(false);
        }
    };

    // Render States
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Loading menu, please wait...</p>
            </div>
        );
    }

    if (showIdentityForm) {
        return <IdentityForm onComplete={handleIdentitySubmit} />;
    }

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
                            {session?.restaurant.name || 'Restaurant'}
                        </h1>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Table {session?.table.number || '?'}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span>{identity?.name}</span>
                            <button onClick={handleIdentityReset} className="text-orange-600 font-medium hover:underline ml-1">
                                (Not you?)
                            </button>
                        </div>
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

export default function OrderPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <Loader2 className="animate-spin w-10 h-10 text-orange-500" />
            </div>
        }>
            <OrderContent />
        </Suspense>
    );
}
