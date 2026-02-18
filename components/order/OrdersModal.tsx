
import React, { useEffect, useState } from 'react';
import { X, Clock, ShoppingBag, ChevronRight, CheckCircle2, AlertCircle, Utensils, FileText } from 'lucide-react';
import { getCustomerOrders, getPastOrders, CustomerOrder } from '@/lib/api';

interface OrdersModalProps {
    isOpen: boolean;
    onClose: () => void;
    restaurantId: string;
    phone?: string;
    deviceToken?: string;
    initialTab?: 'current' | 'past';
    theme: any;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    'RECEIVED': { label: 'Received', color: '#B45309', bg: '#FFFBEB' },
    'PENDING': { label: 'Pending', color: '#B45309', bg: '#FFFBEB' },
    'PREPARING': { label: 'Preparing', color: '#15803D', bg: '#F0FDF4' },
    'READY': { label: 'Ready', color: '#15803D', bg: '#F0FDF4' },
    'SERVED': { label: 'Served', color: '#1D4ED8', bg: '#EFF6FF' },
    'COMPLETED': { label: 'Completed', color: '#374151', bg: '#F3F4F6' },
    'CANCELLED': { label: 'Cancelled', color: '#991B1B', bg: '#FEF2F2' },
};

export default function OrdersModal({ isOpen, onClose, restaurantId, phone, deviceToken, initialTab = 'current', theme }: OrdersModalProps) {
    const [activeTab, setActiveTab] = useState<'current' | 'past'>('current');

    // Reset tab when modal opens
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);
    const [orders, setOrders] = useState<CustomerOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = async () => {
        if (!restaurantId) return;
        // Proceed even if phone is missing, as we might rely on deviceToken
        if (!deviceToken && !phone) return;

        setLoading(true);
        setError(null);

        try {
            const promises = [];
            // Only fetch by phone if it exists and looks valid, keeping consistent type
            if (phone && phone.length >= 10) promises.push(
                getCustomerOrders(restaurantId, phone).catch(() => [] as CustomerOrder[])
            );
            if (deviceToken) promises.push(
                getPastOrders(deviceToken).catch(() => [] as CustomerOrder[])
            );

            const results = await Promise.all(promises);
            // Merge and deduplicate by ID
            const allOrders = results.flat();
            const uniqueOrders = Array.from(new Map(allOrders.map(o => [o.id, o])).values());

            setOrders(uniqueOrders);
        } catch (err: any) {
            console.error("Failed to load orders", err);
            // Don't show error if we just failed to fetch one source but have data
            if (orders.length === 0) {
                const msg = err.response?.data?.error || err.message || "Failed to load your orders.";
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (isOpen) {
            // Initial fetch
            fetchOrders();

            // Real-time polling (every 10 seconds)
            intervalId = setInterval(async () => {
                if (!restaurantId) return;

                try {
                    const promises = [];
                    if (phone && phone.length >= 10) promises.push(
                        getCustomerOrders(restaurantId, phone).catch(() => [])
                    );
                    if (deviceToken) promises.push(
                        getPastOrders(deviceToken).catch(() => [])
                    );

                    const results = await Promise.all(promises);
                    const allOrders = results.flat();
                    const uniqueOrders = Array.from(new Map(allOrders.map(o => [o.id, o])).values());
                    setOrders(uniqueOrders);
                } catch (err) {
                    console.warn("Background poll failed", err);
                }
            }, 10000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isOpen, restaurantId, phone, deviceToken]);

    if (!isOpen) return null;

    // Filter orders based on tab
    const filteredOrders = orders.filter(order => {
        // Fix: SERVED is considered a Past Order. PENDING/PREPARING are Current.
        const isPast = ['SERVED', 'COMPLETED', 'CANCELLED'].includes(order.status);
        return activeTab === 'past' ? isPast : !isPast;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="absolute inset-0" onClick={onClose} />

            <div
                className="w-full sm:max-w-md mx-auto bg-white rounded-t-[32px] sm:rounded-[32px] sm:my-8 max-h-[90vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden"
                style={{ backgroundColor: theme.bg }}
            >
                {/* Header */}
                <div className="relative px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-10">
                    <h2 className="text-xl font-bold" style={{ color: theme.text }}>My Orders</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 py-4 flex gap-2">
                    <button
                        onClick={() => setActiveTab('current')}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'current' ? 'shadow-md' : 'hover:bg-black/5'}`}
                        style={{
                            backgroundColor: activeTab === 'current' ? theme.primary : 'transparent',
                            color: activeTab === 'current' ? 'white' : theme.textMuted
                        }}
                    >
                        Current Orders
                    </button>
                    <button
                        onClick={() => setActiveTab('past')}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'past' ? 'shadow-md' : 'hover:bg-black/5'}`}
                        style={{
                            backgroundColor: activeTab === 'past' ? theme.primary : 'transparent',
                            color: activeTab === 'past' ? 'white' : theme.textMuted
                        }}
                    >
                        Past Orders
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 space-y-3">
                            <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: theme.primary, borderTopColor: 'transparent' }} />
                            <p className="text-sm font-medium opacity-60">Fetching your orders...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
                                <AlertCircle size={24} />
                            </div>
                            <h3 className="text-lg font-medium mb-1 text-red-600">Unable to load orders</h3>
                            <p className="text-sm text-gray-500 mb-4">{error}</p>
                            <button
                                onClick={fetchOrders}
                                className="px-6 py-2 rounded-lg text-white font-bold text-sm shadow-md transition-transform active:scale-95"
                                style={{ backgroundColor: theme.primary }}
                            >
                                Try Again
                            </button>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center opacity-60">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <FileText size={24} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium mb-1">No {activeTab} orders</h3>
                            <p className="text-sm text-gray-500 mb-4">You don't have any {activeTab} orders at the moment.</p>
                            <button
                                onClick={fetchOrders}
                                className="text-xs font-bold px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                                Refresh List
                            </button>
                        </div>
                    ) : (
                        filteredOrders.map(order => {
                            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG['PENDING'];
                            const orderDate = new Date(order.createdAt);
                            const formattedDate = orderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                            const formattedTime = orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

                            // Safe total amount calculation
                            const totalAmount = typeof order.totalAmount === 'number' && !isNaN(order.totalAmount)
                                ? order.totalAmount
                                : 0;

                            return (
                                <div
                                    key={order.id}
                                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-fade-in-up"
                                >
                                    {/* Top Row: Date, Status, Amount */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide" style={{ backgroundColor: status.bg, color: status.color }}>
                                                    {status.label}
                                                </span>
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    {formattedDate} • {formattedTime}
                                                </span>
                                            </div>
                                            {/* Order ID Fallback: #1234 from UUID if orderNumber missing */}
                                            <h4 className="font-bold text-sm text-gray-800">
                                                Order #{order.orderNumber || order.id.slice(0, 5).toUpperCase()}
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-50 my-3"></div>

                                    {/* Items List */}
                                    <div className="space-y-2 mb-3">
                                        {/* Defensive check for items array */}
                                        {Array.isArray(order.items) && order.items.map(item => {
                                            const itemName = item.menuItem?.name || item.name || 'Unknown Item';
                                            // Handle price: prefer item price (snapshot), fallback to current menu price
                                            const itemPrice = item.price || item.menuItem?.price || 0;

                                            return (
                                                <div key={item.id} className="flex justify-between text-sm items-start">
                                                    <span className="text-gray-700 font-medium">
                                                        <span className="font-bold text-gray-900 mr-2">{item.quantity}x</span>
                                                        {itemName}
                                                    </span>
                                                    {/* Only show price if > 0 to avoid clutter/confusion if data missing */}
                                                    {itemPrice > 0 && (
                                                        <span className="text-gray-500">₹{(itemPrice * item.quantity).toFixed(2)}</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {(!order.items || order.items.length === 0) && (
                                            <p className="text-xs text-gray-400 italic">No items details available</p>
                                        )}
                                    </div>

                                    <div className="h-px bg-gray-100 my-3"></div>

                                    {/* Total Paid Footer */}
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500 font-medium">Total Paid</span>
                                        <div className="flex flex-col items-end">
                                            <span className="text-lg font-bold" style={{ color: theme.primary }}>
                                                ₹{totalAmount.toFixed(2)}
                                            </span>
                                            {order.status === 'SERVED' && (
                                                <span className="flex items-center gap-1 text-green-600 text-[10px] font-bold uppercase tracking-wider">
                                                    <CheckCircle2 size={10} /> Served
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
                
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.4s ease-out forwards; }
            `}</style>
        </div>
    );
}
