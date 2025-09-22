import { useState, useEffect, useRef, useMemo } from 'react';

// Improved cache with expiration management
const cache = new Map();

// Helper function to clean expired cache entries
const cleanCache = () => {
  const now = Date.now();
  for (const [key, { expiry }] of cache.entries()) {
    if (expiry < now) {
      cache.delete(key);
    }
  }
};

// Schedule cache cleaning every 5 minutes
setInterval(cleanCache, 5 * 60 * 1000);

// Rate limiting implementation - disable in development
const requestTimestamps = [];
const MAX_REQUESTS_PER_MINUTE = process.env.NODE_ENV === 'development' ? 10000 : 1000; // No limit in development

const canMakeRequest = () => {
  // No rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  const now = Date.now();
  // Remove timestamps older than 1 minute
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - 60000) {
    requestTimestamps.shift();
  }
  
  // Check if we can make another request
  if (requestTimestamps.length < MAX_REQUESTS_PER_MINUTE) {
    requestTimestamps.push(now);
    return true;
  }
  
  return false;
};

const waitForRateLimit = () => {
  return new Promise(resolve => {
    const check = () => {
      if (canMakeRequest()) {
        resolve();
      } else {
        setTimeout(check, 1000); // Check again in 1 second
      }
    };
    check();
  });
};

// Optimized parallel fetch hook with deduplication and error handling per request
export const useParallelFetch = (urls, options = {}) => {
  const {
    enabled = true,
    cacheTime = 60 * 1000, // Reduced to 1 minute
    staleTime = 30 * 1000, // Reduced to 30 seconds
  } = options;
  
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const abortControllersRef = useRef(new Map());
  const isMountedRef = useRef(true);

  // Generate a stable dependency key from urls using useMemo
  const urlsKey = useMemo(() => {
    if (!urls) return '';
    // Sort the URLs to ensure consistent key generation regardless of order
    return [...urls].sort().join('|');
  }, [JSON.stringify(urls)]); // Use JSON.stringify to properly detect changes in the urls array

  useEffect(() => {
    if (!urls || urls.length === 0 || !enabled) {
      setLoading(false);
      return;
    }

    // Clean up previous controllers
    abortControllersRef.current.forEach(controller => {
      controller.abort();
    });
    abortControllersRef.current = new Map();

    setLoading(true);
    const now = Date.now();
    const newData = {};
    const newErrors = {};
    let pendingFetches = urls.length;

    const fetchUrl = async (url) => {
      console.log(`📡 Attempting to fetch: ${url}`);
      
      // Check cache first
      const cachedData = cache.get(url);
      if (cachedData && cachedData.expiry > now) {
        if (cachedData.timestamp + staleTime > now) {
          // Fresh data from cache
          newData[url] = cachedData.data;
          pendingFetches--;
          if (pendingFetches === 0 && isMountedRef.current) {
            setData(newData);
            setErrors(newErrors);
            setLoading(false);
          }
          return; // Skip fetch for fresh cache
        }
        // Stale but usable - use it while fetching new data
        newData[url] = cachedData.data;
      }

      // Rate limiting - wait if necessary
      if (!canMakeRequest()) {
        console.log(`⏳ Rate limit reached, waiting before fetching: ${url}`);
        await waitForRateLimit();
      }

      // Create new abort controller for this URL
      const controller = new AbortController();
      abortControllersRef.current.set(url, controller);

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          credentials: 'include', // Include credentials for CORS
          mode: 'cors', // Enable CORS
          cache: 'no-cache', // Disable cache for real-time data
          ...options.fetchOptions
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ HTTP error for ${url}! status: ${response.status}, message: ${errorText}`);
          
          // Handle rate limiting specifically
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000; // Default to 5 seconds
            console.log(`⏳ Rate limited, waiting ${waitTime}ms before retrying`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            // Retry the request
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
          }
          
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        
        // Update cache
        cache.set(url, {
          data: result,
          expiry: now + cacheTime,
          timestamp: now
        });
        
        if (isMountedRef.current) {
          newData[url] = result;
        }
      } catch (error) {
        if (error.name !== 'AbortError' && isMountedRef.current) {
          newErrors[url] = error.message || 'Fetch failed';
          console.error(`Error fetching ${url}:`, error);
        }
      } finally {
        abortControllersRef.current.delete(url);
        pendingFetches--;
        
        // Update state once all fetches complete (or fail)
        if (pendingFetches === 0 && isMountedRef.current) {
          setData({...newData});
          setErrors({...newErrors});
          setLoading(false);
        }
      }
    };

    // Start all fetches in parallel
    urls.forEach(url => fetchUrl(url));

    // Cleanup function
    return () => {
      abortControllersRef.current.forEach(controller => {
        controller.abort();
      });
    };
  }, [urlsKey, enabled, cacheTime, staleTime, JSON.stringify(options.fetchOptions)]); // Add fetchOptions to dependencies

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllersRef.current.forEach(controller => controller.abort());
    };
  }, []);

  return { data, loading, errors };
};