"use client";

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

interface LenisProviderProps {
    children: React.ReactNode;
}

// Global Lenis context for pages that use body scrolling
export default function LenisProvider({ children }: LenisProviderProps) {
    useEffect(() => {
        // Only apply Lenis on pages that use normal body scrolling
        // Pages with container scrolling (like order page) should use useLenis hook directly
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            touchMultiplier: 2,
        });

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, []);

    return <>{children}</>;
}

// Hook for pages with container-based scrolling
export function useLenisScroll(scrollContainerRef: React.RefObject<HTMLElement | null>) {
    const lenisRef = useRef<Lenis | null>(null);

    useEffect(() => {
        if (!scrollContainerRef.current) return;

        lenisRef.current = new Lenis({
            wrapper: scrollContainerRef.current,
            content: scrollContainerRef.current.firstElementChild as HTMLElement,
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            touchMultiplier: 2,
        });

        function raf(time: number) {
            lenisRef.current?.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenisRef.current?.destroy();
        };
    }, [scrollContainerRef]);

    return lenisRef;
}


