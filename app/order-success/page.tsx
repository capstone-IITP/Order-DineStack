"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, Clock, ChefHat, ArrowRight, Utensils } from 'lucide-react';
import Link from 'next/link';
import { getOrderStatus } from '@/lib/api';

// --- Configuration ---
const THEME = {
    bg: '#FFFBEA',         // Warm Cream
    surface: '#FFFFFF',    // Pure White
    primary: '#8B1E3F',    // Deep Wine / Maroon
    secondary: '#C9A24D',  // Muted Gold
    text: '#1C1C1C',       // Near Black
    textMuted: '#6B6B6B',  // Soft Gray
    border: '#E8E4D5',     // Light Beige Border
    success: '#2E7D32',    // Green
};

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Read params as per requirement
    const orderId = searchParams.get('orderId');
    const eta = searchParams.get('eta');

    // State for order status
    const [status, setStatus] = useState<string>('RECEIVED');

    // Prevent back navigation to order page
    useEffect(() => {
        window.history.pushState(null, '', window.location.href);
        const handlePopState = () => {
            window.history.pushState(null, '', window.location.href);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Polling Logic
    useEffect(() => {
        if (!orderId) return;

        const pollStatus = async () => {
            try {
                const data = await getOrderStatus(orderId);
                if (data.success && data.order) {
                    setStatus(data.order.status);

                    // Stop polling if served or completed
                    if (['SERVED', 'COMPLETED', 'CANCELLED'].includes(data.order.status)) {
                        return true; // Signal to stop
                    }
                }
            } catch (error) {
                console.error('Error polling status:', error);
            }
            return false;
        };

        // Initial check
        pollStatus();

        // Set up interval
        const intervalId = setInterval(async () => {
            const shouldStop = await pollStatus();
            if (shouldStop) {
                clearInterval(intervalId);
            }
        }, 5000);

        return () => clearInterval(intervalId);
    }, [orderId]);



    // Strict check: if orderId is missing, show error state
    if (!orderId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center" style={{ backgroundColor: THEME.bg }}>
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4 text-gray-400">
                    <ChefHat size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No order details found</h3>
                <p className="text-gray-500 mb-6">We couldn't find the order information for this session.</p>
                <Link href="/" className="px-6 py-3 rounded-xl bg-gray-900 text-white font-bold">Return Home</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
            style={{ backgroundColor: THEME.bg, color: THEME.text }}>

            {/* Ambient Background */}
            <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[60%] bg-green-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[60%] bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center text-center animate-scale-up">

                {/* Success Icon */}
                <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center mb-6 animate-bounce-in">
                    <CheckCircle2 size={48} className="text-green-600 drop-shadow-sm" />
                </div>

                <h1 className="text-2xl font-bold mb-2">Order Placed Successfully!</h1>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                    Your order <span className="font-mono font-bold text-gray-800">#{orderId}</span> has been sent to the kitchen.
                </p>

                {/* ETA Card - Only show if eta is available */}
                {eta && (
                    <div className="w-full bg-orange-50 rounded-2xl p-6 border border-orange-100 mb-8 flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 text-orange-800 font-bold uppercase tracking-widest text-xs mb-1">
                            <Clock size={14} /> Estimated Wait
                        </div>
                        <span className="text-3xl font-black text-orange-900">{eta}</span>
                        <p className="text-xs text-orange-600/80">Chefs are working their magic!</p>
                    </div>
                )}

                {/* Info Text */}
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl text-left w-full mb-8">
                    <ChefHat size={20} className="text-gray-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-500">
                        Sit back and relax. We'll bring your food to your table as soon as it's ready.
                    </p>
                </div>

                {/* Action Button / Status Indicator */}
                <div className="w-full">
                    {status === 'READY' ? (
                        <div className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg animate-bounce"
                            style={{ backgroundColor: THEME.success }}>
                            <Utensils size={20} />
                            Ready! Serving shortly
                            <img src="https://cdn-icons-png.flaticon.com/128/6699/6699608.png" className="w-5 h-5 brightness-0 invert ml-1" alt="Serving" />
                        </div>
                    ) : status === 'SERVED' || status === 'COMPLETED' ? (
                        <div className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 opacity-90"
                            style={{ backgroundColor: THEME.secondary }}>
                            <CheckCircle2 size={20} />
                            Enjoy your meal!
                            <img src="https://cdn-icons-png.flaticon.com/128/16695/16695112.png" className="w-5 h-5 ml-1" alt="Enjoy" />
                        </div>
                    ) : (
                        <div className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 opacity-90 cursor-default animate-pulse-slow"
                            style={{ backgroundColor: THEME.primary }}>
                            <ChefHat size={20} />
                            Preparing...
                        </div>
                    )}
                </div>

                <p className="mt-6 text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                    Status updates automatically
                </p>

            </div>

            <style jsx global>{`
                @keyframes scale-up {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-scale-up { animation: scale-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

                @keyframes bounce-in {
                    0% { transform: scale(0); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
                .animate-bounce-in { animation: bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards 0.2s; opacity: 0; animation-fill-mode: forwards; }
                
                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.8; }
                }
                .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
                

            `}</style>
        </div>
    );
}

export default function OrderSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#FFFBEA]">Loading...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
