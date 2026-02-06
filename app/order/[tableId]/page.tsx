"use client";

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingBag, Minus, Plus, AlertCircle, CheckCircle2, Loader2, Utensils, ChefHat } from 'lucide-react';
import { getTableInfo, placeOrder, SessionData, Category, MenuItem } from '@/lib/api';
import Image from 'next/image';

// Custom color palette
const colors = {
    cream: '#FFFBEA',
    creamLight: '#F7F3E8',
    burgundy: '#8A1538',
    burgundyDark: '#6D0F2E',
    textPrimary: '#111111',
    textSecondary: '#2B2B2B',
    grayLight: '#E5E5E5',
    grayMedium: '#C9C9C9',
    error: '#D32F2F',
    success: '#2E7D32',
};

interface CartItem extends MenuItem {
    quantity: number;
}

function OrderContent() {
    const params = useParams();
    const router = useRouter();
    const tableId = params.tableId as string;

    // State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [session, setSession] = useState<SessionData | null>(null);
    const [menu, setMenu] = useState<Category[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

    const cartTotal = useMemo(() => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }, [cart]);

    const cartItemCount = useMemo(() => {
        return cart.reduce((count, item) => count + item.quantity, 0);
    }, [cart]);

    // Effects
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
                setSession({
                    token: data.token,
                    restaurant: data.restaurant,
                    table: data.table
                });
                setMenu(data.categories);
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
            <div
                className="flex flex-col items-center justify-center min-h-screen p-4"
                style={{ backgroundColor: colors.cream }}
            >
                <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4 animate-pulse"
                    style={{ backgroundColor: colors.burgundy }}
                >
                    <ChefHat className="w-8 h-8 text-white" />
                </div>
                <Loader2
                    className="w-8 h-8 animate-spin mb-3"
                    style={{ color: colors.burgundy }}
                />
                <p style={{ color: colors.textSecondary }} className="font-medium">
                    Preparing your menu...
                </p>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div
                className="flex flex-col items-center justify-center min-h-screen p-6 text-center"
                style={{ backgroundColor: colors.cream }}
            >
                <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${colors.error}15` }}
                >
                    <AlertCircle className="w-8 h-8" style={{ color: colors.error }} />
                </div>
                <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                    Something went wrong
                </h2>
                <p className="mb-6 max-w-xs" style={{ color: colors.textSecondary }}>
                    {error}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-8 py-3 rounded-full font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-95"
                    style={{ backgroundColor: colors.burgundy }}
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-28" style={{ backgroundColor: colors.cream }}>
            {/* Elegant Header */}
            <header
                className="sticky top-0 z-10 backdrop-blur-md border-b px-5 py-4"
                style={{
                    backgroundColor: `${colors.cream}ee`,
                    borderColor: colors.grayLight
                }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
                        style={{
                            background: `linear-gradient(135deg, ${colors.burgundy}, ${colors.burgundyDark})`
                        }}
                    >
                        <ChefHat className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1
                            className="text-xl font-bold tracking-tight"
                            style={{ color: colors.textPrimary }}
                        >
                            {session?.restaurant.name || 'Restaurant'}
                        </h1>
                        <div className="flex items-center gap-2">
                            <span
                                className="text-xs font-medium px-2 py-0.5 rounded-full"
                                style={{
                                    backgroundColor: colors.creamLight,
                                    color: colors.burgundy
                                }}
                            >
                                Table {session?.table.number || '?'}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Success Banner */}
            {orderSuccess && (
                <div
                    className="fixed top-20 left-4 right-4 z-50 px-5 py-4 rounded-2xl shadow-xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4"
                    style={{
                        backgroundColor: `${colors.success}10`,
                        border: `2px solid ${colors.success}30`
                    }}
                >
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: colors.success }}
                    >
                        <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold" style={{ color: colors.success }}>
                            Order Confirmed!
                        </p>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                            Order #{orderSuccess} is being prepared
                        </p>
                    </div>
                </div>
            )}

            {/* Menu */}
            <main className="px-4 py-6 space-y-8">
                {menu.length === 0 && (
                    <div className="text-center py-16">
                        <div
                            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                            style={{ backgroundColor: colors.creamLight }}
                        >
                            <Utensils className="w-10 h-10" style={{ color: colors.grayMedium }} />
                        </div>
                        <p style={{ color: colors.textSecondary }}>
                            Menu is being prepared...
                        </p>
                    </div>
                )}

                {menu.map((category) => (
                    <section key={category.id}>
                        {/* Category Header */}
                        <div className="flex items-center gap-3 mb-5">
                            <div
                                className="w-1 h-6 rounded-full"
                                style={{ backgroundColor: colors.burgundy }}
                            />
                            <h2
                                className="text-lg font-bold uppercase tracking-wider"
                                style={{ color: colors.textPrimary }}
                            >
                                {category.name}
                            </h2>
                            <div
                                className="flex-1 h-px"
                                style={{ backgroundColor: colors.grayLight }}
                            />
                        </div>

                        {/* Items Grid */}
                        <div className="space-y-4">
                            {category.items.map((item) => {
                                const qty = getItemQuantity(item.id);
                                const isInCart = qty > 0;

                                return (
                                    <div
                                        key={item.id}
                                        className="rounded-2xl p-4 flex gap-4 transition-all"
                                        style={{
                                            backgroundColor: isInCart ? colors.creamLight : 'white',
                                            border: isInCart
                                                ? `2px solid ${colors.burgundy}30`
                                                : `1px solid ${colors.grayLight}`,
                                            boxShadow: isInCart
                                                ? `0 4px 20px ${colors.burgundy}15`
                                                : '0 2px 8px rgba(0,0,0,0.04)'
                                        }}
                                    >
                                        {/* Image */}
                                        <div
                                            className="w-24 h-24 rounded-xl flex-shrink-0 relative overflow-hidden"
                                            style={{ backgroundColor: colors.creamLight }}
                                        >
                                            {item.image ? (
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Utensils
                                                        size={28}
                                                        style={{ color: colors.grayMedium }}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 flex flex-col justify-between min-w-0">
                                            <div>
                                                <h3
                                                    className="font-semibold text-base truncate"
                                                    style={{ color: colors.textPrimary }}
                                                >
                                                    {item.name}
                                                </h3>
                                                <p
                                                    className="text-sm line-clamp-2 mt-1"
                                                    style={{ color: colors.textSecondary }}
                                                >
                                                    {item.description}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between mt-3">
                                                <span
                                                    className="text-lg font-bold"
                                                    style={{ color: colors.burgundy }}
                                                >
                                                    ₹{item.price}
                                                </span>

                                                {/* Controls */}
                                                {qty === 0 ? (
                                                    <button
                                                        onClick={() => addToCart(item)}
                                                        disabled={!item.isAvailable}
                                                        className="px-5 py-2 rounded-full text-sm font-semibold transition-all active:scale-95"
                                                        style={item.isAvailable ? {
                                                            backgroundColor: colors.burgundy,
                                                            color: 'white'
                                                        } : {
                                                            backgroundColor: colors.grayLight,
                                                            color: colors.grayMedium
                                                        }}
                                                    >
                                                        {item.isAvailable ? 'ADD' : 'Sold Out'}
                                                    </button>
                                                ) : (
                                                    <div
                                                        className="flex items-center rounded-full shadow-md overflow-hidden"
                                                        style={{ backgroundColor: colors.burgundy }}
                                                    >
                                                        <button
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="p-2.5 text-white hover:bg-black/10 transition"
                                                        >
                                                            <Minus size={16} />
                                                        </button>
                                                        <span className="w-8 text-center text-white font-bold">
                                                            {qty}
                                                        </span>
                                                        <button
                                                            onClick={() => addToCart(item)}
                                                            className="p-2.5 text-white hover:bg-black/10 transition"
                                                        >
                                                            <Plus size={16} />
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
                            <p
                                className="text-sm italic text-center py-4"
                                style={{ color: colors.grayMedium }}
                            >
                                No items available
                            </p>
                        )}
                    </section>
                ))}
            </main>

            {/* Premium Cart Bar */}
            {cartItemCount > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 z-20">
                    <div
                        className="rounded-2xl p-4 flex items-center justify-between max-w-lg mx-auto shadow-2xl"
                        style={{
                            background: `linear-gradient(135deg, ${colors.burgundy}, ${colors.burgundyDark})`
                        }}
                    >
                        <div>
                            <p className="text-white/70 text-xs font-medium">
                                {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                            </p>
                            <p className="text-white text-xl font-bold">
                                ₹{cartTotal.toFixed(0)}
                            </p>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            disabled={placingOrder}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-70"
                            style={{
                                backgroundColor: colors.cream,
                                color: colors.burgundy
                            }}
                        >
                            {placingOrder ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Placing...
                                </>
                            ) : (
                                <>
                                    Place Order
                                    <ShoppingBag size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function TableOrderPage() {
    return (
        <Suspense fallback={
            <div
                className="flex flex-col justify-center items-center min-h-screen"
                style={{ backgroundColor: '#FFFBEA' }}
            >
                <Loader2 className="animate-spin w-10 h-10" style={{ color: '#8A1538' }} />
            </div>
        }>
            <OrderContent />
        </Suspense>
    );
}
