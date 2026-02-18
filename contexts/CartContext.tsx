"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Define types compatible with existing usage but extensible
export interface Option {
    id: string;
    name: string;
    priceModifier: number;
}

export interface CartItem {
    id: string; // Unique ID for the cart entry (e.g. random string)
    menuItemId: string;
    name: string;
    image?: string;
    basePrice: number;
    finalPrice: number; // Unit price including options
    quantity: number;
    selectedOptions: Record<string, Option[]>;
    instructions?: string;
}

interface CartContextType {
    cartItems: CartItem[];
    isCartOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
    addToCart: (item: Omit<CartItem, 'id'>) => void;
    removeFromCart: (cartItemId: string) => void;
    updateQuantity: (cartItemId: string, delta: number) => void;
    clearCart: () => void;
    cartTotal: number;
    cartItemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from LocalStorage on mount
    useEffect(() => {
        try {
            const savedCart = localStorage.getItem('dinestack_cart');
            if (savedCart) {
                setCartItems(JSON.parse(savedCart));
            }
        } catch (error) {
            console.error("Failed to load cart from storage", error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Save to LocalStorage on change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('dinestack_cart', JSON.stringify(cartItems));
        }
    }, [cartItems, isLoaded]);

    const openCart = () => setIsCartOpen(true);
    const closeCart = () => setIsCartOpen(false);

    const addToCart = useCallback((newItem: Omit<CartItem, 'id'>) => {
        setCartItems(prev => {
            // Check for identical item (same ID, options, and instructions)
            const existingItemIndex = prev.findIndex(item =>
                item.menuItemId === newItem.menuItemId &&
                JSON.stringify(item.selectedOptions) === JSON.stringify(newItem.selectedOptions) &&
                (item.instructions || '') === (newItem.instructions || '')
            );

            if (existingItemIndex > -1) {
                // Update quantity of existing item
                const newItems = [...prev];
                newItems[existingItemIndex].quantity += newItem.quantity;
                // Optionally update price if it changed, but usually price is static per session
                return newItems;
            } else {
                // Add new item
                return [...prev, { ...newItem, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) }];
            }
        });
        // Optional: Auto open cart or show toast
        // setIsCartOpen(true); 
    }, []);

    const removeFromCart = useCallback((cartItemId: string) => {
        setCartItems(prev => prev.filter(item => item.id !== cartItemId));
    }, []);

    const updateQuantity = useCallback((cartItemId: string, delta: number) => {
        setCartItems(prev => {
            return prev.map(item => {
                if (item.id === cartItemId) {
                    const newQuantity = item.quantity + delta;
                    return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
                }
                return item;
            });
        });
    }, []);

    const clearCart = useCallback(() => {
        setCartItems([]);
    }, []);

    const cartTotal = cartItems.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
    const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            isCartOpen,
            openCart,
            closeCart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartTotal,
            cartItemCount
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
