'use client';

import { FileWarning } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SessionExpiredModal() {
    const router = useRouter();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Build-in a small delay to ensure animation plays
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const handleReScan = () => {
        // Clear all local storage to ensure fresh state
        localStorage.clear();

        // Redirect to home
        router.push('/');

        // Force a reload to clear any in-memory state
        window.location.href = '/';
    };

    return (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="mx-4 max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl text-center">
                <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <FileWarning className="w-8 h-8 text-red-500" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-3">Session Expired</h2>

                <p className="text-zinc-400 mb-8 leading-relaxed">
                    Your table session has expired. Please re-scan the QR code on your table to verify your presence and continue ordering.
                </p>

                <button
                    onClick={handleReScan}
                    className="w-full bg-white text-black font-semibold py-4 rounded-xl hover:bg-zinc-200 transition-colors active:scale-95 duration-200"
                >
                    Re-Scan QR Code
                </button>
            </div>
        </div>
    );
}
