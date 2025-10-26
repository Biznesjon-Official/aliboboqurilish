// Service Worker for image caching and offline support
const CACHE_NAME = 'alibobo-images-v2';
const API_CACHE_NAME = 'alibobo-api-v2';
const STATIC_CACHE_NAME = 'alibobo-static-v2';

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// URLs to cache
const STATIC_ASSETS = [
  '/',
  '/assets/default-product.svg',
  '/manifest.json'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/products',
  '/api/craftsmen',
  '/api/statistics'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      }),
      self.skipWaiting()
    ])
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== API_CACHE_NAME && 
                cacheName !== STATIC_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - handle requests with different strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/uploads/')) {
    // Images: Cache first with long TTL
    event.respondWith(handleImageRequest(request));
  } else if (url.pathname.startsWith('/api/')) {
    // API: Network first with short TTL
    event.respondWith(handleApiRequest(request));
  } else if (url.pathname.startsWith('/static/')) {
    // Static assets: Cache first
    event.respondWith(handleStaticRequest(request));
  } else {
    // HTML pages: Network first
    event.respondWith(handlePageRequest(request));
  }
});

// Image caching strategy - Cache first with WebP optimization
async function handleImageRequest(request) {
  const url = new URL(request.url);
  
  // Check if browser supports WebP
  const acceptsWebP = request.headers.get('accept')?.includes('image/webp');
  
  // Modify URL for WebP if supported
  let cacheKey = request.url;
  if (acceptsWebP && !url.searchParams.has('format')) {
    url.searchParams.set('format', 'webp');
    cacheKey = url.toString();
  }

  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try cache first
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      // Check if cache is still fresh (7 days)
      const cacheDate = new Date(cachedResponse.headers.get('date'));
      const now = new Date();
      const daysSinceCached = (now - cacheDate) / (1000 * 60 * 60 * 24);
      
      if (daysSinceCached < 7) {
        return cachedResponse;
      }
    }

    // Fetch from network
    const networkResponse = await fetch(acceptsWebP ? url.toString() : request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const responseToCache = networkResponse.clone();
      await cache.put(cacheKey, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Image fetch failed, trying cache:', error);
    
    // Fallback to cache if network fails
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return default image if all else fails
    return fetch('/assets/default-product.svg');
  }
}

// API caching strategy - Network first with short TTL
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses for 5 minutes
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-at', new Date().toISOString());
      
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      await cache.put(request, cachedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('API fetch failed, trying cache:', error);
    
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // Check if cache is still fresh (5 minutes)
      const cacheDate = new Date(cachedResponse.headers.get('sw-cached-at'));
      const now = new Date();
      const minutesSinceCached = (now - cacheDate) / (1000 * 60);
      
      if (minutesSinceCached < 5) {
        return cachedResponse;
      }
    }
    
    // Return error response if no cache available
    return new Response(JSON.stringify({ error: 'Network unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Static assets caching strategy - Cache first
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Static asset fetch failed:', error);
    return new Response('Asset not available', { status: 404 });
  }
}

// Page caching strategy - Network first
async function handlePageRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Fallback to cache for offline support
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match('/');
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Offline - Page not available', { 
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background sync logic here
  console.log('Background sync triggered');
}

// Push notifications (if needed in future)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/assets/alibobo-logo.png',
        badge: '/assets/alibobo-logo.png',
        data: data.url
      })
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data) {
    event.waitUntil(
      clients.openWindow(event.notification.data)
    );
  }
});
