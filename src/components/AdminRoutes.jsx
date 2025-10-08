import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

import AdminLoadingLayout from './skeletons/AdminLoadingLayout';
import AdminSidebar from './AdminSidebar';
import AdminBottomNav from './AdminBottomNav';

// Lazy load all admin components with retry functionality and error handling
const loadComponentWithRetry = (componentImport, retries = 2) => {
  return new Promise((resolve, reject) => {
    componentImport()
      .then(resolve)
      .catch((error) => {
        // Retry logic for network failures
        if (retries > 0) {
          setTimeout(() => {
            loadComponentWithRetry(componentImport, retries - 1)
              .then(resolve)
              .catch(reject);
          }, 1500); // 1.5 second delay between retries
        } else {
          reject(error);
        }
      });
  });
};

const AdminDashboard = lazy(() => loadComponentWithRetry(() => import(
  /* webpackChunkName: "admin-dashboard" */
  /* webpackPrefetch: true */
  './AdminDashboard'
)));

const AdminCraftsmen = lazy(() => loadComponentWithRetry(() => import(
  /* webpackChunkName: "admin-craftsmen" */
  './AdminCraftsmen'
)));

const AdminProducts = lazy(() => loadComponentWithRetry(() => import(
  /* webpackChunkName: "admin-products" */
  /* webpackPrefetch: true */
  './AdminProducts'
)));

const AdminOrders = lazy(() => loadComponentWithRetry(() => import(
  /* webpackChunkName: "admin-orders" */
  /* webpackPrefetch: true */
  './AdminOrders'
)));

const ImageOptimization = lazy(() => loadComponentWithRetry(() => import(
  /* webpackChunkName: "admin-image-optimization" */
  './admin/ImageOptimization'
)));

const Base64ConversionPage = lazy(() => loadComponentWithRetry(() => import(
  /* webpackChunkName: "admin-base64-conversion" */
  '../pages/admin/Base64ConversionPage'
)));

const AdminAnalytics = lazy(() => loadComponentWithRetry(() => import(
  /* webpackChunkName: "admin-analytics" */
  './AdminAnalytics'
)));

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center p-6 bg-white shadow-xl rounded-lg max-w-lg">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Xatolik yuz berdi</h2>
        <p className="text-gray-700 mb-6">{error.message || 'Sahifani yuklashda muammo yuzaga keldi'}</p>
        <div className="space-x-4">
          <button 
            onClick={() => {
              resetErrorBoundary();
              navigate('/admin');
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors">
            Bosh sahifaga qaytish
          </button>
          <button 
            onClick={() => {
              resetErrorBoundary();
              window.location.reload();
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors">
            Qayta yuklash
          </button>
        </div>
      </div>
    </div>
  );
};

// Intelligent preloading based on user behavior
const preloadAdminComponents = (section) => {
  switch(section) {
    case 'dashboard':
      import(/* webpackChunkName: "admin-products" */ './AdminProducts');
      import(/* webpackChunkName: "admin-orders" */ './AdminOrders');
      break;
    case 'products':
      import(/* webpackChunkName: "admin-dashboard" */ './AdminDashboard');
      import(/* webpackChunkName: "admin-analytics" */ './AdminAnalytics');
      break;
    case 'orders':
      import(/* webpackChunkName: "admin-dashboard" */ './AdminDashboard');
      import(/* webpackChunkName: "admin-products" */ './AdminProducts');
      break;
    case 'craftsmen':
      import(/* webpackChunkName: "admin-dashboard" */ './AdminDashboard');
      break;
    case 'analytics':
      import(/* webpackChunkName: "admin-orders" */ './AdminOrders');
      break;
    default:
      import(/* webpackChunkName: "admin-dashboard" */ './AdminDashboard');
  }
};

const AdminRoutes = ({ 
  onLogout, 
  isMobileOpen, 
  onMobileToggle, 
  counts,
  craftsmenCount,
  productsCount,
  ordersCount,
  onCraftsmenCountChange,
  onProductsCountChange,
  onOrdersCountChange
}) => {
  // Track loading state
  const [isLoading, setIsLoading] = useState(false);
  
  // Determine active sidebar section from current path
  const location = useLocation();
  const pathname = location.pathname || '';
  let activeSection = 'dashboard';
  if (pathname.startsWith('/admin')) {
    const rest = pathname.slice('/admin'.length); // e.g., "/orders" or ""
    const first = rest.split('/').filter(Boolean)[0];
    activeSection = first || 'dashboard';
  }
  
  // Preload components on first render and when route changes
  useEffect(() => {
    const timer = setTimeout(() => preloadAdminComponents(activeSection), 800);
    return () => clearTimeout(timer);
  }, [activeSection]);

  return (
    <>
      <div className="flex overflow-x-hidden w-full">
        <AdminSidebar
          onLogout={onLogout}
          isMobileOpen={isMobileOpen}
          onMobileToggle={onMobileToggle}
          counts={counts}
          active={activeSection}
        />
        <div className="flex-1 lg:ml-64 pb-16 lg:pb-0 min-h-screen overflow-x-hidden max-w-full">
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={
              <AdminLoadingLayout 
                isLoading={true} 
                message={`${activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} sahifasi yuklanmoqda...`}
              />
            }>
              <Routes>
              <Route 
                path="/" 
                element={
                  <AdminDashboard
                    onMobileToggle={onMobileToggle}
                    craftsmenCount={craftsmenCount}
                    productsCount={productsCount}
                    ordersCount={ordersCount}
                  />
                } 
              />
              <Route 
                path="/craftsmen" 
                element={
                  <AdminCraftsmen
                    onCountChange={onCraftsmenCountChange}
                    onMobileToggle={onMobileToggle}
                  />
                } 
              />
              <Route 
                path="/products" 
                element={
                  <AdminProducts
                    onMobileToggle={onMobileToggle}
                    onCountChange={onProductsCountChange}
                  />
                } 
              />
              <Route 
                path="/orders" 
                element={
                  <AdminOrders
                    onMobileToggle={onMobileToggle}
                    onCountChange={onOrdersCountChange}
                  />
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <AdminAnalytics
                    onMobileToggle={onMobileToggle}
                  />
                } 
              />
              <Route 
                path="/image-optimization" 
                element={
                  <ImageOptimization />
                } 
              />
              <Route 
                path="/base64-conversion" 
                element={
                  <Base64ConversionPage />
                } 
              />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        </div>
      </div>
      <AdminBottomNav counts={counts} />
    </>
  );
};

export default AdminRoutes;