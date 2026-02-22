import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import LCPOptimizer from './components/LCPOptimizer';
import './App.css';
import { useStockMonitor } from './hooks/useRealTimeStock'; // Real-time stock monitoring
import { useGlobalStockListener } from './hooks/useGlobalStock'; // Global stock state
// Removed DiagnosticPanel for cleaner code
import AdminLoadingLayout from './components/skeletons/AdminLoadingLayout';
import socketService from './services/SocketService';
import useStatistics from './hooks/useStatistics';
import * as serviceWorker from './utils/serviceWorker';

// Preload MainPage for faster initial load
const MainPage = lazy(() => 
  import('./components/MainPage').then(module => {
    // Preload ProductDetailPage in background
    import('./components/ProductDetailPage');
    return module;
  })
);
const ProductDetailPage = lazy(() => import('./components/ProductDetailPage'));
// Lazy load the entire admin section to keep it out of main bundle
const AdminRoutes = lazy(() => import('./components/AdminRoutes'));
const TestProductUpdate = lazy(() => import('./components/TestProductUpdate'));

// App content component that uses QueryClient context
function AppContent() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [craftsmenCount, setCraftsmenCount] = useState(0); // Real totals filled from statistics
  const [productsCount, setProductsCount] = useState(0); // Real totals filled from statistics
  const [ordersCount, setOrdersCount] = useState(0); // Real totals filled from statistics
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Authentication state
  // Local diagnostics state removed from AppContent (use App-level panel instead)

  // Initialize real-time stock monitoring for the entire app (now inside QueryClientProvider)
  const { isConnected, connectionStatus } = useStockMonitor(true); // Enable debug mode
  // Fetch dashboard statistics globally to supply sidebar counts instantly
  const { formattedStats } = useStatistics(true, 300000);
  
  // CRITICAL: Initialize global stock listener for immediate UI updates
  useGlobalStockListener();
  
  // CRITICAL: Expose queryClient to window for debugging and force refresh
  useEffect(() => {
    window.queryClient = queryClient;
    
    // PRELOAD: Start fetching products immediately for instant display
    queryClient.prefetchQuery({
      queryKey: ['fast-products', '', ''],
      queryFn: async () => {
        const API_BASE = process.env.REACT_APP_API_BASE || 
          (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api');
        
        const response = await fetch(`${API_BASE}/products/fast?limit=8&page=1&sortBy=updatedAt&sortOrder=desc&includeImages=true`, {
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
    
    return () => {
      delete window.queryClient;
    };
  }, []);

  // Update sidebar counts whenever dashboard statistics are fetched/refreshed
  useEffect(() => {
    if (formattedStats) {
      setCraftsmenCount(formattedStats.craftsmenCount || 0);
      setProductsCount(formattedStats.productsCount || 0);
      setOrdersCount(formattedStats.ordersCount || 0);
    }
  }, [formattedStats]);

  // Removed duplicate socket initialization from AppContent to avoid double init

  const handleLogout = () => {
    setIsAuthenticated(false);
    if ((process.env.REACT_APP_DEBUG_MODE || '').toLowerCase() === 'true') {
      console.log('Logout clicked');
    }
  };

  const handleCraftsmenCountChange = useCallback((count) => {
    setCraftsmenCount(count);
  }, []);

  const handleProductsCountChange = useCallback((count) => {
    setProductsCount(count);
  }, []);

  const handleOrdersCountChange = useCallback((count) => {
    setOrdersCount(count);
  }, []);

  const handleMobileToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  // Handle successful login from Header component
  const handleSuccessfulLogin = () => {
    setIsAuthenticated(true);
  };

  // Protected Route Component
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        <Route path="/" element={
          <Suspense >
            <MainPage onSuccessfulLogin={handleSuccessfulLogin} />
          </Suspense>
        } />
        <Route path="/product/:id" element={
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-lg">Mahsulot yuklanmoqda...</div></div>}>
            <ProductDetailPage />
          </Suspense>
        } />
        <Route path="/products" element={
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-lg">Yuklanmoqda...</div></div>}>
            <MainPage onSuccessfulLogin={handleSuccessfulLogin} initialSection="products" />
          </Suspense>
        } />
        <Route path="/craftsmen" element={
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-lg">Yuklanmoqda...</div></div>}>
            <MainPage onSuccessfulLogin={handleSuccessfulLogin} initialSection="craftsmen" />
          </Suspense>
        } />
        <Route path="/test-product-update" element={
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-lg">Test sahifasi yuklanmoqda...</div></div>}>
            <TestProductUpdate />
          </Suspense>
        } />
        <Route path="/admin/*" element={
          <ProtectedRoute>
            <Suspense fallback={<AdminLoadingLayout />}>
              <AdminRoutes
                onLogout={handleLogout}
                isMobileOpen={isMobileSidebarOpen}
                onMobileToggle={handleMobileToggle}
                counts={{ craftsmenCount, productsCount, ordersCount }}
                craftsmenCount={craftsmenCount}
                productsCount={productsCount}
                ordersCount={ordersCount}
                onCraftsmenCountChange={handleCraftsmenCountChange}
                onProductsCountChange={handleProductsCountChange}
                onOrdersCountChange={handleOrdersCountChange}
              />
            </Suspense>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

// Main App component with QueryClientProvider
function App() {

  // CRITICAL: Initialize Socket.IO for real-time stock updates
  useEffect(() => {
    const DEBUG = (process.env.REACT_APP_DEBUG_MODE || '').toLowerCase() === 'true';
    if (DEBUG) {
      console.log('🔧 Socket URL:', process.env.REACT_APP_SOCKET_URL);
      console.log('🔗 Initializing Socket.IO for real-time stock synchronization');
    }
    socketService.initialize();
    
    // Register Service Worker for image caching and offline support
    if (process.env.NODE_ENV === 'production') {
      serviceWorker.register({
        onSuccess: () => {
          if (DEBUG) console.log('🔧 Service Worker registered successfully');
        },
        onUpdate: () => {
          if (DEBUG) console.log('🔧 New content available, refresh to update');
        }
      });
    }
    
    // Diagnostic panel toggle with keyboard shortcut (Dev only)
    if (process.env.NODE_ENV === 'development') {
      const handleKeyDown = (e) => {
        // Ctrl+Shift+D to toggle diagnostics
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
          e.preventDefault();
          // setShowDiagnostics(prev => !prev); // Removed - diagnostics panel not implemented
          if (DEBUG) console.log('🔧 Diagnostic panel toggled');
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      if (DEBUG) console.log('🔧 Diagnostic panel available (Ctrl+Shift+D)');
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        socketService.disconnect();
      };
    }
    
    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LCPOptimizer />
      <AppContent />
      
      {/* Removed DiagnosticPanel */}
    </QueryClientProvider>
  );
}

export default App;