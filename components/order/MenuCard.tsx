"use client";

import { Minus, Plus, ShoppingBag } from 'lucide-react';

interface MenuItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    image?: string;
    isVeg?: boolean;
    isBestseller?: boolean;
}

interface MenuCardProps {
    item: MenuItem;
    quantity: number;
    onAdd: () => void;
    onIncrease: () => void;
    onDecrease: () => void;
    theme: { bg: string; text: string; primary: string; secondary: string; accent: string };
}

export default function MenuCard({ item, quantity, onAdd, onIncrease, onDecrease, theme }: MenuCardProps) {
    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-stone-200/50 flex gap-4 h-full transform transition-transform hover:scale-[1.02]">
            {/* Image */}
            <div className="w-24 h-24 bg-stone-100 rounded-xl flex-none overflow-hidden relative shadow-inner">
                {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <ShoppingBag size={24} />
                    </div>
                )}
                {item.isBestseller && (
                    <span className="absolute top-0 left-0 bg-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-br-lg shadow-sm text-black">
                        BESTSELLER
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                    <div className="flex items-start justify-between">
                        <h3 className="font-medium text-lg leading-tight truncate pr-2" style={{ color: theme.primary }}>
                            {item.name}
                        </h3>
                        {/* Veg/Non-Veg Icon */}
                        <div className={`mt-1 w-3 h-3 border flex items-center justify-center flex-none ${item.isVeg ? 'border-green-600' : 'border-red-600'
                            }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'
                                }`} />
                        </div>
                    </div>
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: theme.secondary }}>
                        {item.description || "A delicious choice"}
                    </p>
                </div>

                <div className="flex items-end justify-between mt-2">
                    <span className="font-semibold text-lg" style={{ color: theme.primary }}>
                        ₹{item.price}
                    </span>

                    {/* Add / Counter Button */}
                    {quantity === 0 ? (
                        <button
                            onClick={onAdd}
                            className="px-6 py-2 rounded-lg text-sm font-bold shadow-md active:scale-95 transition-all outline-none focus:ring-2 focus:ring-offset-1 focus:ring-black/10"
                            style={{
                                backgroundColor: theme.bg,
                                color: theme.accent,
                                border: `1px solid ${theme.accent}`
                            }}
                        >
                            ADD
                        </button>
                    ) : (
                        <div className="flex items-center gap-3 bg-white rounded-lg px-2 py-1 shadow-md border border-stone-100 animate-scale-in">
                            <button onClick={onDecrease} className="p-1 hover:bg-stone-100 rounded text-stone-500">
                                <Minus size={14} />
                            </button>
                            <span className="font-bold w-4 text-center text-sm">{quantity}</span>
                            <button onClick={onIncrease} className="p-1 hover:bg-stone-100 rounded text-stone-800">
                                <Plus size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
