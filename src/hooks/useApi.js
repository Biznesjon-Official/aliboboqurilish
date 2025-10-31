import { buildApiUrl } from '../utils/apiConfig';

// Custom hook for API calls with proper URL handling
export const useApi = () => {
  const apiCall = async (endpoint, options = {}) => {
    const url = buildApiUrl(endpoint);
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Remove Content-Type for FormData
    if (options.body instanceof FormData) {
      delete defaultOptions.headers['Content-Type'];
    }

    console.log('🌐 API Call:', { url, method: options.method || 'GET' });
    
    try {
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    }
  };

  return { apiCall };
};

export default useApi;