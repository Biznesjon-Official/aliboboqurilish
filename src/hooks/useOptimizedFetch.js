import { useState, useEffect, useRef } from 'react';

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

  // Generate a stable dependency key from urls
  const urlsKey = urls ? urls.join(',') : '';

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

      // Create new abort controller for this URL
      const controller = new AbortController();
      abortControllersRef.current.set(url, controller);

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          ...options.fetchOptions
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
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
  }, [urlsKey, enabled, cacheTime, staleTime, options.fetchOptions]);

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