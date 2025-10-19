import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

import AdminLoadingLayout from './skeletons/AdminLoadingLayout';
import AdminSidebar from './AdminSidebar';
import AdminBottomNav from './AdminBottomNav';

// Simplified lazy loading without retry delays
const loadComponentWithRetry = (componentImport) => {
  return componentImport();
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

const AdminPromotions = lazy(() => loadComponentWithRetry(() => import(
  /* webpackChunkName: "admin-promotions" */
  './admin/AdminPromotions'
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
  
  // Preload components immediately when route changes
  useEffect(() => {
    preloadAdminComponents(activeSection);
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
              <div className="page-transition-container">
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
              <Route 
                path="/promotions" 
                element={
                  <AdminPromotions />
                } 
              />
                </Routes>
              </div>
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
      <AdminBottomNav counts={counts} />
      
      {/* Smooth Navigation Transitions */}
      <style>{`
        /* Page transition container */
        .page-transition-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        /* Smooth fade-in animation for page content */
        .page-transition-container > div {
          animation: fadeInSlide 0.4s ease-out forwards;
          opacity: 0;
          transform: translateY(10px);
        }
        
        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Smooth transitions for sidebar items */
        .sidebar-item {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .sidebar-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          transition: left 0.5s;
        }
        
        .sidebar-item:hover::before {
          left: 100%;
        }
        
        .sidebar-item:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(246, 134, 34, 0.2);
        }
        
        .sidebar-item.active {
          transform: translateX(0);
          box-shadow: 0 4px 20px rgba(246, 134, 34, 0.3);
        }
        
        /* Smooth mobile sidebar transitions */
        .sidebar-mobile-overlay {
          transition: opacity 0.3s ease-in-out;
        }
        
        /* Loading animation improvements */
        .admin-loading-skeleton {
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        
        /* Smooth scroll behavior */
        html {
          scroll-behavior: smooth;
        }
        
        /* Card hover effects */
        .admin-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .admin-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        
        /* Button transitions */
        .admin-button {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .admin-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .admin-button:active {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        /* Modal transitions */
        .modal-overlay {
          animation: fadeIn 0.3s ease-out;
        }
        
        .modal-content {
          animation: slideInUp 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        /* Notification animations */
        .notification-enter {
          animation: slideInFromRight 0.4s ease-out;
        }
        
        .notification-exit {
          animation: slideOutToRight 0.3s ease-in;
        }
        
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideOutToRight {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }
        
        /* Table row hover effects */
        .table-row {
          transition: all 0.2s ease-in-out;
        }
        
        .table-row:hover {
          background-color: rgba(246, 134, 34, 0.05);
          transform: scale(1.01);
        }
        
        /* Form input focus effects */
        .form-input {
          transition: all 0.3s ease-in-out;
        }
        
        .form-input:focus {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(246, 134, 34, 0.2);
        }
        
        /* Loading spinner improvements */
        .loading-spinner {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Reduce motion for users who prefer it */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </>
  );
};

export default AdminRoutes;