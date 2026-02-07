"use client";

import React, { useEffect, useState, useMemo, Suspense, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingBag, Minus, Plus, AlertCircle, CheckCircle2, Loader2, Utensils, ChefHat, Search, ArrowRight, ArrowLeft, Star } from 'lucide-react';
import { getTableInfo, placeOrder, SessionData, Category, MenuItem } from '@/lib/api';
import Image from 'next/image';

// Delivery App Style Theme
const theme = {
    background: '#F9F9F9',
    primary: '#8A1538', // Burgundy/Maroon BRAND color
    textPrimary: '#333333',
    textSecondary: '#666666',
    white: '#FFFFFF',
    border: '#E0E0E0',
    success: '#2D9F5D',
    activePill: '#8A1538',
    inactivePill: '#FFFFFF',
    danger: '#D32F2F'
};

interface CartItem extends MenuItem {
    quantity: number;
}

function OrderContent() {
    const params = useParams();
    const router = useRouter();
    const tableId = params.tableId as string;
    const categoryRefs = useRef<{ [key: string]: HTMLElement | null }>({});
    const navRef = useRef<HTMLDivElement>(null);

    // State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [session, setSession] = useState<SessionData | null>(null);
    const [menu, setMenu] = useState<Category[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>("");
    const [scrolled, setScrolled] = useState(false);

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

    // Header scroll background effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);

            // Scroll Spy
            let current = "";
            const offset = 140; // Approx header height + nav height

            // simple logic: find the section closest to top
            for (const cat of menu) {
                const element = categoryRefs.current[cat.id];
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top <= offset + 50 && rect.bottom > offset) {
                        current = cat.id;
                        break; // Found the active one
                    }
                }
            }
            if (current && current !== activeCategory) {
                setActiveCategory(current);
                // Also scroll nav to active pill found via scroll
                scrollNavToCategory(current);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [menu, activeCategory]);

    const scrollNavToCategory = (categoryId: string) => {
        if (!navRef.current) return;
        const pill = navRef.current.querySelector(`[data-category="${categoryId}"]`) as HTMLElement;
        if (pill) {
            pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }

    // Handlers
    const scrollToCategory = (categoryId: string) => {
        setActiveCategory(categoryId);
        const element = categoryRefs.current[categoryId];
        if (element) {
            const headerOffset = 130;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
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

    // Helper: Image Placeholder
    const ImagePlaceholder = () => (
        <div className="w-full h-full flex items-center justify-center bg-[#F5F5F5] text-gray-400">
            <Utensils size={24} strokeWidth={1.5} />
        </div>
    );

    // Loading State
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#F9F9F9]">
                <Loader2 className="w-8 h-8 animate-spin text-[#8A1538] mb-3" />
                <p className="font-medium text-gray-500">Loading Menu...</p>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-[#F9F9F9]">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4 text-[#D32F2F]">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Unavailable</h3>
                <p className="text-gray-500 mb-6 max-w-xs">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 rounded-lg font-bold text-white bg-[#8A1538]"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-28 font-sans" style={{ backgroundColor: theme.background }}>

            {/* 1. Header Section */}
            <header
                className={`sticky top-0 z-50 transition-all duration-200 border-b border-transparent ${scrolled ? 'bg-white shadow-sm border-gray-100' : 'bg-[#F9F9F9]'}`}
            >
                {/* Top Row: Restaurant Info & Table Badge */}
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Optional Back Button */}
                        {/* <button className="p-1.5 -ml-2 rounded-full hover:bg-black/5">
                            <ArrowLeft size={22} className="text-gray-700" />
                        </button> */}

                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[#8A1538]">
                                <ChefHat size={20} fill="#8A1538" className="text-[#8A1538]" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-lg font-bold text-[#333] leading-tight line-clamp-1">
                                    {session?.restaurant.name || 'Restaurant'}
                                </h1>
                                <span className="text-xs text-gray-500">
                                    Fine Dining • North Indian
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Table Badge */}
                    <div className="flex items-center gap-1 bg-[#E8F5E9] border border-[#C8E6C9] px-2.5 py-1 rounded-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2D9F5D] animate-pulse" />
                        <span className="text-xs font-bold text-[#1B5E20] uppercase tracking-wide">
                            Table {session?.table.number}
                        </span>
                    </div>
                </div>

                {/* 2. Category Pills (Horizontal Scroll) */}
                <div className="px-4 pb-3 pt-1 w-full overflow-x-hidden">
                    <div
                        ref={navRef}
                        className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1"
                    >
                        {menu.map((category) => {
                            const isActive = activeCategory === category.id;
                            return (
                                <button
                                    key={category.id}
                                    data-category={category.id}
                                    onClick={() => scrollToCategory(category.id)}
                                    className={`flex-none px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap border
                                        ${isActive
                                            ? 'bg-[#333] text-white border-[#333] shadow-md transform scale-[1.02]'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {category.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* 3. Menu Items List */}
            <main className="px-4 py-2 space-y-6">
                {menu.map((category) => (
                    <section
                        key={category.id}
                        id={category.id}
                        ref={(el) => { categoryRefs.current[category.id] = el }}
                        className="scroll-mt-36"
                    >
                        <h2 className="text-lg font-bold text-[#333] mb-3 px-1">
                            {category.name}
                        </h2>

                        <div className="space-y-4">
                            {category.items.map((item) => {
                                const qty = getItemQuantity(item.id);
                                return (
                                    <div
                                        key={item.id}
                                        className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 w-full"
                                    >
                                        <div className="flex gap-3">
                                            {/* Left: Image (Square 96x96) */}
                                            <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                                {item.image ? (
                                                    <Image
                                                        src={item.image}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <ImagePlaceholder />
                                                )}
                                                {!item.isAvailable && (
                                                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center p-1 text-center">
                                                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                                            SOLD OUT
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right: Details */}
                                            <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                                                <div>
                                                    <div className="flex items-start justify-between gap-1">
                                                        <h3 className="font-bold text-[16px] text-[#333] leading-snug line-clamp-2">
                                                            {item.name}
                                                        </h3>
                                                    </div>
                                                    <p className="text-[13px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                                        {item.description || "Freshly prepared with authentic ingredients."}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between mt-2.5">
                                                    <span className="font-bold text-[16px] text-[#333]">
                                                        ₹{item.price}
                                                    </span>

                                                    {/* Add Button Area */}
                                                    <div className="relative z-10">
                                                        {qty === 0 ? (
                                                            <button
                                                                onClick={() => addToCart(item)}
                                                                disabled={!item.isAvailable}
                                                                className="w-8 h-8 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all text-white disabled:opacity-50 disabled:grayscale"
                                                                style={{ backgroundColor: theme.primary }}
                                                            >
                                                                <Plus size={18} strokeWidth={3} />
                                                            </button>
                                                        ) : (
                                                            <div className="flex items-center h-8 bg-white border border-gray-200 rounded-full shadow-sm overflow-hidden">
                                                                <button
                                                                    onClick={() => removeFromCart(item.id)}
                                                                    className="w-8 h-full flex items-center justify-center text-[#8A1538] hover:bg-red-50 active:bg-red-100 transition-colors"
                                                                >
                                                                    <Minus size={16} strokeWidth={3} />
                                                                </button>
                                                                <span className="min-w-[20px] text-center font-bold text-sm text-[#333]">
                                                                    {qty}
                                                                </span>
                                                                <button
                                                                    onClick={() => addToCart(item)}
                                                                    className="w-8 h-full flex items-center justify-center text-[#8A1538] hover:bg-red-50 active:bg-red-100 transition-colors"
                                                                >
                                                                    <Plus size={16} strokeWidth={3} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
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
                    <div className="py-8 text-center">
                        <div className="w-12 h-[1px] bg-gray-300 mx-auto mb-3" />
                        <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">
                            End of Menu
                        </p>
                        <p className="text-[10px] text-gray-300 mt-1">
                            Powered by DineStack
                        </p>
                    </div>
                )}
            </main>

            {/* 4. Sticky Cart Bar */}
            {cartItemCount > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-white via-white to-transparent pb-6">
                    <div className="max-w-md mx-auto">
                        <button
                            onClick={handlePlaceOrder}
                            disabled={placingOrder}
                            className="w-full relative overflow-hidden rounded-xl shadow-lg transition-transform active:scale-[0.98] flex items-center justify-between p-0 bg-[#8A1538]"
                        >
                            {/* Left: Item Count & Price */}
                            <div className="flex flex-col justify-center px-5 py-3.5 bg-[#6D0F2E]/30 h-full border-r border-white/10">
                                <span className="text-[11px] font-medium text-white/80 uppercase tracking-wider">
                                    {cartItemCount} {cartItemCount === 1 ? 'ITEM' : 'ITEMS'}
                                </span>
                                <span className="text-lg font-bold text-white leading-none mt-0.5">
                                    ₹{cartTotal.toFixed(0)}
                                </span>
                            </div>

                            {/* Right: Action Text */}
                            <div className="flex-1 flex items-center justify-center gap-2 pr-2">
                                <span className="font-bold text-white text-[16px] tracking-wide">
                                    {placingOrder ? 'Sending Order...' : 'Place Order'}
                                </span>
                                {!placingOrder && <ArrowRight size={18} className="text-white" strokeWidth={3} />}
                                {placingOrder && <Loader2 size={18} className="text-white animate-spin" />}
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* Order Success Toast */}
            {orderSuccess && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-sm animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="bg-[#2D9F5D] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={18} className="text-white" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm">Order Sent Successfully!</h4>
                            <p className="text-white/90 text-xs mt-0.5">Order #{orderSuccess} has been placed.</p>
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
            <div className="flex flex-col justify-center items-center min-h-screen bg-[#F9F9F9]">
                <Loader2 className="animate-spin w-8 h-8 text-[#8A1538]" />
            </div>
        }>
            <OrderContent />
        </Suspense>
    );
}
