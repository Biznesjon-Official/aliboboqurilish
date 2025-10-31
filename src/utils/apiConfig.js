// API Configuration for production and development
const getApiBaseUrl = () => {
    // Production mode - use relative URLs (nginx will handle)
    if (process.env.NODE_ENV === 'production') {
        return '';
    }

    // Development mode - use environment variables or localhost
    return process.env.REACT_APP_API_URL ||
        process.env.REACT_APP_API_BASE?.replace('/api', '') ||
        'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to build API URLs
export const buildApiUrl = (endpoint) => {
    const baseUrl = API_BASE_URL;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    if (baseUrl === '') {
        // Production - use relative URLs
        return cleanEndpoint;
    } else {
        // Development - use full URLs
        return `${baseUrl}${cleanEndpoint}`;
    }
};

// Export for debugging
console.log('🔗 API Configuration:', {
    NODE_ENV: process.env.NODE_ENV,
    API_BASE_URL,
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    REACT_APP_API_BASE: process.env.REACT_APP_API_BASE
});