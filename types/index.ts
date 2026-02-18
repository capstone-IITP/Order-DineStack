export type Category = string;

export interface Option {
    id: string;
    name: string;
    priceModifier: number;
}

export interface OptionGroup {
    id: string;
    name: string;
    minSelection: number;
    maxSelection: number;
    options: Option[];
}

export interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    category: Category;
    image?: string;
    isVegetarian?: boolean;
    isSpicy?: boolean;
    isPopular?: boolean;
    isAvailable: boolean;
    customizationGroups?: OptionGroup[];
}
