"use client";

import React, { useRef, useEffect, useState } from 'react';
import MenuItemCard from './MenuItemCard';
import { MenuItem, Category } from '../../types';

interface MenuListProps {
    categories: Category[];
    items: MenuItem[];
    onItemClick: (item: MenuItem) => void;
}

export default function MenuList({ categories, items, onItemClick }: MenuListProps) {
    const [activeCategory, setActiveCategory] = useState<Category>(categories[0]);

    // Group items by category
    const groupedItems = React.useMemo(() => {
        const groups: Partial<Record<Category, MenuItem[]>> = {};
        categories.forEach(cat => {
            groups[cat] = items.filter(i => i.category === cat);
        });
        return groups;
    }, [categories, items]);

    const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const scrollToCategory = (cat: Category) => {
        setActiveCategory(cat);
        const element = categoryRefs.current[cat];
        if (element) {
            const yOffset = -180; // Header offset
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    // Setup intersection observer to update active category on scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveCategory(entry.target.getAttribute('data-category') as Category);
                    }
                });
            },
            { rootMargin: '-150px 0px -50% 0px' }
        );

        Object.values(categoryRefs.current).forEach((el) => {
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [categories]);

    return (
        <div className="w-full pb-24">
            {/* Category Navigation (Sticky) */}
            <div className="sticky top-0 z-30 bg-[#f8f9fa]/95 backdrop-blur-md py-4 -mx-4 px-4 sm:mx-0 sm:px-0 mb-6 overflow-x-auto no-scrollbar border-b border-gray-200/50">
                <div className="flex gap-3 min-w-max px-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => scrollToCategory(cat)}
                            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm whitespace-nowrap ${activeCategory === cat
                                    ? 'bg-[#8D0B41] text-white shadow-[#8D0B41]/20 scale-105'
                                    : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-gray-100'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu Groups */}
            <div className="space-y-12">
                {categories.map((cat) => {
                    const catItems = groupedItems[cat];
                    if (!catItems || catItems.length === 0) return null;

                    return (
                        <div
                            key={cat}
                            ref={(el) => { categoryRefs.current[cat] = el; }}
                            data-category={cat}
                            className="scroll-mt-32"
                        >
                            <h3 className="text-2xl font-serif-custom font-bold text-[#5A0528] mb-6 pl-2 border-l-4 border-[#8D0B41]">{cat}</h3>
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {catItems.map((item) => (
                                    <MenuItemCard
                                        key={item.id}
                                        item={item}
                                        onClick={() => onItemClick(item)}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
