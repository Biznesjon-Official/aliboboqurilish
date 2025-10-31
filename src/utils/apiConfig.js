// API Configuration for production and development
const getApiBaseUrl = () => {
    // Production mode - use empty string for relative URLs (nginx will handle)
    if (process.env.NODE_ENV === 'production') {
        return '';
    }

    // Development mode - use environment variables or localhost
    return process.env.REACT_APP_API_URL ||
        process.env.REACT_APP_API_BASE?.replace('/api', '') ||
        'http://localhost:5000';
};

const getApiUrl = () => {
    // Production mode - use relative URLs with /api prefix
    if (process.env.NODE_ENV === 'production') {
        return '/api';
    }

    // Development mode - use full URL with /api
    const baseUrl = process.env.REACT_APP_API_URL ||
        process.env.REACT_APP_API_BASE?.replace('/api', '') ||
        'http://localhost:5000';

    return `${baseUrl}/api`;
};

export const API_BASE_URL = getApiBaseUrl();
export const API_URL = getApiUrl();

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

// Helper function to build full API URLs with /api prefix
export const buildFullApiUrl = (endpoint) => {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    return `${API_URL}/${cleanEndpoint}`;
};

// Export for debugging
console.log('🔗 API Configuration:', {
    NODE_ENV: process.env.NODE_ENV,
    API_BASE_URL,
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    REACT_APP_API_BASE: process.env.REACT_APP_API_BASE
});