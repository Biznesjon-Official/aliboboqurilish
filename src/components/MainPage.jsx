import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import ProductsGrid from './ProductsGrid';
import Craftsmen from './Craftsmen';
import Services from './Services';
import Footer from './Footer';
import { useParallelFetch } from '../hooks/useOptimizedFetch';
import { 
  useIntelligentPreloading, 
  useUserBehaviorPreloading, 
  useNetworkAwarePreloading,
  useViewportPreloading 
} from '../hooks/useIntelligentPreloading';

const MainPage = ({ onSuccessfulLogin, initialSection }) => {
  const [craftsmenData, setCraftsmenData] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize intelligent preloading hooks
  const { preloadOnHover, preloadNow } = useIntelligentPreloading('user');
  useUserBehaviorPreloading();
  useNetworkAwarePreloading();
  useViewportPreloading();


  // Cart states - centralized here (initialize from localStorage synchronously)
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('cartItems');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Hydrate cart from localStorage (so ProductDetailPage can add while home is not mounted)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cartItems');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setCart(parsed);
      }
    } catch (_) {}
  }, []);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('cartItems', JSON.stringify(cart));
    } catch (_) {}
  }, [cart]);

  // Re-hydrate cart when window regains focus or page is shown from bfcache
  useEffect(() => {
    const rehydrate = () => {
      try {
        const saved = localStorage.getItem('cartItems');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setCart(parsed);
        }
      } catch (_) {}
    };
    window.addEventListener('focus', rehydrate);
    window.addEventListener('pageshow', rehydrate);
    const onStorage = (e) => {
      if (e.key === 'cartItems') {
        rehydrate();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('focus', rehydrate);
      window.removeEventListener('pageshow', rehydrate);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Catalog and search states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [initialCraftsmanSpecialty, setInitialCraftsmanSpecialty] = useState('');
  
  // Active section state for bottom navigation
  const [activeSection, setActiveSection] = useState('products');

  // Parallel data loading for initial page load - Ultra-optimized for speed
  const API_BASE = process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'production' ? 'https://aliboboqurilish.uz/api' : 'http://localhost:5000/api');
  const USE_FAST = (process.env.REACT_APP_USE_FAST || '').toLowerCase() === 'true';
  
  console.log(`🔧 API Base URL in MainPage: ${API_BASE}`);
  
  // Memoize URLs to prevent unnecessary re-renders
  const urls = useMemo(() => {
    const productsUrl = USE_FAST
      ? `${API_BASE}/products/fast?limit=8&page=1&includeImages=true`
      : `${API_BASE}/products?limit=8&page=1&sortBy=updatedAt&sortOrder=desc&includeImages=true`;
    return [
      `${API_BASE}/craftsmen?limit=8&status=active`,
      productsUrl
    ];
  }, [API_BASE, USE_FAST]);

  const { data: parallelData, loading: parallelLoading, errors } = useParallelFetch(urls, { 
    fetchOptions: { 
      cache: 'force-cache',
      priority: 'high'
    },
    enabled: true,
    staleTime: 30000 // 30 seconds cache
  });

  // Log any errors
  useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      console.error('❌ Parallel fetch errors:', errors);
    }
  }, [errors]);

  // Update craftsmen data when parallel fetch completes
  useEffect(() => {
    if (parallelData[urls[0]]) {
      const craftsmenResponse = parallelData[urls[0]];
      console.log('🔧 Craftsmen data received:', craftsmenResponse);
      setCraftsmenData(craftsmenResponse.craftsmen || []);
    }
  }, [parallelData, urls]);

  // Helper: restore scroll to saved Y or specific product card
  const restoreScrollFromSession = useCallback(() => {
    // Restore saved Y position first
    try {
      const y = sessionStorage.getItem('homeScroll');
      if (y !== null) {
        const pos = parseInt(y, 10) || 0;
        window.scrollTo({ top: pos, behavior: 'auto' });
        // Do not remove yet; keep as fallback until product card focus succeeds
      }
    } catch (e) {}

    // Then, if product id is present, try to focus that card for up to ~8s
    let attempts = 0;
    const maxAttempts = 80;
    const intervalId = setInterval(() => {
      attempts++;
      try {
        const pid = sessionStorage.getItem('scrollToProductId');
        if (!pid) {
          // If no product id, we are done; clear homeScroll now
          sessionStorage.removeItem('homeScroll');
          clearInterval(intervalId);
          return;
        }
        const el = document.getElementById(`product-${pid}`);
        if (el) {
          el.scrollIntoView({ behavior: 'auto', block: 'center' });
          sessionStorage.removeItem('scrollToProductId');
          sessionStorage.removeItem('homeScroll');
          clearInterval(intervalId);
        } else if (attempts >= maxAttempts) {
          // Give up after waiting enough; clear keys
          sessionStorage.removeItem('scrollToProductId');
          sessionStorage.removeItem('homeScroll');
          clearInterval(intervalId);
        }
      } catch (e) {
        clearInterval(intervalId);
      }
    }, 100);
  }, []);

  // Optimized callback for ProductsGrid: ensure restore after data render
  const handleInitialProductsLoaded = useCallback(() => {
    restoreScrollFromSession();
  }, [restoreScrollFromSession]);

  // Scroll to initial section if this page is loaded via /products or /craftsmen
  useEffect(() => {
    if (!initialSection) return;
    const targetId = initialSection === 'craftsmen' ? 'craftsmen' : initialSection === 'products' ? 'products' : '';
    if (!targetId) return;

    const tryScroll = () => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
      }
      return false;
    };

    if (!tryScroll()) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (tryScroll() || attempts > 60) {
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [initialSection]);

  // Initialize filters from URL params when landing on /products or /craftsmen routes
  useEffect(() => {
    try {
      const path = location.pathname;
      const params = new URLSearchParams(location.search || '');
      if (path === '/products') {
        const category = params.get('category') || '';
        if (category) setSelectedCategory(category);
      } else if (path === '/craftsmen') {
        const spec = params.get('specialty') || '';
        if (spec) setInitialCraftsmanSpecialty(decodeURIComponent(spec));
      }
    } catch (_) {}
  }, [location.pathname, location.search]);

  // Memoized cart functions for performance
  const addToCart = useCallback((product) => {
    // Use cartId for variants, otherwise use regular id
    const productIdentifier = product.cartId || product._id || product.id;
    
    setCart(prevCart => {
      const existingItem = prevCart.find(item => {
        const itemIdentifier = item.cartId || item._id || item.id;
        return itemIdentifier === productIdentifier;
      });

      if (existingItem) {
        return prevCart.map(item => {
          const itemIdentifier = item.cartId || item._id || item.id;
          return itemIdentifier === productIdentifier
            ? { ...item, quantity: item.quantity + (product.quantity || 1) }
            : item;
        });
      } else {
        const productToAdd = {
          ...product,
          id: productIdentifier,
          quantity: product.quantity || 1
        };
        return [...prevCart, productToAdd];
      }
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart(prev => prev.filter(item => {
      const itemIdentifier = item.cartId || item._id || item.id;
      return itemIdentifier !== productId;
    }));
  }, []);

  const updateCartQuantity = useCallback((productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(prev => prev.map(item => {
        const itemIdentifier = item.cartId || item._id || item.id;
        return itemIdentifier === productId
          ? { ...item, quantity: newQuantity }
          : item;
      }));
    }
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Accept add-to-cart requests coming from ProductDetailPage via navigation state
  useEffect(() => {
    const state = location.state || {};
    let handled = false;
    if (state.addToCart) {
      addToCart(state.addToCart);
      handled = true;
    }
    if (state.openCart) {
      setIsCartOpen(true);
      handled = true;
    }
    if (handled) {
      // Clear navigation state to prevent duplicates
      navigate(location.pathname + location.hash, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Also support legacy global event from detail page without navigation
  useEffect(() => {
    const onAddToCartEvent = (e) => {
      const item = e && e.detail;
      if (item) addToCart(item);
    };
    window.addEventListener('addToCart', onAddToCartEvent);
    return () => window.removeEventListener('addToCart', onAddToCartEvent);
  }, [addToCart]);

  // Consume a pending add-to-cart payload saved in sessionStorage by ProductDetailPage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('pendingAddToCart');
      if (raw) {
        const item = JSON.parse(raw);
        if (item) addToCart(item);
        sessionStorage.removeItem('pendingAddToCart');
      }
    } catch (_) {}
  }, [location.pathname, addToCart]);

  // Restore scroll when returning to home ('/')
  useEffect(() => {
    if (location.pathname !== '/') return;
    // If detail page passed a product id in navigation state, use it
    const pidFromState = location.state && location.state.restoreProductId;
    if (pidFromState) {
      try { sessionStorage.setItem('scrollToProductId', String(pidFromState)); } catch (e) {}
    }
    restoreScrollFromSession();
  }, [location.pathname]);

  const toggleCart = useCallback(() => {
    setIsCartOpen(prev => !prev);
  }, []);

  const getTotalItems = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Memoized catalog functions
  const handleCategorySelect = useCallback((category) => {
    setSelectedCategory(category);
    console.log('📂 Selected category in MainPage:', category);
  }, []);

  const handleSearch = useCallback((query) => {
    const q = (query || '').trim();
    setSearchQuery(q);
    // Reset category filter so search shows across all products
    setSelectedCategory('');
    // Scroll to products section for immediate feedback
    const productsEl = document.getElementById('products');
    if (productsEl) {
      productsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <>
      <Header
        onSuccessfulLogin={onSuccessfulLogin}
        cart={cart}
        isCartOpen={isCartOpen}
        onToggleCart={toggleCart}
        onRemoveFromCart={removeFromCart}
        onUpdateQuantity={updateCartQuantity}
        onCheckout={clearCart}
        getTotalItems={getTotalItems}
        onCategorySelect={handleCategorySelect}
        selectedCategory={selectedCategory}
        onSearch={handleSearch}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      <div id="products">
        <ProductsGrid
          cart={cart}
          onAddToCart={addToCart}
          onToggleCart={toggleCart}
          onRemoveFromCart={removeFromCart}
          onUpdateQuantity={updateCartQuantity}
          onCheckout={clearCart}
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          onInitialProductsLoaded={handleInitialProductsLoaded}
          onCategorySelect={handleCategorySelect}
          onSearch={handleSearch}
        />
      </div>
      <div id="craftsmen">
        <Craftsmen
          craftsmenData={craftsmenData}
          loading={parallelLoading || !parallelData[urls[0]]}
          initialSpecialty={initialCraftsmanSpecialty}
        />
      </div>
      <Services />
      <Footer />
    </>
  );
};

export default MainPage;