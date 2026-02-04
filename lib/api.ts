import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add token to requests
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('customerToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export interface SessionData {
    token: string;
    restaurant: {
        id: string;
        name: string;
        description?: string;
        logo?: string;
    };
    table: {
        id: string;
        number: string;
    };
}

export interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    image?: string;
    isVegetarian?: boolean;
    isSpicy?: boolean;
    isAvailable: boolean;
}

export interface Category {
    id: string;
    name: string;
    items: MenuItem[];
}

export const initSession = async (restaurantId: string, tableId: string): Promise<SessionData> => {
    try {
        const response = await api.post('/customer/session/init', { restaurantId, tableId });
        const sessionData = response.data;

        if (sessionData.token) {
            localStorage.setItem('customerToken', sessionData.token);
            localStorage.setItem('sessionData', JSON.stringify(sessionData));
        }

        return sessionData;
    } catch (error) {
        console.error('Failed to init session:', error);
        throw error;
    }
};

export const getMenu = async (restaurantId: string): Promise<Category[]> => {
    try {
        const response = await api.get(`/customer/menu/${restaurantId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to get menu:', error);
        throw error;
    }
};

export const placeOrder = async (items: { menuItemId: string; quantity: number; price: number }[], totalAmount: number) => {
    try {
        const response = await api.post('/customer/orders', { items, totalAmount });
        return response.data;
    } catch (error) {
        console.error('Failed to place order:', error);
        throw error;
    }
};

export const getOrderStatus = async (orderId: string) => {
    try {
        const response = await api.get(`/customer/orders/${orderId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to get order status:', error);
        throw error;
    }
};

export default api;
