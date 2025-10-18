import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import debounce from 'lodash/debounce';
import { useQueryClient } from '@tanstack/react-query';
import Chart from 'chart.js/auto';
import AdminNotificationBell from './AdminNotificationBell';
import { BarsFAIcon, InfoCircleFAIcon, CheckCircleFAIcon, TimesFAIcon, TimesCircleFAIcon } from './FontAwesome';

import useRealNotifications from '../hooks/useRealNotifications';
import { queryKeys } from '../lib/queryClient';

// Using React.memo to prevent unnecessary re-renders of the entire component
const AdminAnalytics = ({ onMobileToggle, notifications, setNotifications }) => {
  // Real notification system for notification bell
  const {
    notifications: realNotifications,
    setNotifications: setRealNotifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
    deleteNotification,
    deleteAllNotifications
  } = useRealNotifications(true, 30000);
  const [selectedMonth, setSelectedMonth] = useState(11); // December 2024
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({});
  
  // Refs for chart instances to prevent memory leaks
  const salesChartRef = useRef(null);
  const salesChartInstance = useRef(null);
  const chartsRef = useRef([]);
  
  // Create debounced setter for performance
  const debouncedSetSelectedMonth = useCallback(
    debounce((month) => setSelectedMonth(month), 300),
    []
  );
  
  // Access query client for cache management
  const queryClient = useQueryClient();

  // Prefetch related data on component mount
  useEffect(() => {
    // Prefetch current month's statistics to reduce perceived load time
    if (selectedMonth !== null) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.statistics.dashboard(),
        staleTime: 5 * 60 * 1000 // 5 minutes
      });
    }
    
    // Cleanup chart instances to prevent memory leaks
    return () => {
      if (salesChartInstance.current) {
        salesChartInstance.current.destroy();
      }
      
      // Clean up any other chart instances
      chartsRef.current.forEach(chart => {
        if (chart) chart.destroy();
      });
    };
  }, [selectedMonth, queryClient]);

  // Sample data for analytics
  const analyticsData = {
    craftsmen: [
      { id: 1, name: "Ahmad Karimov", completedWorks: 45, rating: 4.9 },
      { id: 2, name: "Odil Saidov", completedWorks: 38, rating: 4.8 },
      { id: 3, name: "Bobur Toshmatov", completedWorks: 52, rating: 4.7 },
      { id: 4, name: "Sardor Abdullayev", completedWorks: 29, rating: 4.6 },
      { id: 5, name: "Jasur Komilov", completedWorks: 33, rating: 4.8 }
    ],
    products: [
      { id: 1, name: "Qizil g'isht M100", sold: 850, price: 450 },
      { id: 2, name: "Oq sement M400", sold: 320, price: 35000 },
      { id: 3, name: "Elektr kabeli", sold: 423, price: 8000 },
      { id: 4, name: "Metalloprokat", sold: 234, price: 12000 },
      { id: 5, name: "LED lampa 15W", sold: 156, price: 25000 }
    ],
    categories: [
      { name: "G'isht va bloklar", percentage: 35, amount: 15700000 },
      { name: "Asbob-uskunalar", percentage: 25, amount: 11200000 },
      { name: "Bo'yoq va lak", percentage: 20, amount: 8950000 },
      { name: "Elektr mollalari", percentage: 12, amount: 5380000 },
      { name: "Boshqalar", percentage: 8, amount: 3580000 }
    ]
  };

  // Monthly data for different months
  const monthlyData = {
    revenue: [3200000, 3800000, 4100000, 3900000, 4500000, 4200000, 4800000, 5100000, 4900000, 5300000, 5000000, 5500000],
    orders: [850, 920, 1050, 980, 1150, 1080, 1200, 1300, 1250, 1350, 1280, 1400],
    orderStatus: [
      {pending: 15, processing: 20, completed: 40, cancelled: 8}, // Yanvar
      {pending: 18, processing: 22, completed: 42, cancelled: 9}, // Fevral
      {pending: 22, processing: 25, completed: 45, cancelled: 10}, // Mart
      {pending: 20, processing: 24, completed: 43, cancelled: 9}, // Aprel
      {pending: 25, processing: 28, completed: 48, cancelled: 12}, // May
      {pending: 23, processing: 26, completed: 46, cancelled: 11}, // Iyun
      {pending: 28, processing: 30, completed: 50, cancelled: 13}, // Iyul
      {pending: 30, processing: 32, completed: 52, cancelled: 14}, // Avgust
      {pending: 28, processing: 31, completed: 51, cancelled: 13}, // Sentyabr
      {pending: 32, processing: 34, completed: 54, cancelled: 15}, // Oktyabr
      {pending: 30, processing: 33, completed: 53, cancelled: 14}, // Noyabr
      {pending: 35, processing: 36, completed: 56, cancelled: 16}  // Dekabr
    ]
  };

  // Get monthly stats for the selected month
  const monthlyStats = useMemo(() => {
    return selectedMonth !== null ? {
      revenue: monthlyData.revenue[selectedMonth],
      orders: monthlyData.orders[selectedMonth],
      orderStatus: monthlyData.orderStatus[selectedMonth]
    } : null;
  }, [selectedMonth, monthlyData]);

  // Memoized formatters
  const formatCurrency = useMemo(() => {
    return (amount) => new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  }, []);

  // Create memoized components for better performance
  // Memoize SummaryCards component
  const SummaryCards = useMemo(() => {
    if (!monthlyStats) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Umumiy statistika</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Buyurtmalar soni:</span>
              <span className="font-semibold">{monthlyStats.orders}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Umumiy tushum:</span>
              <span className="font-semibold">{formatCurrency(monthlyStats.revenue)}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Buyurtmalar holati</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-yellow-600">Kutilmoqda:</span>
              <span className="font-semibold">{monthlyStats.orderStatus.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-orange-600">Jarayonda:</span>
              <span className="font-semibold">{monthlyStats.orderStatus.processing}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-600">Bajarilgan:</span>
              <span className="font-semibold">{monthlyStats.orderStatus.completed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-red-600">Bekor qilingan:</span>
              <span className="font-semibold">{monthlyStats.orderStatus.cancelled}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }, [monthlyStats, formatCurrency]);
  
  // Memoize OrdersStatusReport component
  const OrdersStatusReport = useMemo(() => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Buyurtmalar holati hisoboti</h3>
        <div className="h-64">
          <canvas ref={salesChartRef} width="400" height="200"></canvas>
        </div>
      </div>
    );
  }, []);
  
  // Utility functions
  const showNotification = useCallback((message, type = 'info') => {
    const container = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    container.className = `fixed bottom-4 left-1/2 transform -translate-x-1/2 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg z-50 transition-all duration-300 max-w-sm w-full mx-4 sm:w-auto sm:mx-0 opacity-0 translate-y-4`;

    document.body.appendChild(container);
    const root = ReactDOM.createRoot(container);

    const Toast = ({ message, type, onClose }) => {
      const Icon = type === 'success' ? CheckCircleFAIcon : type === 'error' ? TimesCircleFAIcon : InfoCircleFAIcon;
      return (
        <div className="flex items-center justify-center space-x-3">
          <Icon className="text-lg" />
          <span className="text-sm font-medium text-center flex-1">{message}</span>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors" aria-label="Yopish">
            <TimesFAIcon className="text-sm" />
          </button>
        </div>
      );
    };

    const unmount = () => {
      try {
        root.unmount();
      } catch {}
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    };

    const handleClose = () => {
      // Animate out then remove
      container.classList.add('opacity-0', 'translate-y-4');
      setTimeout(unmount, 250);
    };

    root.render(<Toast message={message} type={type} onClose={handleClose} />);

    // Animate in
    setTimeout(() => {
      container.classList.remove('opacity-0', 'translate-y-4');
    }, 20);

    // Auto close
    setTimeout(handleClose, 4000);
  }, []);

  const showConfirm = useCallback((title, message, onConfirm, onCancel = null, type = 'warning') => {
    setConfirmConfig({
      title,
      message,
      type,
      onConfirm,
      onCancel
    });
    setShowConfirmModal(true);
  }, []);

  const hideConfirm = useCallback(() => {
    setShowConfirmModal(false);
    setConfirmConfig({});
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmConfig.onConfirm) {
      confirmConfig.onConfirm();
    }
    hideConfirm();
  }, [confirmConfig, hideConfirm]);

  const handleCancel = useCallback(() => {
    if (confirmConfig.onCancel) {
      confirmConfig.onCancel();
    }
    hideConfirm();
  }, [confirmConfig, hideConfirm]);

  // Create charts with memoized chart creation
  const createCharts = useCallback(() => {
    // Only create chart if it doesn't exist or has been destroyed
    if (salesChartRef.current) {
      // Clean up previous chart instance if it exists
      if (salesChartInstance.current) {
        salesChartInstance.current.destroy();
        salesChartInstance.current = null;
      }
      
      // Find index in chartsRef and remove if it exists
      const chartIndex = chartsRef.current.findIndex(chart => chart === salesChartInstance.current);
      if (chartIndex > -1) {
        chartsRef.current.splice(chartIndex, 1);
      }
      
      const orderStatus = monthlyData.orderStatus[selectedMonth];
      
      const ctx = salesChartRef.current.getContext('2d');
      salesChartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Kutilmoqda', 'Jarayonda', 'Bajarilgan', 'Bekor qilingan'],
          datasets: [{
            data: [orderStatus.pending, orderStatus.processing, orderStatus.completed, orderStatus.cancelled],
            backgroundColor: [
              'rgba(255, 206, 86, 0.7)',
              'rgba(255, 159, 64, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(255, 99, 132, 0.7)'
            ],
            borderColor: [
              'rgba(255, 206, 86, 1)',
              'rgba(255, 159, 64, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(255, 99, 132, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              // Use callback to improve tooltip performance
              callbacks: {
                label: function(context) {
                  const value = context.raw;
                  const percentage = ((value / (orderStatus.pending + orderStatus.processing + orderStatus.completed + orderStatus.cancelled)) * 100).toFixed(1);
                  return `${context.label}: ${value} (${percentage}%)`;
                }
              }
            }
          },
          animation: {
            duration: 800, // Reduced animation duration for better performance
            easing: 'easeOutQuart' // More efficient easing function
          },
          layout: {
            padding: 20
          },
          // Disable hover animations for better performance
          hover: {
            animationDuration: 0
          },
          // Optimize responsiveness
          resizeDelay: 100
        }
      });
      
      // Keep track of all charts to properly destroy them later
      chartsRef.current.push(salesChartInstance.current);
    }
  }, [selectedMonth, monthlyData]);

  // Load analytics data - now memoized
  const loadAnalytics = useCallback(() => {
    // All data fetching is now memoized
    createCharts();
  }, [createCharts]);
  
  // Add useEffect to recreate charts when selectedMonth changes
  useEffect(() => {
    createCharts();
    // No need to call loadAnalytics again since createCharts is what needs to be updated
  }, [selectedMonth, createCharts]);
  
  // Initial load of analytics data
  useEffect(() => {
    loadAnalytics();
    // Clean up function to destroy charts on unmount
    return () => {
      if (salesChartInstance.current) {
        salesChartInstance.current.destroy();
        salesChartInstance.current = null;
      }
      
      // Clean up all chart instances
      chartsRef.current.forEach(chart => {
        if (chart) {
          chart.destroy();
        }
      });
      chartsRef.current = [];
    };
  }, [loadAnalytics]);
  
  // Memoize TopProducts component
  const loadTopProducts = useCallback(() => {
    const topProducts = [...analyticsData.products]
      .sort((a, b) => (b.sold * b.price) - (a.sold * a.price))
      .slice(0, 5);
    
    return topProducts.map((product, index) => (
      <div key={product.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
        <div className="flex items-center space-x-3">
          <span className="w-6 h-6 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
            {index + 1}
          </span>
          <div>
            <div className="font-medium text-sm">{product.name}</div>
            <div className="text-xs text-gray-500">{formatCurrency(product.price)}</div>
          </div>
        </div>
        <div className="text-sm font-medium text-green-600">{product.sold} sotilgan</div>
      </div>
    ));
  }, [analyticsData.products, formatCurrency]);
  
  // Memoize CategoryStats component
  const loadCategoryStats = useCallback(() => {
    return analyticsData.categories.map((category, index) => (
      <div key={index} className="p-2 hover:bg-gray-50 rounded">
        <div className="flex justify-between items-center mb-1">
          <span className="font-medium text-sm">{category.name}</span>
          <span className="text-sm font-bold text-gray-800">{category.percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
          <div 
            className="bg-purple-500 h-2 rounded-full" 
            style={{ width: `${category.percentage}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 text-right">
          {formatCurrency(category.amount)}
        </div>
      </div>
    ));
  }, [analyticsData.categories, formatCurrency]);
  
  // Memoize TopProducts component
  const TopProducts = useMemo(() => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Eng ko'p sotilgan mahsulotlar</h3>
        <div className="space-y-2">
          {loadTopProducts()}
        </div>
      </div>
    );
  }, [loadTopProducts]);
  
  // Memoize CategoryStats component
  const CategoryStats = useMemo(() => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Kategoriyalar bo'yicha sotuvlar</h3>
        <div className="space-y-3">
          {loadCategoryStats()}
        </div>
      </div>
    );
  }, [loadCategoryStats]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={onMobileToggle}
            className="lg:hidden mr-4 text-gray-600 hover:text-gray-900"
          >
            <BarsFAIcon className="text-xl" />
          </button>
          
          <h1 className="text-2xl font-semibold text-gray-800">Analitika</h1>
        </div>
        
        <div className="flex items-center">
          <div className="relative mr-4">
            <select
              value={selectedMonth}
              onChange={(e) => debouncedSetSelectedMonth(parseInt(e.target.value))}
              className="pl-3 pr-10 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="0">Yanvar</option>
              <option value="1">Fevral</option>
              <option value="2">Mart</option>
              <option value="3">Aprel</option>
              <option value="4">May</option>
              <option value="5">Iyun</option>
              <option value="6">Iyul</option>
              <option value="7">Avgust</option>
              <option value="8">Sentyabr</option>
              <option value="9">Oktyabr</option>
              <option value="10">Noyabr</option>
              <option value="11">Dekabr</option>
            </select>
          </div>
          
          <AdminNotificationBell 
            notifications={realNotifications} 
            unreadCount={unreadCount}
            markAsRead={markAsRead}
            markAllAsRead={markAllAsRead}
            deleteNotification={deleteNotification}
            deleteAllNotifications={deleteAllNotifications}
          />
        </div>
      </div>
      
      {/* Use memoized components */}
      {SummaryCards}
      {OrdersStatusReport}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {TopProducts}
        {CategoryStats}
      </div>
      
      {/* Modals */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 999999 }}>
          {/* ... existing modal code ... */}
        </div>
      )}
    </div>
  );
};

export default React.memo(AdminAnalytics);