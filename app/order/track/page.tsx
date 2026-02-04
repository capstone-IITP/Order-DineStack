"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getOrderStatus } from '@/lib/api';
import { Loader2, CheckCircle2, ChefHat, Clock, Utensils, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// Status types
type OrderStatus = 'RECEIVED' | 'PREPARING' | 'READY' | 'SERVED';

interface OrderDetails {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    totalAmount: number;
    createdAt: string;
}

function OrderTrackContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');

    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!orderId) {
            setError('Order ID is missing.');
            setLoading(false);
            return;
        }

        const fetchStatus = async () => {
            try {
                const data = await getOrderStatus(orderId);
                setOrder(data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch status:', err);
                // Don't show error if it's just a polling glitch, unless it's the first load
                if (!order) {
                    setError('Failed to load order status.');
                }
            } finally {
                setLoading(false);
            }
        };

        // Initial fetch
        fetchStatus();

        // Poll every 10 seconds
        const interval = setInterval(fetchStatus, 10000);

        return () => clearInterval(interval);
    }, [orderId]);

    const getStatusInfo = (status: OrderStatus) => {
        switch (status) {
            case 'RECEIVED':
                return {
                    icon: <Clock className="w-16 h-16 text-blue-500" />,
                    title: 'Order Received',
                    message: 'Your order has been received and will be prepared shortly.',
                    color: 'bg-blue-50 text-blue-700 border-blue-200'
                };
            case 'PREPARING':
                return {
                    icon: <ChefHat className="w-16 h-16 text-orange-500" />,
                    title: 'Preparing Your Meal',
                    message: 'The kitchen is currently preparing your order.',
                    color: 'bg-orange-50 text-orange-700 border-orange-200'
                };
            case 'READY':
                return {
                    icon: <Utensils className="w-16 h-16 text-green-500" />,
                    title: 'Ready to Serve',
                    message: 'Your order is ready and will be served to your table soon.',
                    color: 'bg-green-50 text-green-700 border-green-200'
                };
            case 'SERVED':
                return {
                    icon: <CheckCircle2 className="w-16 h-16 text-gray-500" />,
                    title: 'Served',
                    message: 'Enjoy your meal!',
                    color: 'bg-gray-50 text-gray-700 border-gray-200'
                };
            default:
                return {
                    icon: <Loader2 className="w-16 h-16 text-gray-400" />,
                    title: 'Unknown Status',
                    message: 'Checking status...',
                    color: 'bg-gray-50 text-gray-500'
                };
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-800">Error</h2>
                <p className="text-gray-600 mt-2">{error || 'Order not found'}</p>
                <Link href="/" className="mt-6 text-orange-600 hover:underline">
                    Return Home
                </Link>
            </div>
        );
    }

    const statusInfo = getStatusInfo(order.status);

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8 text-center">

                {/* Order Info */}
                <div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Order #{order.orderNumber}</p>
                    <div className="mt-8 flex justify-center animate-bounce-slow">
                        {statusInfo.icon}
                    </div>
                </div>

                {/* Status Card */}
                <div className={`p-6 rounded-2xl border ${statusInfo.color} transition-colors duration-500`}>
                    <h1 className="text-2xl font-bold mb-2">{statusInfo.title}</h1>
                    <p className="opacity-90">{statusInfo.message}</p>
                </div>

                {/* Details functionality could be added here */}

                <div className="pt-10">
                    {/* If we had the restaurant ID stored or available, we could link back to menu. 
               For now just a generic message or disabled state if completed. */}
                    {order.status === 'SERVED' && (
                        <p className="text-gray-500">Thank you for dining with us!</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function OrderTrackPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <Loader2 className="animate-spin w-8 h-8 text-orange-500" />
            </div>
        }>
            <OrderTrackContent />
        </Suspense>
    );
}
