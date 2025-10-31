import { useQuery } from '@tanstack/react-query';

// Ultra-fast API base URL - Direct connection to backend
const API_BASE = process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');
const USE_FAST = (process.env.REACT_APP_USE_FAST || 'true').toLowerCase() === 'true';

// Ultra-fast fetch function - minimal data, no images
const fetchUltraFastProducts = async ({ category, page = 1, limit = 20, signal }) => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    page: page.toString(),
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });
  
  if (category && category !== '' && category !== 'all') {
    params.append('category', category);
  }
  
  // Always use fast endpoint if available, fallback to regular
  const endpoint = `${API_BASE}/products/fast?${params.toString()}`;

  const response = await fetch(endpoint, {
    signal,
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

// Ultra-fast products hook with aggressive optimization
export const useUltraFastProducts = (category = '', page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['products-ultra-fast', category, page, limit],
    queryFn: ({ signal }) => fetchUltraFastProducts({ category, page, limit, signal }),
    keepPreviousData: true,
    staleTime: 10 * 1000, // 10 seconds for ultra-fast updates
    cacheTime: 2 * 60 * 1000, // 2 minutes memory cache
    refetchOnWindowFocus: false, // Disable for maximum speed
    refetchOnReconnect: false, // Disable for maximum speed
    refetchOnMount: true, // Enable for fresh data 
    retry: 1, // Quick retry
    retryDelay: 200, // Ultra quick retry
    // Enable suspense for concurrent rendering
    suspense: false,
    // Network-first strategy for first render speed
    networkMode: 'online',
  });
};

export default useUltraFastProducts;