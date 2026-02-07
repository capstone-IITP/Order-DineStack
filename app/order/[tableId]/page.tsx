"use client";

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Search,
    ShoppingBag,
    X,
    ChefHat,
    Plus,
    Minus,
    ChevronRight,
    Utensils,
    Coffee,
    IceCream,
    Soup,
    Flame,
    Sparkles,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Wallet,
    Banknote
} from 'lucide-react';
import { getTableInfo, placeOrder, SessionData, Category, MenuItem } from '@/lib/api';

// --- Configuration & Data ---

const THEME = {
    bg: '#FFFBEA',         // Warm Cream
    surface: '#FFFFFF',    // Pure White
    primary: '#8B1E3F',    // Deep Wine / Maroon
    secondary: '#C9A24D',  // Muted Gold
    text: '#1C1C1C',       // Near Black
    textMuted: '#6B6B6B',  // Soft Gray
    border: '#E8E4D5',     // Light Beige Border
    veg: '#2E7D32',        // Green
    nonVeg: '#C62828',     // Red
    glass: 'rgba(139, 30, 63, 0.95)', // Wine Glass for Cart
};

const CATEGORY_ICONS: { [key: string]: any } = {
    "All": Sparkles,
    "Starters": Soup,
    "Mains": Utensils,
    "Combos": ChefHat,
    "Desserts": IceCream,
    "Drinks": Coffee,
    "default": Flame
};

// --- Helper Components ---

const DotIndicator = ({ isVegetarian }: { isVegetarian?: boolean }) => (
    <div className={`w-2 h-2 rounded-full ${isVegetarian ? 'bg-green-700' : 'bg-red-700'}`} />
);

// --- Main App Component ---

function OrderContent() {
    const params = useParams();
    const router = useRouter();
    const tableId = params.tableId as string;

    // Backend state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [session, setSession] = useState<SessionData | null>(null);
    const [menu, setMenu] = useState<Category[]>([]);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
    const [orderError, setOrderError] = useState<string | null>(null);

    // UI state
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [cart, setCart] = useState<{ [key: string]: number }>({});
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [filters, setFilters] = useState({ vegOnly: false, nonVeg: false });
    const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('cash');

    // Load data from backend
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

    // --- Cart Logic ---
    const handleAddToCart = (id: string) => setCart(p => ({ ...p, [id]: (p[id] || 0) + 1 }));
    const handleRemoveFromCart = (id: string) => setCart(p => {
        const n = { ...p };
        if (n[id] > 1) n[id]--; else delete n[id];
        return n;
    });

    // Flatten menu items for filtering
    const allMenuItems = useMemo(() => {
        return menu.flatMap(cat => cat.items.map(item => ({
            ...item,
            category: cat.name
        })));
    }, [menu]);

    // Get unique categories from menu data
    const categories = useMemo(() => {
        const cats = [{ id: "All", label: "All", icon: CATEGORY_ICONS["All"] || Sparkles }];
        menu.forEach(cat => {
            cats.push({
                id: cat.name,
                label: cat.name,
                icon: CATEGORY_ICONS[cat.name] || CATEGORY_ICONS["default"]
            });
        });
        return cats;
    }, [menu]);

    const filteredItems = useMemo(() => {
        return allMenuItems.filter(item => {
            if (activeCategory !== "All" && item.category !== activeCategory) return false;
            if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (filters.vegOnly && !item.isVegetarian) return false;
            if (filters.nonVeg && item.isVegetarian) return false;
            if (!item.isAvailable) return false; // Hide unavailable items
            return true;
        });
    }, [allMenuItems, activeCategory, searchQuery, filters]);

    const cartTotal = Object.entries(cart).reduce((acc, [id, qty]) => {
        const item = allMenuItems.find(i => i.id === id);
        return acc + (item ? item.price * qty : 0);
    }, 0);

    const cartItemCount = Object.values(cart).reduce((a, b) => a + b, 0);

    // --- Order Placement ---
    const handlePlaceOrder = async () => {
        if (cartItemCount === 0) return;

        setPlacingOrder(true);
        setIsCartOpen(false);
        setOrderError(null); // Clear previous error

        try {
            const orderItems = Object.entries(cart).map(([id, qty]) => {
                const item = allMenuItems.find(i => i.id === id);
                return {
                    menuItemId: id,
                    quantity: qty,
                    price: item?.price || 0
                };
            });

            const result = await placeOrder(orderItems, cartTotal, tableId);

            setCart({});
            setOrderSuccess(result.orderNumber || 'placed');

            // Redirect to success page
            const params = new URLSearchParams();
            if (result.orderNumber) params.set('orderId', result.orderNumber);
            if (result.order.estimatedTime) params.set('estimatedTime', result.order.estimatedTime);

            router.push(`/order-success?${params.toString()}`);

        } catch (err: any) {
            console.error('Order placement error:', err);
            // Extract error message from axios error response
            const errorMessage = err?.response?.data?.error
                || err?.message
                || 'Failed to place order. Please try again.';
            setOrderError(errorMessage);

            // Auto-dismiss error after 6 seconds
            setTimeout(() => {
                setOrderError(null);
            }, 6000);
        } finally {
            setPlacingOrder(false);
        }
    };

    // Loading State
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen" style={{ backgroundColor: THEME.bg }}>
                <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: THEME.primary }} />
                <p className="font-medium" style={{ color: THEME.textMuted }}>Loading Menu...</p>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center" style={{ backgroundColor: THEME.bg }}>
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4" style={{ color: THEME.nonVeg }}>
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: THEME.text }}>Unavailable</h3>
                <p className="mb-6 max-w-xs" style={{ color: THEME.textMuted }}>{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 rounded-lg font-bold text-white"
                    style={{ backgroundColor: THEME.primary }}
                >
                    Retry
                </button>
            </div>
        );
    }

    // --- Render ---

    return (
        <div className="absolute inset-0 flex flex-col font-sans select-none overflow-hidden"
            style={{ backgroundColor: THEME.bg, color: THEME.text }}>

            {/* Background Ambience */}
            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[50%] bg-white/40 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[50%] bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="flex-none z-40 relative">
                <div className="px-6 pt-8 pb-2 flex justify-between items-end">
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] mb-1" style={{ color: THEME.secondary }}>
                            {session?.restaurant.name || 'Fine Dining'}
                        </h2>
                        <h1 className="text-3xl font-light tracking-tight" style={{ color: THEME.text }}>
                            DineStack<span className="font-bold">Menu</span><span style={{ color: THEME.primary }}>.</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Table Badge */}
                        <div className="flex items-center gap-1 bg-green-50 border border-green-200 px-2.5 py-1.5 rounded-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
                            <span className="text-xs font-bold text-green-800 uppercase tracking-wide">
                                {session?.table.number}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Categories (Floating Pills) */}
                <div className="overflow-x-auto no-scrollbar pt-6 pb-2 pl-6">
                    <div className="flex gap-4 min-w-max pr-6">
                        {categories.map(cat => {
                            const isActive = activeCategory === cat.id;
                            const Icon = cat.icon;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className="flex flex-col items-center gap-2 min-w-[72px] transition-all duration-300 group"
                                >
                                    <div
                                        className={`
                      w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 relative overflow-hidden shadow-sm
                      ${isActive ? 'scale-110' : 'bg-white border border-gray-100 hover:border-wine/20'}
                    `}
                                        style={{
                                            backgroundColor: isActive ? THEME.primary : THEME.surface,
                                            color: isActive ? 'white' : THEME.textMuted
                                        }}
                                    >
                                        <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                                    </div>
                                    <span
                                        className="text-[10px] font-medium tracking-wide transition-colors"
                                        style={{ color: isActive ? THEME.primary : THEME.textMuted }}
                                    >
                                        {cat.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Quick Filter Bar */}
                <div className="px-6 mt-2 flex gap-3 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setFilters(p => ({ vegOnly: !p.vegOnly, nonVeg: false }))}
                        className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${filters.vegOnly ? 'bg-green-50 border-green-600 text-green-700' : 'bg-transparent border-gray-300 text-gray-500'}`}
                    >
                        Veg Only
                    </button>
                    <button
                        onClick={() => setFilters(p => ({ nonVeg: !p.nonVeg, vegOnly: false }))}
                        className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${filters.nonVeg ? 'bg-red-50 border-red-600 text-red-700' : 'bg-transparent border-gray-300 text-gray-500'}`}
                    >
                        Non-Veg Only
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto scroll-smooth px-6 pt-6 pb-32 w-full overscroll-contain no-scrollbar relative z-10">

                {filteredItems.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center opacity-40">
                        <Utensils size={48} className="mb-4" style={{ color: THEME.textMuted }} />
                        <p className="font-light" style={{ color: THEME.textMuted }}>Our chefs are resting.<br />Try different filters.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredItems.map((item, index) => (
                            <div
                                key={item.id}
                                className="group relative bg-white rounded-3xl p-5 shadow-sm border border-transparent hover:border-wine/10 hover:shadow-md transition-all duration-300 animate-fade-in-up"
                                style={{ animationDelay: `${index * 50}ms`, borderColor: THEME.border }}
                            >
                                <div className="relative z-10 flex justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <DotIndicator isVegetarian={item.isVegetarian} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: THEME.textMuted }}>{item.category}</span>
                                        </div>
                                        <h3 className="text-lg font-medium mb-2 leading-tight" style={{ color: THEME.text }}>{item.name}</h3>
                                        <p className="text-sm leading-relaxed line-clamp-2" style={{ color: THEME.textMuted }}>{item.description || "Freshly prepared with authentic ingredients."}</p>

                                        <div className="mt-4 flex items-center gap-3">
                                            <span className="text-xl font-light" style={{ color: THEME.primary }}>₹{Math.floor(item.price)}<span className="text-sm text-gray-400">.00</span></span>
                                        </div>
                                    </div>

                                    {/* Interactive Add Button Column */}
                                    <div className="flex flex-col justify-end items-end">
                                        {cart[item.id] ? (
                                            <div className="flex flex-col items-center rounded-2xl p-1 gap-2 shadow-sm border border-gray-100" style={{ backgroundColor: '#F8F8F8' }}>
                                                <button
                                                    onClick={() => handleAddToCart(item.id)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-xl text-white hover:opacity-90 active:scale-90 transition-all"
                                                    style={{ backgroundColor: THEME.primary }}
                                                >
                                                    <Plus size={16} strokeWidth={3} />
                                                </button>
                                                <span className="font-bold text-sm py-1" style={{ color: THEME.text }}>{cart[item.id]}</span>
                                                <button
                                                    onClick={() => handleRemoveFromCart(item.id)}
                                                    className="w-8 h-8 flex items-center justify-center bg-white text-gray-500 rounded-xl hover:bg-gray-100 active:scale-90 transition-all shadow-sm"
                                                >
                                                    <Minus size={16} strokeWidth={3} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleAddToCart(item.id)}
                                                className="w-10 h-10 flex items-center justify-center border rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-sm group/btn"
                                                style={{
                                                    borderColor: THEME.border,
                                                    color: THEME.primary,
                                                    backgroundColor: THEME.surface
                                                }}
                                            >
                                                <Plus size={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Floating Glass Cart */}
            {cartItemCount > 0 && !isCartOpen && (
                <div className="absolute bottom-8 left-6 right-6 z-50 animate-bounce-in">
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="w-full h-16 relative overflow-hidden rounded-2xl shadow-xl flex items-center justify-between px-1 group active:scale-[0.98] transition-transform"
                        style={{
                            backgroundColor: THEME.primary,
                            color: 'white',
                            boxShadow: '0 10px 30px -10px rgba(139, 30, 63, 0.5)'
                        }}
                    >
                        {/* Sheen */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

                        <div className="flex items-center gap-4 pl-4 relative z-10">
                            <div className="bg-white/20 px-3 py-1.5 rounded-lg flex flex-col leading-none">
                                <span className="text-[10px] text-white/80 font-bold uppercase">Items</span>
                                <span className="text-lg font-bold text-white">{cartItemCount}</span>
                            </div>
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider">Total</span>
                                <span className="text-xl font-black text-white">₹{cartTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="pr-5 relative z-10 flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wide">
                            Checkout <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>
                </div>
            )}

            {/* Cart Modal (Sheet) */}
            {isCartOpen && (
                <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />

                    <div className="w-full bg-white rounded-t-[40px] max-h-[85vh] flex flex-col shadow-2xl animate-slide-up relative" style={{ backgroundColor: '#FFFBEA' }}>

                        {/* Handle */}
                        <div className="w-full flex justify-center pt-4 pb-2" onClick={() => setIsCartOpen(false)}>
                            <div className="w-16 h-1 bg-gray-300 rounded-full" />
                        </div>

                        <div className="px-8 py-4 flex items-center justify-between">
                            <h2 className="text-2xl font-light" style={{ color: THEME.text }}>Your <span className="font-bold" style={{ color: THEME.primary }}>Order</span></h2>
                            <button onClick={() => setIsCartOpen(false)} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:text-gray-900 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto px-8 py-2 space-y-6">
                            {Object.entries(cart).map(([id, qty]) => {
                                const item = allMenuItems.find(i => i.id === id);
                                return item ? (
                                    <div key={id} className="flex justify-between items-center group">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-1">
                                                <DotIndicator isVegetarian={item.isVegetarian} />
                                                <span className="font-medium text-lg" style={{ color: THEME.text }}>{item.name}</span>
                                            </div>
                                            <span className="font-bold text-sm" style={{ color: THEME.primary }}>₹{(item.price * qty).toFixed(2)}</span>
                                        </div>

                                        <div className="flex items-center bg-white rounded-xl border p-1" style={{ borderColor: THEME.border }}>
                                            <button onClick={() => handleRemoveFromCart(item.id)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Minus size={14} /></button>
                                            <span className="w-8 text-center text-sm font-bold" style={{ color: THEME.text }}>{qty}</span>
                                            <button onClick={() => handleAddToCart(item.id)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"><Plus size={14} /></button>
                                        </div>
                                    </div>
                                ) : null;
                            })}
                        </div>

                        {/* Checkout Area */}
                        <div className="p-8 pb-safe rounded-t-[40px] mt-2 border-t border-gray-100 bg-white">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-gray-400 font-medium">Grand Total</span>
                                <span className="text-3xl font-light" style={{ color: THEME.text }}>₹{cartTotal.toFixed(2)}</span>
                            </div>

                            {/* Payment Method Selection */}
                            <div className="mb-6">
                                <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: THEME.textMuted }}>Payment Method</span>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setPaymentMethod('online')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all font-semibold ${paymentMethod === 'online'
                                            ? 'border-[#8B1E3F] bg-[#8B1E3F]/5'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                        style={{ color: paymentMethod === 'online' ? THEME.primary : THEME.textMuted }}
                                    >
                                        <Wallet size={20} />
                                        <span>Online</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('cash')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all font-semibold ${paymentMethod === 'cash'
                                            ? 'border-[#8B1E3F] bg-[#8B1E3F]/5'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                        style={{ color: paymentMethod === 'cash' ? THEME.primary : THEME.textMuted }}
                                    >
                                        <Banknote size={20} />
                                        <span>Cash</span>
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={handlePlaceOrder}
                                disabled={placingOrder}
                                className="w-full text-white h-16 rounded-2xl font-bold text-lg uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                                style={{ backgroundColor: THEME.primary }}
                            >
                                {placingOrder ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Placing Order...
                                    </>
                                ) : (
                                    <>
                                        Confirm Order <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Success Toast */}
            {orderSuccess && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-sm animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="bg-green-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3">
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

            {/* Order Error Toast */}
            {orderError && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-sm animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="bg-red-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <AlertCircle size={18} className="text-white" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm">Order Failed</h4>
                            <p className="text-white/90 text-xs mt-0.5">{orderError}</p>
                        </div>
                        <button
                            onClick={() => setOrderError(null)}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Global CSS */}
            <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 32px); }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); filter: blur(10px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.19, 1, 0.22, 1) forwards; }

        @keyframes bounce-in {
            0% { transform: scale(0.9) translateY(20px); opacity: 0; }
            50% { transform: scale(1.05) translateY(-5px); opacity: 1; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-bounce-in { animation: bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
        </div>
    );
}

export default function TableOrderPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col justify-center items-center min-h-screen" style={{ backgroundColor: '#FFFBEA' }}>
                <Loader2 className="animate-spin w-8 h-8" style={{ color: '#8B1E3F' }} />
            </div>
        }>
            <OrderContent />
        </Suspense>
    );
}
