import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import LCPOptimizer from './components/LCPOptimizer';
import './App.css';
import { useStockMonitor } from './hooks/useRealTimeStock'; // Real-time stock monitoring
import { useGlobalStockListener } from './hooks/useGlobalStock'; // Global stock state
import DiagnosticPanel from './components/DiagnosticPanel'; // Diagnostic panel for monitoring
import AdminLoadingLayout from './components/skeletons/AdminLoadingLayout';
import socketService from './services/SocketService';
import useStatistics from './hooks/useStatistics';

const MainPage = lazy(() => import('./components/MainPage'));
const ProductDetailPage = lazy(() => import('./components/ProductDetailPage'));
// Lazy load the entire admin section to keep it out of main bundle
const AdminRoutes = lazy(() => import('./components/AdminRoutes'));

// App content component that uses QueryClient context
function AppContent() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [craftsmenCount, setCraftsmenCount] = useState(0); // Real totals filled from statistics
  const [productsCount, setProductsCount] = useState(0); // Real totals filled from statistics
  const [ordersCount, setOrdersCount] = useState(0); // Real totals filled from statistics
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Authentication state
  const [showDiagnostics, setShowDiagnostics] = useState(false); // Diagnostic panel state

  // Initialize real-time stock monitoring for the entire app (now inside QueryClientProvider)
  const { isConnected, connectionStatus } = useStockMonitor(true); // Enable debug mode
  // Fetch dashboard statistics globally to supply sidebar counts instantly
  const { formattedStats } = useStatistics(true, 300000);
  
  // CRITICAL: Initialize global stock listener for immediate UI updates
  useGlobalStockListener();
  
  // CRITICAL: Expose queryClient to window for debugging and force refresh
  useEffect(() => {
    window.queryClient = queryClient;
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

  // CRITICAL: Initialize Socket.IO for real-time stock updates
  useEffect(() => {
    console.log('🔧 API Base URL:', process.env.REACT_APP_API_BASE);
    console.log('🔧 Socket URL:', process.env.REACT_APP_SOCKET_URL);
    console.log('🔗 Initializing Socket.IO for real-time stock synchronization');
    socketService.initialize();
    
    // Diagnostic panel toggle with keyboard shortcut (Dev only)
    if (process.env.NODE_ENV === 'development') {
      const handleKeyDown = (e) => {
        // Ctrl+Shift+D to toggle diagnostics
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
          e.preventDefault();
          setShowDiagnostics(prev => !prev);
          console.log('🔧 Diagnostic panel toggled:', !showDiagnostics);
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      console.log('🔧 Diagnostic panel available (Ctrl+Shift+D)');
      
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

  const handleLogout = () => {
    setIsAuthenticated(false);
    console.log('Logout clicked');
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
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-lg">Yuklanmoqda...</div></div>}>
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
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Load development-only side effects dynamically so they are not bundled in production
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      Promise.all([
        import('./utils/browserStockSync'),
        import('./utils/forceRefresh'),
        import('./utils/stockUpdateDebugger'),
        import('./utils/stockNotification'),
        import('./testOptimisticUpdates'),
      ]).catch(() => {
        // Swallow errors in dev helpers to avoid breaking the app
      });
    }
  }, []);

  // CRITICAL: Initialize Socket.IO for real-time stock updates
  useEffect(() => {
    console.log('🔧 API Base URL:', process.env.REACT_APP_API_BASE);
    console.log('🔧 Socket URL:', process.env.REACT_APP_SOCKET_URL);
    console.log('🔗 Initializing Socket.IO for real-time stock synchronization');
    socketService.initialize();
    
    // Diagnostic panel toggle with keyboard shortcut (Dev only)
    if (process.env.NODE_ENV === 'development') {
      const handleKeyDown = (e) => {
        // Ctrl+Shift+D to toggle diagnostics
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
          e.preventDefault();
          setShowDiagnostics(prev => !prev);
          console.log('🔧 Diagnostic panel toggled:', !showDiagnostics);
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      console.log('🔧 Diagnostic panel available (Ctrl+Shift+D)');
      
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
      
      {/* CRITICAL: Real-time Diagnostic Panel (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <DiagnosticPanel 
          isVisible={showDiagnostics} 
          onToggle={() => setShowDiagnostics(!showDiagnostics)} 
        />
      )}
    </QueryClientProvider>
  );
}

export default App;