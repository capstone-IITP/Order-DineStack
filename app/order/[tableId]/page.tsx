"use client";

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingBag, Minus, Plus, AlertCircle, CheckCircle2, Loader2, Utensils, ChefHat, Search, ArrowRight } from 'lucide-react';
import { getTableInfo, placeOrder, SessionData, Category, MenuItem } from '@/lib/api';
import Image from 'next/image';

// Premium Theme Colors & Styles
const theme = {
    background: 'radial-gradient(circle at top center, #8A1538 0%, #FFF0F5 40%, #FFFFFF 100%)',
    primary: '#8A1538',
    primaryDark: '#6D0F2E',
    secondary: '#D4AF37', // Gold accent
    text: '#2D1810',
    textLight: '#6B5B56',
    white: '#FFFFFF',
    surface: 'rgba(255, 255, 255, 0.85)',
    surfaceHover: 'rgba(255, 255, 255, 0.95)',
    glass: 'backdrop-blur-md bg-white/70 shadow-xl border border-white/40',
};

interface CartItem extends MenuItem {
    quantity: number;
}

function OrderContent() {
    const params = useParams();
    const tableId = params.tableId as string;

    // State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [session, setSession] = useState<SessionData | null>(null);
    const [menu, setMenu] = useState<Category[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>("");

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
                if (data.categories.length > 0) {
                    setActiveCategory(data.categories[0].id);
                }
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

    // Scroll Spy for Active Category
    useEffect(() => {
        const handleScroll = () => {
            const sections = document.querySelectorAll('section[id]');
            let current = "";
            sections.forEach(section => {
                const top = (section as HTMLElement).offsetTop;
                if (window.scrollY >= top - 200) {
                    current = section.getAttribute('id') || "";
                }
            });
            if (current) setActiveCategory(current);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [menu]);

    // Handlers
    const scrollToCategory = (categoryId: string) => {
        const element = document.getElementById(categoryId);
        if (element) {
            window.scrollTo({
                top: element.offsetTop - 180,
                behavior: 'smooth'
            });
            setActiveCategory(categoryId);
        }
    };

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
            <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 z-0" style={{ background: theme.background }} />
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-2xl animate-pulse"
                        style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
                        <ChefHat className="w-10 h-10 text-white" />
                    </div>
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-purple-900" />
                    <p className="font-serif text-xl tracking-wide text-purple-950/80">
                        Curating your experience...
                    </p>
                </div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 z-0" style={{ background: theme.background }} />
                <div className="relative z-10 bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl max-w-sm w-full border border-white/50">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto bg-red-50 text-red-500">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold mb-3 text-gray-900">
                        Unable to Load Menu
                    </h2>
                    <p className="mb-8 text-gray-600 leading-relaxed font-sans">
                        {error}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95"
                        style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-32 font-sans selection:bg-pink-200" style={{ background: theme.background }}>

            {/* Hero Header */}
            <header className="relative pt-12 pb-20 px-6 text-center overflow-hidden">
                <div className="relative z-10 flex flex-col items-center animate-in slide-in-from-top-10 duration-700">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl mb-5 transform rotate-3 hover:rotate-0 transition-all duration-500"
                        style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
                        <ChefHat className="w-8 h-8 text-white drop-shadow-md" />
                    </div>
                    <h1 className="text-3xl font-serif font-black tracking-tight mb-2 text-gray-900">
                        {session?.restaurant.name || 'Fine Dining'}
                    </h1>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/40 border border-white/50 backdrop-blur-md shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm font-medium text-gray-700">
                            Table {session?.table.number || '01'}
                        </span>
                    </div>
                </div>
            </header>

            {/* Sticky Category Nav */}
            <div className="sticky top-4 z-40 mb-8 mx-4">
                <nav className="flex gap-3 overflow-x-auto pb-4 pt-2 px-1 scrollbar-hide snap-x"
                    style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
                    {menu.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => scrollToCategory(category.id)}
                            className={`flex-none px-6 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 shadow-sm snap-center
                                ${activeCategory === category.id
                                    ? 'text-white shadow-lg transform scale-105'
                                    : 'bg-white/70 text-gray-600 hover:bg-white/90'
                                }`}
                            style={{
                                background: activeCategory === category.id
                                    ? `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})`
                                    : undefined
                            }}
                        >
                            {category.name}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Main Menu Grid */}
            <main className="px-5 space-y-12 max-w-xl mx-auto">
                {menu.map((category) => (
                    <section key={category.id} id={category.id} className="scroll-mt-48">
                        <div className="flex items-center gap-4 mb-6">
                            <h2 className="text-2xl font-serif font-bold text-gray-900 leading-none">
                                {category.name}
                            </h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-pink-200 to-transparent" />
                        </div>

                        <div className="space-y-6">
                            {category.items.map((item) => {
                                const qty = getItemQuantity(item.id);
                                return (
                                    <div
                                        key={item.id}
                                        className="group relative bg-white/60 backdrop-blur-md rounded-3xl p-3 shadow-sm hover:shadow-xl hover:bg-white/80 transition-all duration-500 border border-white/50"
                                    >
                                        <div className="flex gap-4">
                                            {/* Image */}
                                            <div className="w-28 h-28 rounded-2xl flex-shrink-0 relative overflow-hidden bg-gray-100 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                                {item.image ? (
                                                    <Image
                                                        src={item.image}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center opacity-20">
                                                        <Utensils className="w-8 h-8 text-gray-500" />
                                                    </div>
                                                )}
                                                {!item.isAvailable && (
                                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                                                        <span className="text-white text-xs font-bold px-2 py-1 rounded border border-white/30 truncate">
                                                            SOLD OUT
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                                                <div>
                                                    <h3 className="font-serif font-bold text-lg text-gray-900 truncate pr-2">
                                                        {item.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                                                        {item.description}
                                                    </p>
                                                </div>

                                                <div className="flex items-end justify-between mt-3">
                                                    <span className="font-sans font-bold text-lg text-rose-900">
                                                        ₹{item.price}
                                                    </span>

                                                    {qty === 0 ? (
                                                        <button
                                                            onClick={() => addToCart(item)}
                                                            disabled={!item.isAvailable}
                                                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                                                            style={{ background: theme.primary }}
                                                        >
                                                            <Plus className="w-5 h-5 text-white" />
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center bg-gray-900 rounded-full h-8 px-1 shadow-lg">
                                                            <button
                                                                onClick={() => removeFromCart(item.id)}
                                                                className="w-7 h-full flex items-center justify-center text-white/90 hover:text-white active:scale-75 transition-all"
                                                            >
                                                                <Minus size={14} />
                                                            </button>
                                                            <span className="w-4 text-center font-bold text-white text-sm">
                                                                {qty}
                                                            </span>
                                                            <button
                                                                onClick={() => addToCart(item)}
                                                                className="w-7 h-full flex items-center justify-center text-white/90 hover:text-white active:scale-75 transition-all"
                                                            >
                                                                <Plus size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ))}

                {menu.length > 0 && (
                    <div className="pt-8 pb-12 text-center">
                        <div className="w-2 h-2 rounded-full bg-rose-200 mx-auto mb-2" />
                        <p className="text-xs font-serif italic text-rose-900/40">
                            End of Menu
                        </p>
                    </div>
                )}
            </main>

            {/* Smart Cart FAB */}
            {cartItemCount > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none">
                    <div className="max-w-md mx-auto pointer-events-auto">
                        <button
                            onClick={handlePlaceOrder}
                            disabled={placingOrder}
                            className="w-full group relative overflow-hidden rounded-2xl p-4 shadow-2xl transition-all active:scale-[0.98]"
                        >
                            <div className="absolute inset-0 z-0 bg-gray-900" />

                            {/* Gradient glow effect */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 opacity-20 blur-lg group-hover:opacity-40 transition-opacity" />

                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-sm">
                                        <span className="font-bold text-white text-lg">{cartItemCount}</span>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Total</p>
                                        <p className="text-white font-bold text-lg leading-none">₹{cartTotal.toFixed(0)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pl-6 pr-2">
                                    <span className="text-white font-bold text-lg tracking-wide">
                                        {placingOrder ? 'Sending...' : 'Place Order'}
                                    </span>
                                    {placingOrder ? (
                                        <Loader2 className="w-5 h-5 text-white/80 animate-spin" />
                                    ) : (
                                        <ArrowRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
                                    )}
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* Order Success Toast */}
            {orderSuccess && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xs animate-in slide-in-from-top-4 fade-in">
                    <div className="bg-emerald-500 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-emerald-400/50 backdrop-blur-md">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg leading-none">Order Sent!</h4>
                            <p className="text-emerald-50 text-sm mt-1">Order #{orderSuccess} placed</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function TableOrderPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col justify-center items-center min-h-screen bg-rose-50">
                <Loader2 className="animate-spin w-10 h-10 text-rose-900" />
            </div>
        }>
            <OrderContent />
        </Suspense>
    );
}
