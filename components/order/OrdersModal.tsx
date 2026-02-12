
import React, { useEffect, useState } from 'react';
import { X, Clock, ShoppingBag, ChevronRight, CheckCircle2, AlertCircle, Utensils, FileText } from 'lucide-react';
import { getCustomerOrders, CustomerOrder } from '@/lib/api';

interface OrdersModalProps {
    isOpen: boolean;
    onClose: () => void;
    restaurantId: string;
    phone: string;
    theme: any;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    'PENDING': { label: 'Pending', color: '#B45309', bg: '#FFFBEB' },
    'PREPARING': { label: 'Preparing', color: '#15803D', bg: '#F0FDF4' },
    'SERVED': { label: 'Served', color: '#1D4ED8', bg: '#EFF6FF' },
    'COMPLETED': { label: 'Completed', color: '#374151', bg: '#F3F4F6' },
    'CANCELLED': { label: 'Cancelled', color: '#991B1B', bg: '#FEF2F2' },
};

export default function OrdersModal({ isOpen, onClose, restaurantId, phone, theme }: OrdersModalProps) {
    const [activeTab, setActiveTab] = useState<'current' | 'past'>('current');
    const [orders, setOrders] = useState<CustomerOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = () => {
        if (restaurantId && phone) {
            setLoading(true);
            setError(null);
            getCustomerOrders(restaurantId, phone)
                .then(data => setOrders(data))
                .catch(err => {
                    console.error("Failed to load orders", err);
                    const msg = err.response?.data?.error || err.message || "Failed to load your orders. Please try again.";
                    setError(msg);
                })
                .finally(() => setLoading(false));
        }
    };

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (isOpen && restaurantId && phone) {
            // Initial fetch
            fetchOrders();

            // Real-time polling (every 10 seconds)
            intervalId = setInterval(() => {
                // Silent fetch (don't set loading state to true for background updates)
                if (restaurantId && phone) {
                    getCustomerOrders(restaurantId, phone)
                        .then(data => setOrders(data))
                        .catch(err => {
                            // Silent fail on background poll, unless 404 handling logic in api.ts is considered
                            console.warn("Background poll failed", err);
                        });
                }
            }, 10000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isOpen, restaurantId, phone]);

    if (!isOpen) return null;

    // Filter orders based on tab
    const filteredOrders = orders.filter(order => {
        const isCurrent = ['PENDING', 'PREPARING', 'SERVED'].includes(order.status);
        return activeTab === 'current' ? isCurrent : !isCurrent;
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
                            return (
                                <div
                                    key={order.id}
                                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-fade-in-up"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: status.bg, color: status.color }}>
                                                    {status.label}
                                                </span>
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Clock size={10} />
                                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-sm" style={{ color: theme.text }}>Order #{order.orderNumber}</h4>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-bold" style={{ color: theme.primary }}>₹{order.totalAmount}</span>
                                            <span className="text-xs text-gray-400">{order.items.length} Items</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-3">
                                        {order.items.map(item => (
                                            <div key={item.id} className="flex justify-between text-sm">
                                                <span className="text-gray-600 truncate max-w-[70%]">
                                                    <span className="font-bold text-gray-800">{item.quantity}x</span> {item.name}
                                                </span>
                                                <span className="text-gray-500">₹{item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-center text-xs text-gray-400">
                                        <span>Total Paid</span>
                                        {order.status === 'SERVED' && (
                                            <span className="flex items-center gap-1 text-green-600 font-bold">
                                                <CheckCircle2 size={12} /> Served
                                            </span>
                                        )}
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
