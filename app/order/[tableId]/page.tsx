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
    Banknote,
    ClipboardList,
    Clock,
    History
} from 'lucide-react';
import { getTableInfo, getPastOrders, SessionData, Category, MenuItem as ApiMenuItem, CustomerOrder } from '@/lib/api';
import { MenuItem } from '@/types';
import OrdersModal from '@/components/order/OrdersModal';
import MenuItemCard from '@/components/menu/MenuItemCard';
import ItemDetailModal from '@/components/menu/ItemDetailModal';
import FloatingCartButton from '@/components/cart/FloatingCartButton';

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

// --- Identity Form Component ---
const IdentityForm = ({ onComplete, theme }: { onComplete: (name: string, phone: string) => void, theme: any }) => {
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
        <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300"
            style={{ backgroundColor: theme.bg, color: theme.text }}>
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center space-y-2">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md"
                        style={{ backgroundColor: theme.surface, color: theme.primary }}>
                        <ChefHat size={40} />
                    </div>
                    <h1 className="text-3xl font-light tracking-tight">Welcome!</h1>
                    <p className="text-sm" style={{ color: theme.textMuted }}>Please enter your details to view the menu</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>Name</label>
                        <input
                            type="text"
                            required
                            placeholder="Your Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3.5 rounded-xl border focus:outline-none focus:ring-2 transition shadow-sm"
                            style={{
                                backgroundColor: theme.surface,
                                borderColor: theme.border,
                                color: theme.text,
                                outlineColor: theme.secondary
                            }}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>Phone Number</label>
                        <input
                            type="tel"
                            required
                            placeholder="10-digit Mobile Number"
                            value={phone}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                setPhone(val);
                            }}
                            className="w-full px-4 py-3.5 rounded-xl border focus:outline-none focus:ring-2 transition shadow-sm"
                            style={{
                                backgroundColor: theme.surface,
                                borderColor: theme.border,
                                color: theme.text,
                                outlineColor: theme.secondary
                            }}
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 p-3 rounded-lg text-sm text-red-600">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full text-white font-bold py-4 rounded-xl shadow-lg transition transform active:scale-[0.98] uppercase tracking-widest text-sm"
                        style={{ backgroundColor: theme.primary }}
                    >
                        Continue to Menu
                    </button>
                </form>

                <p className="text-center text-xs" style={{ color: theme.textMuted }}>
                    Your details are used only for order management.
                </p>
            </div>
        </div>
    );
};

// --- Main App Component ---

function OrderContent() {
    const params = useParams();
    const router = useRouter();
    const tableId = params.tableId as string;

    // Identity State
    const [identity, setIdentity] = useState<{ name: string; phone: string } | null>(null);
    const [showIdentityForm, setShowIdentityForm] = useState(true);

    // Backend state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [session, setSession] = useState<SessionData | null>(null);
    const [menu, setMenu] = useState<Category[]>([]);

    // Past Orders State
    const [pastOrders, setPastOrders] = useState<CustomerOrder[]>([]);
    const [deviceToken, setDeviceToken] = useState<string | null>(null);

    // UI state
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({ vegOnly: false, nonVeg: false });
    const [isOrdersOpen, setIsOrdersOpen] = useState(false);
    const [ordersModalTab, setOrdersModalTab] = useState<'current' | 'past'>('current');
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

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

    // Device Token & Past Orders Logic
    useEffect(() => {
        const initDeviceToken = async () => {
            let token = localStorage.getItem('dinestack_device_token');
            if (!token) {
                try {
                    token = crypto.randomUUID();
                } catch (e) {
                    token = Math.random().toString(36).substring(2) + Date.now().toString(36);
                }
                localStorage.setItem('dinestack_device_token', token);
            }
            setDeviceToken(token);

            if (token) {
                try {
                    const history = await getPastOrders(token);
                    setPastOrders(history);
                } catch (e) {
                    console.error("Failed to load past orders", e);
                }
            }
        };

        if (session) {
            initDeviceToken();
        }
    }, [session]);

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

    // Flatten menu items for filtering
    const allMenuItems = useMemo(() => {
        return menu.flatMap(cat => cat.items.map(item => ({
            ...item,
            category: cat.name
        } as MenuItem)));
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

    if (showIdentityForm) {
        return <IdentityForm onComplete={handleIdentitySubmit} theme={THEME} />;
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
                <div className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-2 flex justify-between items-end max-w-7xl mx-auto w-full">
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] mb-1" style={{ color: THEME.secondary }}>
                            {session?.restaurant.name || 'Fine Dining'}
                        </h2>
                        <h1 className="text-3xl font-light tracking-tight" style={{ color: THEME.text }}>
                            DineStack<span className="font-bold">Menu</span><span style={{ color: THEME.primary }}>.</span>
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-medium" style={{ color: THEME.textMuted }}>Hi, {identity?.name}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Orders Button */}
                        <button
                            onClick={() => setIsOrdersOpen(true)}
                            className="p-2.5 rounded-xl bg-white border shadow-sm active:scale-95 transition-all relative"
                            style={{ borderColor: THEME.border }}
                        >
                            <ClipboardList size={20} style={{ color: THEME.primary }} />
                        </button>

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
                <div className="overflow-x-auto no-scrollbar pt-4 sm:pt-6 pb-2 px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-3 sm:gap-4 min-w-max mx-auto max-w-7xl">
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
                <div className="px-4 sm:px-6 lg:px-8 mt-2 flex gap-3 overflow-x-auto no-scrollbar max-w-7xl mx-auto w-full">
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
            <main className="flex-1 overflow-y-auto scroll-smooth w-full overscroll-contain no-scrollbar relative z-10">
                <div className="px-4 sm:px-6 lg:px-8 py-6 pb-32 max-w-7xl mx-auto">

                    {filteredItems.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-center opacity-40">
                            <Utensils size={48} className="mb-4" style={{ color: THEME.textMuted }} />
                            <p className="font-light" style={{ color: THEME.textMuted }}>Our chefs are resting.<br />Try different filters.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {filteredItems.map((item, index) => (
                                <div key={item.id} className="animate-fade-in-up h-full" style={{ animationDelay: `${index * 50}ms` }}>
                                    <MenuItemCard
                                        item={item}
                                        onClick={() => setSelectedItem(item)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Past Orders Banner */}
                    {pastOrders.length > 0 && (
                        <div className="mx-6 mt-4 mb-2 p-4 rounded-xl shadow-sm border border-orange-100 flex items-center justify-between animate-fade-in"
                            style={{ backgroundColor: '#FFF8E1' }}>
                            <div className="flex flex-col">
                                <span className="font-bold text-orange-800 flex items-center gap-2">
                                    <span className="text-xl">👋</span> Welcome Back!
                                </span>
                                <span className="text-xs text-orange-600 mt-1">You have ordered here before.</span>
                            </div>
                            <button
                                onClick={() => {
                                    setOrdersModalTab('past');
                                    setIsOrdersOpen(true);
                                }}
                                className="px-4 py-2 bg-white text-orange-700 text-sm font-bold rounded-lg shadow-sm border border-orange-200 hover:bg-orange-50 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <History size={16} />
                                View History
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Floating Cart Button */}
            {!selectedItem && <FloatingCartButton />}

            {/* Orders Modal */}
            <OrdersModal
                isOpen={isOrdersOpen}
                onClose={() => setIsOrdersOpen(false)}
                restaurantId={session?.restaurant.id || ''}
                phone={identity?.phone || ''}
                deviceToken={deviceToken || undefined}
                initialTab={ordersModalTab}
                theme={THEME}
            />

            {/* Item Detail Modal for Customization */}
            {selectedItem && (
                <ItemDetailModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                />
            )}

            <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 32px); }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); filter: blur(10px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        
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
        </div >
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
