"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, Clock, ChefHat, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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
    const orderId = searchParams.get('orderId');
    const estimatedTime = searchParams.get('estimatedTime') || '15-20 mins';

    // Prevent back navigation to order page with same state
    useEffect(() => {
        // Optional: Could clear cart state here if it was persisted
        // Since cart is local state in previous page, it's already "cleared" by navigation

        // Disable back button to prevent accidental re-submission logic
        window.history.pushState(null, '', window.location.href);
        const handlePopState = () => {
            window.history.pushState(null, '', window.location.href);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    if (!orderId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center" style={{ backgroundColor: THEME.bg }}>
                <p className="text-gray-500">No order details found.</p>
                <Link href="/" className="mt-4 text-blue-600 underline">Return Home</Link>
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

                <h1 className="text-2xl font-bold mb-2">Order Received!</h1>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                    Your order <span className="font-mono font-bold text-gray-800">#{orderId}</span> has been sent to the kitchen.
                </p>

                {/* ETA Card */}
                <div className="w-full bg-orange-50 rounded-2xl p-6 border border-orange-100 mb-8 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-orange-800 font-bold uppercase tracking-widest text-xs mb-1">
                        <Clock size={14} /> Estimated Wait
                    </div>
                    <span className="text-3xl font-black text-orange-900">{estimatedTime}</span>
                    <p className="text-xs text-orange-600/80">Chefs are working their magic!</p>
                </div>

                {/* Info Text */}
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl text-left w-full mb-8">
                    <ChefHat size={20} className="text-gray-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-500">
                        Sit back and relax. We'll bring your food to your table as soon as it's ready.
                    </p>
                </div>

                {/* Action Button - In future could link to order status page */}
                <button
                    disabled
                    className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 opacity-90 cursor-default"
                    style={{ backgroundColor: THEME.primary }}
                >
                    Preparing...
                </button>

                <p className="mt-6 text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                    Do not refresh this page
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
