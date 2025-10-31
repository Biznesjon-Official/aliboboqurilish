import { useQuery } from '@tanstack/react-query';

// API base URL - Direct connection to backend
const API_BASE = process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');

// Fast fetch function - minimal data with ultra-small batches and images
const fetchProductsFast = async ({ category, search = '', page = 1, limit = 20, signal }) => {
    console.log(' [fetchProductsFast] Parameters:', { category, search, page, limit });
    
    const params = new URLSearchParams({
        limit: limit.toString(), // Reduced default from 60 to 20
        page: page.toString(),
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        includeImages: 'true', // Show images in fast mode as requested
    });

    if (category && category !== '') {
        params.append('category', category);
        console.log(' [fetchProductsFast] Added category to params:', category);
    }
    if (search && search.trim() !== '') {
        params.append('search', search.trim());
        console.log(' [fetchProductsFast] Added search to params:', search.trim());
    }
    
    const url = `${API_BASE}/products?${params.toString()}`;
    console.log(' [fetchProductsFast] Request URL:', url);

    const response = await fetch(url, {
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
        queryKey: ['products-fast', category || '', search || '', page, limit],
        queryFn: ({ signal }) => fetchProductsFast({ category, search, page, limit, signal }),
        keepPreviousData: false, // Disable to prevent stale data
        staleTime: 30 * 1000, // Reduced to 30 seconds for fresh data
        cacheTime: 5 * 60 * 1000, // Reduced to 5 minutes
        refetchOnWindowFocus: false, // Disable for speed
        refetchOnReconnect: true, // Enable for reliability
        refetchOnMount: true, // Enable for fresh data
        retry: 2, // Increase retry attempts
        retryDelay: 500, // Increase retry delay
    });
};
export default useProductsFast;