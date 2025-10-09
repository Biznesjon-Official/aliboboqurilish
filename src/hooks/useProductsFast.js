import { useQuery } from '@tanstack/react-query';

// API base URL - Direct connection to backend
const API_BASE = process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'production' ? 'https://aliboboqurilish.uz/api' : 'http://localhost:5000/api');

// Fast fetch function - minimal data with ultra-small batches and images
const fetchProductsFast = async ({ category, search = '', page = 1, limit = 20, signal }) => {
    const params = new URLSearchParams({
        limit: limit.toString(), // Reduced default from 60 to 20
        page: page.toString(),
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        includeImages: 'true', // Show images in fast mode as requested
    });

    if (category && category !== '') {
        params.append('category', category);
    }
    if (search && search.trim() !== '') {
        params.append('search', search.trim());
    }

    const response = await fetch(`${API_BASE}/products?${params.toString()}`, {
        signal,
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
};

// Ultra-fast products hook with aggressive optimization
export const useProductsFast = (category, search = '', page = 1, limit = 20) => {
    return useQuery({
        queryKey: ['products-fast', category, search, page, limit],
        queryFn: ({ signal }) => fetchProductsFast({ category, search, page, limit, signal }),
        keepPreviousData: true,
        staleTime: 10 * 60 * 1000, // Increased from 1min to 10min for aggressive caching
        cacheTime: 30 * 60 * 1000, // Increased from 5min to 30min
        refetchOnWindowFocus: false, // Disable for speed
        refetchOnReconnect: false, // Disable for speed
        refetchOnMount: false, // Disable for maximum speed
        retry: 1, // Quick retry only
        retryDelay: 100, // Super fast retry
    });
};
export default useProductsFast;