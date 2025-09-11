import React, { useState, useCallback, useEffect, useMemo } from 'react';
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

const MainPage = ({ onSuccessfulLogin }) => {
  const [craftsmenData, setCraftsmenData] = useState([]);

  // Initialize intelligent preloading hooks
  const { preloadOnHover, preloadNow } = useIntelligentPreloading('user');
  useUserBehaviorPreloading();
  useNetworkAwarePreloading();
  useViewportPreloading();


  // Cart states - centralized here
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Catalog and search states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Active section state for bottom navigation
  const [activeSection, setActiveSection] = useState('products');

  // Parallel data loading for initial page load - Ultra-optimized for speed
  const API_BASE = process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'production' ? 'https://aliboboqurilish.uz/api' : 'http://localhost:5001/api');
  
  console.log(`🔧 API Base URL in MainPage: ${API_BASE}`);
  
  // Memoize URLs to prevent unnecessary re-renders
  const urls = useMemo(() => [
    `${API_BASE}/craftsmen?limit=20&status=active`,
    `${API_BASE}/products/fast?limit=20&page=1`
  ], [API_BASE]);

  const { data: parallelData, loading: parallelLoading, errors } = useParallelFetch(urls, { 
    fetchOptions: { cache: 'no-store' },
    // Add enabled flag to prevent fetching when not needed
    enabled: true
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

  // Optimized callback for ProductsGrid
  const handleInitialProductsLoaded = useCallback(() => {
    // Products are already loaded via parallel fetch, no need for additional call
  }, []);

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
        />
      </div>
      <Services />
      <Footer />
    </>
  );
};

export default MainPage;