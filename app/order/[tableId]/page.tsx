"use client";

import React, { useEffect, useState, useMemo, Suspense, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Minus, Plus, AlertCircle, CheckCircle2, Loader2, Utensils, ArrowRight } from 'lucide-react';
import { getTableInfo, placeOrder, SessionData, Category, MenuItem } from '@/lib/api';
import Image from 'next/image';

interface CartItem extends MenuItem {
    quantity: number;
}

function OrderContent() {
    const params = useParams();
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

    const cartTotal = useMemo(() => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }, [cart]);

    const cartItemCount = useMemo(() => {
        return cart.reduce((count, item) => count + item.quantity, 0);
    }, [cart]);

    // Load data on mount
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

    // Scroll spy for category navigation
    useEffect(() => {
        const handleScroll = () => {
            let current = "";
            const offset = 180; // Header height offset

            for (const cat of menu) {
                const element = categoryRefs.current[cat.id];
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top <= offset + 50 && rect.bottom > offset) {
                        current = cat.id;
                        break;
                    }
                }
            }
            if (current && current !== activeCategory) {
                setActiveCategory(current);
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
    };

    const scrollToCategory = (categoryId: string) => {
        setActiveCategory(categoryId);
        const element = categoryRefs.current[categoryId];
        if (element) {
            const headerOffset = 175;
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

    // Image Placeholder Component
    const ImagePlaceholder = () => (
        <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--ds-cream-dark)' }}>
            <Utensils size={22} strokeWidth={1.5} style={{ color: 'var(--ds-text-light)' }} />
        </div>
    );

    // =========================================
    // LOADING STATE
    // =========================================
    if (loading) {
        return (
            <div className="ds-loading">
                <div className="ds-loading-spinner" />
                <p className="ds-loading-text">Loading Menu...</p>
            </div>
        );
    }

    // =========================================
    // ERROR STATE
    // =========================================
    if (error) {
        return (
            <div className="ds-error">
                <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: 'rgba(196, 59, 59, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px'
                }}>
                    <AlertCircle size={32} style={{ color: 'var(--ds-danger)' }} />
                </div>
                <h3 style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--ds-text-primary)',
                    marginBottom: '8px'
                }}>
                    Unable to Load Menu
                </h3>
                <p style={{
                    fontSize: '0.9375rem',
                    color: 'var(--ds-text-secondary)',
                    maxWidth: '280px',
                    marginBottom: '24px'
                }}>
                    {error}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        background: 'linear-gradient(135deg, var(--ds-maroon) 0%, var(--ds-maroon-dark) 100%)',
                        color: 'white',
                        fontWeight: 600,
                        padding: '14px 32px',
                        borderRadius: '12px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.9375rem',
                        boxShadow: '0 4px 16px var(--ds-shadow)'
                    }}
                >
                    Try Again
                </button>
            </div>
        );
    }

    // =========================================
    // MAIN APP UI
    // =========================================
    return (
        <div className="app-container">

            {/* ============================================
                FIXED HEADER - Deep Maroon/Wine Background
                ============================================ */}
            <header className="ds-header">
                <div className="ds-header-content">

                    {/* Top Row: Brand + Table Badge */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 20px',
                        marginBottom: '16px'
                    }}>
                        {/* Left: DineStack Brand Logo */}
                        <div>
                            <h1 className="ds-brand">
                                Dine<span className="ds-brand-accent">Stack</span>
                            </h1>
                        </div>

                        {/* Right: Table Pill Badge */}
                        <div className="ds-table-pill">
                            <span className="ds-table-pill-dot" />
                            <span className="ds-table-pill-text">
                                Table {session?.table.number || '1'}
                            </span>
                        </div>
                    </div>

                    {/* Menu Title Row */}
                    <div style={{
                        padding: '0 20px',
                        marginBottom: '14px'
                    }}>
                        <h2 className="ds-menu-title">Menu</h2>
                    </div>

                    {/* Category Pills Navigation - Scrollable */}
                    <nav className="ds-category-nav scrollbar-hide">
                        <div
                            ref={navRef}
                            className="ds-category-nav-inner"
                        >
                            {menu.map((category) => {
                                const isActive = activeCategory === category.id;
                                return (
                                    <button
                                        key={category.id}
                                        data-category={category.id}
                                        onClick={() => scrollToCategory(category.id)}
                                        className={`ds-category-pill ${isActive ? 'ds-category-pill--active' : 'ds-category-pill--inactive'}`}
                                    >
                                        {category.name}
                                    </button>
                                );
                            })}
                        </div>
                    </nav>
                </div>
            </header>

            {/* ============================================
                SCROLLABLE CONTENT AREA - Light Cream Background
                ============================================ */}
            <main className="ds-content">
                <div className="ds-content-inner">

                    {/* Restaurant Name Banner */}
                    <div style={{
                        marginBottom: '24px',
                        paddingBottom: '20px',
                        borderBottom: '1px solid var(--ds-border)'
                    }}>
                        <h3 style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '1.125rem',
                            fontWeight: 700,
                            color: 'var(--ds-text-primary)',
                            marginBottom: '4px'
                        }}>
                            {session?.restaurant.name || 'Restaurant'}
                        </h3>
                        <p style={{
                            fontSize: '0.8125rem',
                            color: 'var(--ds-text-secondary)'
                        }}>
                            Welcome! Browse our menu and tap + to add items.
                        </p>
                    </div>

                    {/* Menu Categories & Items */}
                    {menu.map((category) => (
                        <section
                            key={category.id}
                            ref={(el) => { categoryRefs.current[category.id] = el }}
                            className="ds-category-section"
                            style={{ scrollMarginTop: '180px' }}
                        >
                            <h2 className="ds-category-title">{category.name}</h2>

                            {category.items.map((item) => {
                                const qty = getItemQuantity(item.id);
                                return (
                                    <div key={item.id} className="ds-menu-card">
                                        <div style={{ display: 'flex', gap: '14px' }}>

                                            {/* Item Image */}
                                            <div className="ds-item-image">
                                                {item.image ? (
                                                    <Image
                                                        src={item.image}
                                                        alt={item.name}
                                                        fill
                                                        sizes="88px"
                                                        style={{ objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <ImagePlaceholder />
                                                )}
                                                {!item.isAvailable && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        inset: 0,
                                                        background: 'rgba(255,255,255,0.85)',
                                                        backdropFilter: 'blur(2px)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <span style={{
                                                            fontSize: '0.625rem',
                                                            fontWeight: 700,
                                                            color: 'var(--ds-text-secondary)',
                                                            background: 'var(--ds-cream-dark)',
                                                            padding: '4px 8px',
                                                            borderRadius: '4px'
                                                        }}>
                                                            SOLD OUT
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Item Details */}
                                            <div style={{
                                                flex: 1,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                minWidth: 0
                                            }}>
                                                <div>
                                                    <h3 className="ds-item-name" style={{
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden'
                                                    }}>
                                                        {item.name}
                                                    </h3>
                                                    <p className="ds-item-desc" style={{
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden'
                                                    }}>
                                                        {item.description || "Freshly prepared with authentic ingredients."}
                                                    </p>
                                                </div>

                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    marginTop: '10px'
                                                }}>
                                                    <span className="ds-item-price">₹{item.price}</span>

                                                    {/* Add/Quantity Controls */}
                                                    {qty === 0 ? (
                                                        <button
                                                            onClick={() => addToCart(item)}
                                                            disabled={!item.isAvailable}
                                                            className="ds-add-btn"
                                                            style={{
                                                                opacity: item.isAvailable ? 1 : 0.4,
                                                                cursor: item.isAvailable ? 'pointer' : 'not-allowed'
                                                            }}
                                                        >
                                                            <Plus size={18} strokeWidth={2.5} />
                                                        </button>
                                                    ) : (
                                                        <div className="ds-qty-control">
                                                            <button
                                                                onClick={() => removeFromCart(item.id)}
                                                                className="ds-qty-btn"
                                                            >
                                                                <Minus size={16} strokeWidth={2.5} />
                                                            </button>
                                                            <span className="ds-qty-value">{qty}</span>
                                                            <button
                                                                onClick={() => addToCart(item)}
                                                                className="ds-qty-btn"
                                                            >
                                                                <Plus size={16} strokeWidth={2.5} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </section>
                    ))}

                    {/* End of Menu Footer */}
                    {menu.length > 0 && (
                        <div style={{
                            textAlign: 'center',
                            padding: '32px 0'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '1px',
                                background: 'var(--ds-border)',
                                margin: '0 auto 12px'
                            }} />
                            <p style={{
                                fontSize: '0.75rem',
                                color: 'var(--ds-text-light)',
                                fontWeight: 500,
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase'
                            }}>
                                End of Menu
                            </p>
                            <p style={{
                                fontSize: '0.6875rem',
                                color: 'var(--ds-text-light)',
                                marginTop: '6px',
                                opacity: 0.7
                            }}>
                                Powered by DineStack
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* ============================================
                STICKY CART BAR - Bottom of Screen
                ============================================ */}
            {cartItemCount > 0 && (
                <div className="ds-cart-bar animate-slide-up">
                    <button
                        onClick={handlePlaceOrder}
                        disabled={placingOrder}
                        className="ds-cart-btn"
                    >
                        {/* Left: Item count & Total */}
                        <div className="ds-cart-info">
                            <span className="ds-cart-count">
                                {cartItemCount} {cartItemCount === 1 ? 'Item' : 'Items'}
                            </span>
                            <span className="ds-cart-total">
                                ₹{cartTotal.toFixed(0)}
                            </span>
                        </div>

                        {/* Right: Action */}
                        <div className="ds-cart-action">
                            <span className="ds-cart-action-text">
                                {placingOrder ? 'Placing Order...' : 'Place Order'}
                            </span>
                            {!placingOrder && <ArrowRight size={18} strokeWidth={2.5} color="white" />}
                            {placingOrder && <Loader2 size={18} className="animate-spin" color="white" />}
                        </div>
                    </button>
                </div>
            )}

            {/* ============================================
                SUCCESS TOAST
                ============================================ */}
            {orderSuccess && (
                <div style={{
                    position: 'fixed',
                    top: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 200,
                    width: '90%',
                    maxWidth: '360px'
                }}
                    className="animate-slide-down"
                >
                    <div className="ds-toast-success">
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <CheckCircle2 size={20} color="white" />
                        </div>
                        <div>
                            <h4 style={{
                                fontWeight: 700,
                                fontSize: '0.9375rem',
                                color: 'white',
                                marginBottom: '2px'
                            }}>
                                Order Placed!
                            </h4>
                            <p style={{
                                fontSize: '0.8125rem',
                                color: 'rgba(255,255,255,0.9)'
                            }}>
                                Order #{orderSuccess} sent to kitchen.
                            </p>
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
            <div className="ds-loading">
                <div className="ds-loading-spinner" />
                <p className="ds-loading-text">Loading...</p>
            </div>
        }>
            <OrderContent />
        </Suspense>
    );
}
