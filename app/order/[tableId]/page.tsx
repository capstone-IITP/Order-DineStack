"use client";

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useParams } from 'next/navigation';
import {
    Utensils,
    Coffee,
    IceCream,
    Soup,
    Flame,
    Sparkles,
    ChefHat,
    Loader2,
    AlertCircle,
    CheckCircle2,
    X
} from 'lucide-react';
import { getTableInfo, placeOrder, SessionData, Category } from '@/lib/api';

// Components
import Header from '@/components/order/Header';
import MenuCard from '@/components/order/MenuCard';
import CartButton from '@/components/order/CartButton';
import CartSheet from '@/components/order/CartSheet';

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
    accent: '#D4A373',     // Sand/Bronze
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

// --- Main App Component ---

function OrderContent() {
    const params = useParams();
    const tableId = params.tableId as string;

    // Backend state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [session, setSession] = useState<SessionData | null>(null);
    const [menu, setMenu] = useState<Category[]>([]);

    // Order state
    const [placingOrder, setPlacingOrder] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
    const [orderError, setOrderError] = useState<string | null>(null);

    // UI state
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [cart, setCart] = useState<{ [key: string]: number }>({});
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [filters, setFilters] = useState({ vegOnly: false, nonVeg: false });

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

    const handleDecreaseFromCart = (id: string) => {
        if (cart[id]) handleRemoveFromCart(id);
    };

    // Flatten menu items for filtering
    const allMenuItems = useMemo(() => {
        return menu.flatMap(cat => cat.items.map(item => ({
            ...item,
            category: cat.name
        })));
    }, [menu]);

    // Get unique categories from menu data
    const categories = useMemo(() => {
        const cats = [{ id: "All", name: "All", icon: CATEGORY_ICONS["All"] || Sparkles }];
        menu.forEach(cat => {
            cats.push({
                id: cat.name,
                name: cat.name,
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

    // Prepare cart items for Sheet
    const cartItemsFull = useMemo(() => {
        return Object.entries(cart).map(([id, qty]) => {
            const item = allMenuItems.find(i => i.id === id);
            if (!item) return null;
            return {
                menuItemId: id,
                quantity: qty,
                name: item.name,
                price: item.price,
                notes: ''
            };
        }).filter(Boolean) as any[];
    }, [cart, allMenuItems]);

    // --- Order Placement ---
    const handlePlaceOrder = async (notes?: string) => {
        if (cartItemCount === 0) return;

        setPlacingOrder(true);
        // setIsCartOpen(false); // Keep open or close? Better to keep open until success or close immediately.
        // Let's close it once success happens, but UI handles loading state inside sheet.

        setOrderError(null);

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
            setIsCartOpen(false); // Close cart on success
            setOrderSuccess(result.orderNumber ? `Order #${result.orderNumber}` : 'Order Placed');

            setTimeout(() => {
                setOrderSuccess(null);
            }, 5000);

        } catch (err: any) {
            console.error('Order placement error:', err);
            const errorMessage = err?.response?.data?.error
                || err?.message
                || 'Failed to place order. Please try again.';
            setOrderError(errorMessage);

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

    return (
        <div className="min-h-screen flex flex-col font-sans select-none relative"
            style={{ backgroundColor: THEME.bg, color: THEME.text }}>

            {/* Background Ambience (Fixed) */}
            <div className="fixed top-[-20%] left-[-20%] w-[60%] h-[50%] bg-white/40 blur-[120px] rounded-full pointer-events-none z-0" />
            <div className="fixed bottom-[-20%] right-[-20%] w-[60%] h-[50%] bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none z-0" />

            {/* Header Component */}
            <Header
                restaurantName={session?.restaurant.name || 'Fine Dining'}
                tableNumber={session?.table.number || '00'}
                categories={categories}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                cartItemCount={cartItemCount}
                onOpenCart={() => setIsCartOpen(true)}
                theme={THEME}
            />

            {/* Main Content */}
            <main className="flex-1 px-6 pt-6 pb-32 w-full z-10 animate-fade-in-up">

                {/* Filters Row */}
                <div className="flex gap-3 overflow-x-auto no-scrollbar mb-6">
                    <button
                        onClick={() => setFilters(p => ({ vegOnly: !p.vegOnly, nonVeg: false }))}
                        className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${filters.vegOnly ? 'bg-green-50 border-green-600 text-green-700' : 'bg-transparent border-stone-300 text-stone-500'}`}
                    >
                        Veg Only
                    </button>
                    <button
                        onClick={() => setFilters(p => ({ nonVeg: !p.nonVeg, vegOnly: false }))}
                        className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${filters.nonVeg ? 'bg-red-50 border-red-600 text-red-700' : 'bg-transparent border-stone-300 text-stone-500'}`}
                    >
                        Non-Veg Only
                    </button>
                </div>

                {/* Menu Grid */}
                {filteredItems.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center opacity-40">
                        <Utensils size={48} className="mb-4" style={{ color: THEME.textMuted }} />
                        <p className="font-light" style={{ color: THEME.textMuted }}>Our chefs are resting.<br />Try different filters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {filteredItems.map((item, index) => (
                            <MenuCard
                                key={item.id}
                                item={item}
                                quantity={cart[item.id] || 0}
                                onAdd={() => handleAddToCart(item.id)}
                                onIncrease={() => handleAddToCart(item.id)}
                                onDecrease={() => handleDecreaseFromCart(item.id)}
                                theme={THEME}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Floating Cart Button */}
            <CartButton
                count={cartItemCount}
                total={cartTotal}
                onClick={() => setIsCartOpen(true)}
                theme={THEME}
            />

            {/* Cart Sheet Modal */}
            <CartSheet
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cartItems={cartItemsFull}
                totalAmount={cartTotal}
                onIncrease={handleAddToCart}
                onDecrease={handleDecreaseFromCart}
                onPlaceOrder={handlePlaceOrder}
                isPlacingOrder={placingOrder}
                theme={THEME}
            />

            {/* Order Success Toast */}
            {orderSuccess && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-sm animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="bg-green-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={18} className="text-white" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm">Order Sent Successfully!</h4>
                            <p className="text-white/90 text-xs mt-0.5">{orderSuccess} has been placed.</p>
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
                
                @keyframes scale-in {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-scale-in { animation: scale-in 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
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
