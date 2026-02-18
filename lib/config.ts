const isProduction = process.env.NODE_ENV === 'production';

const config = {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE || (isProduction ? 'https://software.dinestack.in/api' : 'http://localhost:5001/api'),
};

// Validate configuration
if (!process.env.NEXT_PUBLIC_API_BASE) {
    console.warn('NEXT_PUBLIC_API_BASE is not defined in environment variables. Using default localhost.');
}

export default config;
