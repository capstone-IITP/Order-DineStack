import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://software.dinestack.in/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Enable cookie-based JWT sessions
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

// Store current table ID for session recovery
let currentTableId: string | null = null;

export const setCurrentTableId = (tableId: string) => {
    currentTableId = tableId;
};

export const getCurrentTableId = () => currentTableId;

// Response interceptor for 401 handling with session retry
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If we get a 401 and haven't retried yet, attempt to re-bootstrap session
        if (error.response?.status === 401 && !originalRequest._retry && currentTableId) {
            originalRequest._retry = true;

            try {
                console.log('Session expired, attempting to re-bootstrap...');
                // Re-bootstrap session by calling table info endpoint
                const response = await api.get(`/customer/table/${currentTableId}`);
                const data = response.data;

                if (data.token) {
                    localStorage.setItem('customerToken', data.token);
                    localStorage.setItem('sessionData', JSON.stringify({
                        token: data.token,
                        restaurant: data.restaurant,
                        table: data.table
                    }));

                    // Update Authorization header for retry
                    originalRequest.headers.Authorization = `Bearer ${data.token}`;
                }

                // Retry the original request
                return api(originalRequest);
            } catch (retryError) {
                console.error('Failed to re-bootstrap session:', retryError);
                // Clear stored credentials on failed retry
                localStorage.removeItem('customerToken');
                localStorage.removeItem('sessionData');
                throw error; // Throw original error
            }
        }

        return Promise.reject(error);
    }
);

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
        const data = response.data;

        // Transform backend response to match expected SessionData format
        const sessionData: SessionData = {
            token: data.token,
            restaurant: {
                id: restaurantId,
                name: data.restaurantName || 'Restaurant',
            },
            table: {
                id: tableId,
                number: data.tableNumber || tableId.substring(0, 4).toUpperCase(),
            },
        };

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
        // Backend returns { success: true, categories: [...] }
        const categories = response.data.categories || [];

        // Map backend property names to frontend expected names
        return categories.map((category: any) => ({
            ...category,
            items: (category.items || []).map((item: any) => ({
                id: item.id,
                name: item.name,
                description: item.description || '',
                price: item.price,
                image: item.image,
                isVegetarian: item.isVegetarian,
                isSpicy: item.isSpicy,
                isAvailable: item.isActive !== false, // Map isActive to isAvailable
            }))
        }));
    } catch (error) {
        console.error('Failed to get menu:', error);
        throw error;
    }
};

export const placeOrder = async (
    items: { menuItemId: string; quantity: number; price: number }[],
    totalAmount: number,
    tableId?: string
) => {
    try {
        // Use provided tableId or fall back to stored currentTableId
        const orderTableId = tableId || getCurrentTableId();

        const response = await api.post('/customer/orders', {
            items,
            totalAmount,
            tableId: orderTableId
        });
        // Backend returns { success: true, order: { id, orderNumber, ... } }
        const order = response.data.order || {};
        return {
            success: response.data.success,
            order,
            orderNumber: order.id, // Fallback to ID since orderNumber doesn't exist in schema
            estimatedTime: response.data.estimatedTime,
        };
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

// Combined table info + session + menu (for path-based QR routing)
export interface TableInfoResponse {
    success: boolean;
    token: string;
    restaurant: {
        id: string;
        name: string;
    };
    table: {
        id: string;
        number: string;
    };
    categories: Category[];
}

export const getTableInfo = async (tableId: string): Promise<TableInfoResponse> => {
    try {
        // Store table ID for session recovery on 401
        setCurrentTableId(tableId);

        const response = await api.get(`/customer/table/${tableId}`);
        const data = response.data;

        // Store token
        if (data.token) {
            localStorage.setItem('customerToken', data.token);
            localStorage.setItem('sessionData', JSON.stringify({
                token: data.token,
                restaurant: data.restaurant,
                table: data.table
            }));
        }

        // Map menu items isActive -> isAvailable
        const categories = (data.categories || []).map((category: any) => ({
            ...category,
            items: (category.items || []).map((item: any) => ({
                id: item.id,
                name: item.name,
                description: item.description || '',
                price: item.price,
                image: item.image,
                isVegetarian: item.isVegetarian,
                isSpicy: item.isSpicy,
                isAvailable: item.isActive !== false,
            }))
        }));

        return {
            ...data,
            categories
        };
    } catch (error) {
        console.error('Failed to get table info:', error);
        throw error;
    }
};

export interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
}

export interface CustomerOrder {
    id: string;
    orderNumber: string;
    status: 'PENDING' | 'PREPARING' | 'SERVED' | 'COMPLETED' | 'CANCELLED';
    totalAmount: number;
    createdAt: string;
    items: OrderItem[];
    tableId?: string;
}

export const getCustomerOrders = async (restaurantId: string, phone: string): Promise<CustomerOrder[]> => {
    try {
        console.log(`[API] Fetching orders for Restaurant: ${restaurantId}, Phone: ${phone}`);
        const response = await api.get(`/customer/orders`, {
            params: { restaurantId, phone }
        });
        console.log('[API] Orders fetched:', response.data);
        return response.data.orders || [];
    } catch (error: any) {
        // If the endpoint is missing (404), treat it as "No orders found" to avoid UI errors
        if (error.response?.status === 404) {
            console.warn('[API] /customer/orders endpoint not found (404). Treating as empty list.');
            return [];
        }

        console.error('Failed to fetch orders:', error);
        throw error;
    }
};

export default api;
