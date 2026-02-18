"use client";

import { useState } from 'react';
import {
    ArrowLeft,
    Trash2,
    Plus,
    Minus,
    Utensils,
    ChevronRight,
    CreditCard,
    TicketPercent,
    MessageSquarePlus,
    ShoppingBag
} from 'lucide-react';
import { useCart, CartItem } from '../../contexts/CartContext';
import CheckoutView from '../checkout/CheckoutView';

// --- Helper Components ---

const VegNonVegIcon = ({ isVegetarian }: { isVegetarian?: boolean }) => (
    <div className={`w-4 h-4 border flex items-center justify-center rounded-[4px] ${isVegetarian ? 'border-green-600' : 'border-red-600'}`}>
        <div className={`w-2 h-2 rounded-full ${isVegetarian ? 'bg-green-600' : 'bg-red-600'}`} />
    </div>
);

const EmptyState = ({ onBrowse }: { onBrowse: () => void }) => (
    <div className="flex flex-col items-center justify-center flex-1 text-center p-8 animate-fade-in bg-white rounded-[32px] mx-4 mt-4 shadow-sm">
        <div className="w-24 h-24 bg-[#8D0B41]/5 rounded-full flex items-center justify-center mb-6">
            <Utensils size={32} className="text-[#8D0B41]" />
        </div>
        <h2 className="text-xl font-bold text-[#111] mb-2">Good food is waiting</h2>
        <p className="text-stone-500 mb-8 text-sm">
            Your cart is empty. Add something delicious!
        </p>
        <button onClick={onBrowse} className="px-8 py-3 bg-[#8D0B41] text-white rounded-xl font-bold shadow-lg shadow-[#8D0B41]/20">
            Browse Menu
        </button>
    </div>
);

const BillRow = ({ label, value, isTotal = false, isDiscount = false }: { label: string, value: string, isTotal?: boolean, isDiscount?: boolean }) => (
    <div className={`flex justify-between items-center ${isTotal ? 'text-lg font-bold text-[#111] pt-3 border-t border-stone-200 mt-2' : 'text-sm text-stone-600 mb-2'}`}>
        <span>{label}</span>
        <span className={`${isDiscount ? 'text-green-600' : ''} ${isTotal ? 'text-[#8D0B41]' : ''}`}>
            {value}
        </span>
    </div>
);

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

export default function CartDrawer() {
    const { isCartOpen, closeCart, cartItems, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
    const [view, setView] = useState<'cart' | 'checkout' | 'success'>('cart');
    const [lastOrderId, setLastOrderId] = useState<string | null>(null);
    const [instructions, setInstructions] = useState("");

    const [isClosing, setIsClosing] = useState(false);
    const [showClearCartConfirm, setShowClearCartConfirm] = useState(false);

    // Calculate billing details for display (Frontend only simulation as per user design)
    const subtotal = cartTotal;
    const gst = subtotal * 0.05;
    const platformFee = 10;
    const total = subtotal + gst + platformFee;

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            closeCart();
            setIsClosing(false);
            setView('cart'); // Reset view after closing animation
            setLastOrderId(null);
            setShowClearCartConfirm(false);
        }, 300);
    };

    const handleCheckoutSuccess = (orderId: string) => {
        setLastOrderId(orderId);
        setView('success');
    };

    const handleClearCart = () => {
        clearCart();
        setShowClearCartConfirm(false);
    };

    if (!isCartOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
                onClick={handleClose}
            />

            {/* Content Container - Acts as the Drawer */}
            <div className={`relative w-full max-w-md h-full bg-[#F4F1EE] shadow-2xl transform transition-transform duration-300 pointer-events-auto ${isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'} flex flex-col font-sans`}>

                {/* --- 1. NEW BIG HEADER (The "Unique" Design) --- */}
                {/* Only Show Header in Cart View */}
                {view === 'cart' && (
                    <div className="bg-gradient-to-br from-[#5A0528] to-[#2b0213] pt-8 sm:pt-10 pb-12 sm:pb-16 px-4 sm:px-6 relative overflow-hidden shrink-0">
                        {/* Background Decorative Gradient */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#a00d4a] rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                        {/* Nav Bar */}
                        <div className="flex justify-between items-center mb-6 sm:mb-8 relative z-10">
                            <button
                                onClick={handleClose}
                                className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 active:scale-95 transition-all"
                            >
                                <ArrowLeft size={20} />
                            </button>

                            {cartItems.length > 0 && (
                                <button
                                    onClick={() => setShowClearCartConfirm(true)}
                                    className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/10 hover:bg-white/20 transition-all flex items-center gap-1"
                                >
                                    <Trash2 size={12} /> Clear Cart
                                </button>
                            )}
                        </div>

                        {/* Big Title & Info */}
                        <div className="relative z-10">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">My Cart</h1>
                            <div className="flex items-center gap-3">
                                <div className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/5 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                    {/* Mock Table Info for now, or get from context if available globally */}
                                    <span className="text-white/90 text-xs font-bold tracking-wide">Table Order</span>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/5">
                                    <span className="text-white/90 text-xs font-bold tracking-wide">Dine-in</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* --- 2. Main Content Area --- */}
                <div className={`flex-1 ${view === 'cart' ? '-mt-6 sm:-mt-8 relative z-20 rounded-t-[24px] sm:rounded-t-[32px] bg-[#F4F1EE]' : 'bg-white'} overflow-y-auto scroll-smooth shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.2)] scrollbar-hide`}>

                    {view === 'cart' ? (
                        cartItems.length === 0 ? (
                            <div className="h-full flex flex-col pt-10">
                                <EmptyState onBrowse={handleClose} />
                            </div>
                        ) : (
                            <div className="pb-32">
                                {/* Handle Bar Visual Indicator */}
                                <div className="flex justify-center pt-3 pb-1">
                                    <div className="w-12 h-1 bg-stone-300 rounded-full opacity-50"></div>
                                </div>

                                {/* Items Summary Header */}
                                <div className="px-4 sm:px-6 mt-4 mb-3 flex items-center justify-between">
                                    <h2 className="text-sm font-bold text-stone-600 uppercase tracking-wide">Order Details</h2>
                                    <span className="text-xs font-bold text-[#8D0B41] bg-[#8D0B41]/10 px-2 py-0.5 rounded-md">
                                        {cartItems.reduce((acc, item) => acc + item.quantity, 0)} items
                                    </span>
                                </div>

                                {/* Cart List */}
                                <div className="mx-3 sm:mx-4 bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                                    {cartItems.map(item => (
                                        <div key={item.id} className="bg-white p-4 border-b border-dashed border-stone-200 last:border-0 first:rounded-t-xl last:rounded-b-xl">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1"><VegNonVegIcon isVegetarian={item.isVegetarian} /></div>
                                                    <div>
                                                        <h3 className="font-bold text-[#111] text-base leading-snug line-clamp-2">{item.name}</h3>
                                                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                                            <p className="text-xs text-stone-500 mt-1 font-medium line-clamp-1">
                                                                {Object.values(item.selectedOptions).flat().map(o => o.name).join(', ')}
                                                            </p>
                                                        )}
                                                        <div className="text-[#8D0B41] font-bold text-sm mt-1.5">
                                                            {formatCurrency(item.finalPrice)}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Quantity Stepper (Compact) */}
                                                <div className="flex flex-col items-center gap-1 bg-white rounded-full shadow-sm p-1 border border-gray-100 shrink-0 ml-2">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, 1)}
                                                        className="w-8 h-8 flex items-center justify-center bg-[#8D0B41] text-white rounded-full shadow-sm active:scale-90 transition-transform"
                                                    >
                                                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                                                    </button>
                                                    <span className="text-sm font-bold text-gray-900 w-8 text-center py-0.5">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => item.quantity > 1 ? updateQuantity(item.id, -1) : removeFromCart(item.id)}
                                                        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 text-gray-600 rounded-full shadow-sm hover:bg-gray-50 active:scale-90 transition-transform"
                                                    >
                                                        {item.quantity === 1 ? <Trash2 className="w-4 h-4 text-red-500" /> : <Minus className="w-4 h-4" strokeWidth={2.5} />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Total Line */}
                                            <div className="flex justify-end border-t border-stone-50 pt-2 mt-2">
                                                <span className="text-[10px] font-bold text-stone-400 mr-2 uppercase tracking-wide">Item Total</span>
                                                <span className="text-sm font-bold text-[#111]">{formatCurrency(item.finalPrice * item.quantity)}</span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Cooking Instructions */}
                                    <div className="p-4 bg-stone-50 border-t border-stone-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MessageSquarePlus size={14} className="text-stone-400" />
                                            <label className="text-xs font-bold text-stone-500">Add Cooking Request</label>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="e.g., Less spicy, allergy info..."
                                            className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#8D0B41] focus:ring-1 focus:ring-[#8D0B41] transition-all placeholder-stone-400"
                                            value={instructions}
                                            onChange={(e) => setInstructions(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Offers / Coupon Section */}
                                <div className="mx-3 sm:mx-4 mt-4 bg-white p-4 rounded-2xl shadow-sm border border-dashed border-stone-300 flex items-center gap-4 cursor-pointer hover:bg-stone-50 transition-colors group">
                                    <div className="w-10 h-10 bg-[#8D0B41]/5 rounded-full flex items-center justify-center group-hover:bg-[#8D0B41]/10 transition-colors">
                                        <TicketPercent size={20} className="text-[#8D0B41]" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm text-[#111]">Apply Coupon</h4>
                                        <p className="text-xs text-stone-500">Save more on your order</p>
                                    </div>
                                    <ChevronRight size={16} className="text-stone-400" />
                                </div>

                                {/* Bill Details */}
                                <div className="mx-3 sm:mx-4 mt-6 mb-4">
                                    <h2 className="text-sm font-bold text-stone-600 uppercase tracking-wide mb-3 px-1">Payment Summary</h2>
                                    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 relative overflow-hidden">
                                        <BillRow label="Item Total" value={formatCurrency(subtotal)} />
                                        <BillRow label="Platform Fee" value={formatCurrency(platformFee)} />
                                        <BillRow label="GST (5%)" value={formatCurrency(gst)} />

                                        <div className="my-3 border-t border-dashed border-stone-200"></div>

                                        <BillRow label="Grand Total" value={formatCurrency(total)} isTotal />
                                    </div>
                                </div>

                                {/* Disclaimer */}
                                <div className="mx-8 mb-8 text-center opacity-60">
                                    <p className="text-[10px] text-stone-500 font-medium leading-relaxed">
                                        Cancellation policy: Orders cannot be cancelled once food preparation has started.
                                    </p>
                                </div>
                            </div>
                        )
                    ) : view === 'checkout' ? (
                        <CheckoutView onBack={() => setView('cart')} onSuccess={handleCheckoutSuccess} />
                    ) : (
                        // Success View
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in bg-white">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-scale-in">
                                <ShoppingBag className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-3xl font-serif-custom font-bold text-[#5A0528] mb-2">Order Placed!</h2>
                            <p className="text-gray-600 mb-8">Your order #{lastOrderId} has been sent to the kitchen.</p>
                            <button
                                onClick={handleClose}
                                className="w-full bg-[#8D0B41] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-[#B01E58] transition-all"
                            >
                                Back to Menu
                            </button>
                        </div>
                    )}
                </div>

                {/* --- 4. Sticky Checkout Footer --- */}
                {view === 'cart' && cartItems.length > 0 && (
                    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
                        <div className="w-full max-w-md bg-white border-t border-stone-100 p-3 sm:p-4 pb-safe shadow-[0_-5px_30px_rgba(0,0,0,0.08)] pointer-events-auto rounded-t-[24px]">

                            <div className="flex justify-between items-center mb-4 px-1">
                                <div className="flex items-center gap-2">
                                    <div className="bg-green-50 text-green-700 p-1.5 rounded-md border border-green-100">
                                        <CreditCard size={14} />
                                    </div>
                                    <span className="text-xs font-bold text-stone-600">Pay via UPI/Cash</span>
                                </div>
                                <button className="text-xs font-bold text-[#8D0B41] hover:underline">Change</button>
                            </div>

                            <button
                                onClick={() => setView('checkout')}
                                className="w-full h-12 sm:h-14 bg-gradient-to-r from-[#8D0B41] to-[#6b0831] rounded-2xl shadow-lg shadow-[#8D0B41]/30 flex items-center justify-between px-5 active:scale-[0.98] transition-all group"
                            >
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] text-white/80 uppercase font-bold tracking-wider mb-0.5">Total to Pay</span>
                                    {/* Using visual total (including mock tax/fee) for consistency with design, though backend will recalculate */}
                                    <span className="text-white font-extrabold text-lg leading-none">{formatCurrency(total)}</span>
                                </div>
                                <div className="flex items-center gap-2 pl-4 border-l border-white/10 h-8">
                                    <span className="text-white font-bold text-sm">
                                        Place Order
                                    </span>
                                    <ChevronRight size={18} className="text-white group-hover:translate-x-1 transition-transform" />
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* --- Clear Cart Confirmation Modal --- */}
                {showClearCartConfirm && (
                    <div className="absolute inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] animate-fade-in" onClick={() => setShowClearCartConfirm(false)}></div>
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs mx-4 p-6 relative z-10 animate-scale-in">
                            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                                <Trash2 className="text-[#8D0B41] w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-center text-[#111] mb-2">Clear Cart?</h3>
                            <p className="text-center text-stone-500 text-sm mb-6">
                                Are you sure you want to remove all items from your cart? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowClearCartConfirm(false)}
                                    className="flex-1 py-2.5 rounded-xl font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleClearCart}
                                    className="flex-1 py-2.5 rounded-xl font-bold text-white bg-[#8D0B41] hover:bg-[#8D0B41]/90 shadow-lg shadow-[#8D0B41]/20 transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right { animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes slide-out-right {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
        .animate-slide-out-right { animation: slide-out-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @keyframes scale-in {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in { animation: scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }

        @keyframes fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        .animate-fade-out { animation: fade-out 0.3s ease-out forwards; }
      `}</style>
        </div>
    );

}
