import { MenuItem, Category } from '../types';

export const CATEGORIES: Category[] = ['Starters', 'Mains', 'Desserts', 'Drinks'];

export const MENU_DATA: MenuItem[] = [
    {
        id: '1',
        name: 'Truffle Mushroom Risotto',
        description: 'Creamy arborio rice with woodland mushrooms, finished with truffle oil and parmesan.',
        price: 24,
        category: 'Mains',
        isVegetarian: true,
        isPopular: true,
        isAvailable: true,
        customizationGroups: [
            {
                id: 'cheese',
                name: 'Choice of Cheese',
                minSelection: 1,
                maxSelection: 1,
                options: [
                    { id: 'parm', name: 'Parmesan', priceModifier: 0 },
                    { id: 'pecorino', name: 'Pecorino Romano', priceModifier: 1 },
                    { id: 'vegan', name: 'Vegan Cheese', priceModifier: 2 },
                ]
            },
            {
                id: 'extras',
                name: 'Enhancements',
                minSelection: 0,
                maxSelection: 2,
                options: [
                    { id: 'oil', name: 'Extra Truffle Oil', priceModifier: 3 },
                    { id: 'mushrooms', name: 'Extra Wild Mushrooms', priceModifier: 5 }
                ]
            }
        ]
    },
    {
        id: '2',
        name: 'Pan-Seared Scallops',
        description: 'Jumbo scallops with cauliflower purée and crispy pancetta.',
        price: 18,
        category: 'Starters',
        isVegetarian: false,
        isAvailable: true,
    },
    {
        id: '3',
        name: 'Spicy Thai Basil Chicken',
        description: 'Minced chicken stir-fried with thai basil, chili, and garlic found over jasmine rice.',
        price: 20,
        category: 'Mains',
        isVegetarian: false,
        isSpicy: true,
        isAvailable: true,
        customizationGroups: [
            {
                id: 'spice',
                name: 'Spice Level',
                minSelection: 1,
                maxSelection: 1,
                options: [
                    { id: 'mild', name: 'Mild', priceModifier: 0 },
                    { id: 'med', name: 'Medium', priceModifier: 0 },
                    { id: 'hot', name: 'Hot', priceModifier: 0 },
                    { id: 'thai', name: 'Thai Hot 🌶️', priceModifier: 0 },
                ]
            },
            {
                id: 'egg',
                name: 'Add Egg',
                minSelection: 0,
                maxSelection: 1,
                options: [
                    { id: 'fried_egg', name: 'Crispy Fried Egg', priceModifier: 2 }
                ]
            }
        ]
    },
    {
        id: '4',
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with a molten center, served with vanilla bean ice cream.',
        price: 12,
        category: 'Desserts',
        isVegetarian: true,
        isPopular: true,
        isAvailable: false,
    },
    {
        id: '5',
        name: 'Artisan Burrata',
        description: 'Fresh burrata cheese with heirloom tomatoes, basil pesto, and balsamic glaze.',
        price: 16,
        category: 'Starters',
        isVegetarian: true,
        isAvailable: true,
    },
    {
        id: '6',
        name: 'Signature Old Fashioned',
        description: 'Bourbon, smoked maple syrup, angostura bitters, orange peel.',
        price: 15,
        category: 'Drinks',
        isVegetarian: true,
        isAvailable: true,
    },
];
