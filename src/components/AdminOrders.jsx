import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  SearchFAIcon,
  TimesFAIcon,
  EyeFAIcon,
  TrashFAIcon,
  ChevronLeftFAIcon,
  ChevronRightFAIcon,
  SpinnerFAIcon,
  CartFAIcon,
  BarsFAIcon
} from './FontAwesome';

import AdminNotificationBell from './AdminNotificationBell';
import AdminNotificationModals from './AdminNotificationModals';
import useNotifications from '../hooks/useNotifications';

// Global flag to prevent multiple loads across component remounts
let globalOrdersLoaded = false;
let globalOrdersData = [];

const AdminOrders = ({ onCountChange, notifications, setNotifications, onMobileToggle }) => {

  // Demo notification system for modals
  const {
    notifications: demoNotifications,
    alertModal,
    confirmModal,
    promptModal,
    showConfirm,
    closeAlert,
    handleConfirmResponse,
    handlePromptResponse,
    safeNotifySuccess,
    safeNotifyError,
    safeNotifyWarning,
    addNotification,
    notifyOrderReceived
  } = useNotifications();

  const [orders, setOrders] = useState(globalOrdersData || []);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(globalOrdersData?.length || 0);
  const [isMobile, setIsMobile] = useState(false);
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  
  // Bulk selection states
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [isSelectAllMode, setIsSelectAllMode] = useState(false);
  const previousOrderIdsRef = useRef(new Set());
  const hasLoadedRef = useRef(false);

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalPosition, setModalPosition] = useState({ top: '2rem' });

  // Table scroll ref
  const tableScrollRef = useRef(null);

  // Status change notification states
  const [showStatusNotification, setShowStatusNotification] = useState(false);
  const [statusNotificationMessage, setStatusNotificationMessage] = useState('');

  // Table scroll functions
  const scrollLeft = () => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Check mobile responsiveness
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const statusOptions = [
    { value: '', label: 'Barcha statuslar' },
    { value: 'pending', label: 'Kutilmoqda' },
    { value: 'processing', label: 'Jarayonda' },
    { value: 'completed', label: 'Bajarilgan' },
    { value: 'cancelled', label: 'Bekor qilingan' }
  ];

  const statusMap = {
    pending: { text: 'Kutilmoqda', class: 'bg-yellow-100 text-yellow-800' },
    processing: { text: 'Jarayonda', class: 'bg-orange-100 text-orange-800' },
    completed: { text: 'Bajarilgan', class: 'bg-green-100 text-green-800' },
    cancelled: { text: 'Bekor qilingan', class: 'bg-red-100 text-red-800' }
  };

  // Allowed transitions to match backend constraints
  const getAllowedStatusOptions = (currentStatus) => {
    if (currentStatus === 'cancelled') {
      return statusOptions.filter((o) => o.value === 'cancelled');
    }
    if (currentStatus === 'completed') {
      return statusOptions.filter((o) => o.value && o.value !== 'cancelled');
    }
    return statusOptions.filter((o) => o.value);
  };

  // Manual load orders function for button clicks
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      hasLoadedRef.current = true; // Mark as loaded for manual refresh too
      globalOrdersLoaded = true; // Mark globally as loaded
      
      const base = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';
      const response = await fetch(`${base}/orders?page=1&limit=1000`);
      const data = await response.json();
      
      if (response.ok && data.orders) {
        setOrders(data.orders);
        setTotalCount(data.orders.length);
      } else {
        setOrders([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('❌ Error loading orders:', error);
      setOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load orders on component mount - ONLY ONCE with loading check
  useEffect(() => {
    // First, restore from global data if available
    if (globalOrdersData.length > 0 && orders.length === 0) {
      setOrders(globalOrdersData);
      setTotalCount(globalOrdersData.length);
      return;
    }
    
    const fetchOrders = async () => {
      // Prevent multiple simultaneous requests or if already loaded
      if (loading || hasLoadedRef.current || globalOrdersLoaded) {
        return;
      }
      
      hasLoadedRef.current = true; // Mark as loaded immediately
      globalOrdersLoaded = true; // Mark globally as loaded
      
      try {
        setLoading(true);
        
        const base = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';
        const response = await fetch(`${base}/orders?page=1&limit=1000`);
        const data = await response.json();
        
        if (response.ok && data.orders) {
          globalOrdersData = data.orders; // Store globally
          setOrders(data.orders);
          setTotalCount(data.orders.length);
        } else {
          globalOrdersData = [];
          setOrders([]);
          setTotalCount(0);
        }
      } catch (error) {
        console.error('❌ Error loading orders:', error);
        setOrders([]);
        setTotalCount(0);
        hasLoadedRef.current = false; // Reset on error to allow retry
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []); // Empty dependency array to run only once

  // Client-side filtering
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    if (filterStatus) {
      filtered = filtered.filter(order => order.status === filterStatus);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.customerName?.toLowerCase().includes(term) ||
        order.customerPhone?.includes(term) ||
        order._id?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [orders, filterStatus, searchTerm]);

  // Pagination logic
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredOrders.slice(startIndex, endIndex);
    return paginated;
  }, [filteredOrders, currentPage, itemsPerPage]);

  // Update total pages when filtered orders change
  useEffect(() => {
    const pages = Math.ceil(filteredOrders.length / itemsPerPage);
    setTotalPages(pages);

    if (currentPage > pages && pages > 0) {
      setCurrentPage(1);
    }
  }, [filteredOrders.length, itemsPerPage, currentPage]);

  // Update parent component when totalCount changes
  useEffect(() => {
    if (onCountChange) {
      onCountChange(totalCount);
    }
  }, [totalCount, onCountChange]);

  // Detect new orders and notify admin - optimized
  useEffect(() => {
    if (orders.length > 0) {


      const currentOrderIds = new Set(orders.map(order => order._id));

      if (previousOrderIdsRef.current.size > 0) {
        const newOrderIds = [...currentOrderIds].filter(id => !previousOrderIdsRef.current.has(id));

        if (newOrderIds.length > 0) {


          const newOrders = orders.filter(order => newOrderIds.includes(order._id));

          newOrders.forEach((order) => {
            if (order && order._id) {
              // Use setTimeout to prevent blocking
              setTimeout(() => {
                notifyOrderReceived(order)
                  .then(() => {
                    // Order notification sent successfully
                  })
                  .catch((error) => {
                    console.error(`❌ Buyurtma bildirishnomasi yuborishda xato: ${order._id}`, error);
                  });
              }, 0);
            }
          });
        }
      } else {
        // Initial load - no notifications sent
      }

      previousOrderIdsRef.current = currentOrderIds;
      setPreviousOrderCount(orders.length);
    }
  }, [orders.length]); // Only depend on orders length, not the entire orders array

  // Prevent body scrolling when any modal is open - optimized
  useEffect(() => {
    const hasOpenModal = isViewModalOpen || alertModal?.show || confirmModal?.show || promptModal?.show;

    if (hasOpenModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isViewModalOpen, alertModal?.show, confirmModal?.show, promptModal?.show]);

  const openViewModal = useCallback((order, event) => {
    // Calculate position based on clicked element
    if (event && event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const clickedElementTop = rect.top + scrollTop;
      
      // Position modal near the clicked element, but ensure it's visible
      const modalTop = Math.max(scrollTop + 20, clickedElementTop - 100);
      setModalPosition({ top: `${modalTop}px` });
    } else {
      // Fallback to current scroll position + 2rem
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setModalPosition({ top: `${scrollTop + 32}px` });
    }
    
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  }, []);

  const handleOrderClick = (order, event) => {
    openViewModal(order, event);
  };

  const formatCurrency = useCallback((amount) => {
    if (!amount || isNaN(amount)) return "0 so'm";
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  }, []);

  const formatPhoneNumber = useCallback((phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('998')) {
      const code = cleaned.substring(3, 5);
      const number = cleaned.substring(5);
      return `+998 (${code}) ${number.substring(0, 3)}-${number.substring(3, 5)}-${number.substring(5)}`;
    }
    return phone;
  }, []);

  const formatDate = useCallback((date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }, []);

  const formatDateTime = useCallback((date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  }, []);

  // Bulk selection functions
  const toggleOrderSelection = useCallback((orderId) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  }, []);

  const selectAllOrders = useCallback(() => {
    if (selectedOrders.size === filteredOrders.length) {
      // Deselect all
      setSelectedOrders(new Set());
      setIsSelectAllMode(false);
    } else {
      // Select all
      const allIds = new Set(filteredOrders.map(order => order._id));
      setSelectedOrders(allIds);
      setIsSelectAllMode(true);
    }
  }, [selectedOrders.size, filteredOrders]);

  const clearSelection = useCallback(() => {
    setSelectedOrders(new Set());
    setIsSelectAllMode(false);
  }, []);

  // Bulk delete function
  const bulkDeleteOrders = useCallback(async () => {
    if (selectedOrders.size === 0) return;

    const selectedOrdersList = orders.filter(order => selectedOrders.has(order._id));
    const customerNames = selectedOrdersList.map(order => order.customerName || 'Noma\'lum mijoz').slice(0, 3);
    const displayNames = customerNames.join(', ') + (selectedOrdersList.length > 3 ? ` va yana ${selectedOrdersList.length - 3} ta` : '');

    showConfirm(
      'Buyurtmalarni o\'chirish',
      `${selectedOrders.size} ta buyurtmani o\'chirishni xohlaysizmi?\n\nMijozlar: ${displayNames}`,
      async () => {
        try {
          const base = process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'production' ? 'https://aliboboqurilish.uz/api' : 'http://localhost:5000/api');
          
          // Delete all selected orders
          const deletePromises = Array.from(selectedOrders).map(async (orderId) => {
            const response = await fetch(`${base}/orders/${orderId}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(`${orderId}: ${errorData.message || 'Xatolik'}`);
            }
            
            return orderId;
          });

          const deletedIds = await Promise.all(deletePromises);
          
          // Update local state
          const updatedOrders = orders.filter(order => !deletedIds.includes(order._id));
          setOrders(updatedOrders);
          setTotalCount(updatedOrders.length);
          globalOrdersData = updatedOrders;
          
          // Clear selection
          clearSelection();
          
          setTimeout(() => {
            safeNotifySuccess("Buyurtmalar o'chirildi", `${deletedIds.length} ta buyurtma muvaffaqiyatli o'chirildi`);
            
            addNotification({
              title: "Ko'p buyurtma o'chirildi",
              message: `${deletedIds.length} ta buyurtma o'chirildi`,
              type: 'order'
            });
          }, 0);
          
        } catch (error) {
          console.error("Bulk delete error:", error);
          setTimeout(() => {
            safeNotifyError('Xatolik', error.message || "Ba'zi buyurtmalarni o'chirishda xatolik");
          }, 0);
        }
      },
      () => {
        // Cancel - do nothing
      },
      'danger'
    );
  }, [selectedOrders, orders, showConfirm, clearSelection, safeNotifySuccess, safeNotifyError, addNotification]);

  const deleteOrder = useCallback(async (id) => {
    try {
      const deletedOrder = orders.find(o => o._id === id);

      const base = process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'production' ? 'https://aliboboqurilish.uz/api' : 'http://localhost:5000/api');
      const url = `${base}/orders/${id}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Buyurtmani o\'chirishda xatolik');
      }

      // Update local state immediately - don't reload from server
      const updatedOrders = orders.filter(order => order._id !== id);
      setOrders(updatedOrders);
      setTotalCount(updatedOrders.length);
      
      // Update global data as well
      globalOrdersData = updatedOrders;
      
      // Remove from selection if it was selected
      setSelectedOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });

      setTimeout(() => {
        const orderIndex = orders.findIndex(o => o._id === id);
        const orderNumber = String(orderIndex + 1).padStart(4, '0');
        safeNotifySuccess("Buyurtma o'chirildi", `Buyurtma #${orderNumber} muvaffaqiyatli o'chirildi`);

        addNotification({
          title: "Buyurtma o'chirildi",
          message: `Buyurtma #${orderNumber} - ${formatCurrency(deletedOrder?.totalAmount || 0)}`,
          type: 'order'
        });
      }, 0);

      // Check if we need to go to previous page
      if (updatedOrders.length === 0 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      console.error("Order o'chirishda xatolik:", error);
      setTimeout(() => {
        safeNotifyError('Xatolik', error.message || "Server bilan bog'lanishda xatolik");
      }, 0);
    }
  }, [orders, currentPage, safeNotifyError, safeNotifySuccess, addNotification, formatCurrency]);

  const openDeleteConfirm = useCallback((order) => {
    const customerName = order.customerName || 'Noma\'lum mijoz';

    showConfirm(
      'Buyurtmani o\'chirish',
      `"${customerName}" buyurtmasini o\'chirishni xohlaysizmi?`,
      () => deleteOrder(order._id),
      () => {
        // Bekor qilish - hech narsa qilmaslik
      },
      'danger'
    );
  }, [showConfirm, deleteOrder]);

  const closeViewModal = () => {
    setIsViewModalOpen(false);
  };

  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    try {
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId
            ? { ...order, status: newStatus, isUpdating: true }
            : order
        )
      );

      const base = process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'production' ? 'https://aliboboqurilish.uz/api' : 'http://localhost:5000/api');
      const response = await fetch(`${base}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Status yangilashda xatolik');
      }

      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId
            ? { ...order, status: newStatus, isUpdating: false }
            : order
        )
      );

      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }

      setTimeout(() => {
        safeNotifySuccess('Status yangilandi', 'Buyurtma statusi muvaffaqiyatli yangilandi');

        setStatusNotificationMessage(`Status "${statusMap[newStatus]?.text}" ga o'zgartirildi`);
        setShowStatusNotification(true);

        setTimeout(() => {
          setShowStatusNotification(false);
        }, 3000);
      }, 0);

      loadOrders();
    } catch (error) {
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId
            ? { ...order, isUpdating: false }
            : order
        )
      );

      console.error('Order status yangilashda xatolik:', error);
      setTimeout(() => {
        safeNotifyError('Xatolik', error.message || "Server bilan bog'lanishda xatolik");
      }, 0);
    }
  }, [selectedOrder, statusMap, safeNotifySuccess, safeNotifyError, loadOrders]);

  const changePage = (direction) => {
    setCurrentPage(prev => {
      const newPage = direction === 'next' ? prev + 1 : prev - 1;
      return Math.max(1, Math.min(newPage, totalPages));
    });
  };

  // Orders layout rendering
  const renderOrdersLayout = useMemo(() => {
    if (loading && !orders.length) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-600">
          <SpinnerFAIcon className="animate-spin text-2xl mr-3" />
          <span className="text-sm">Buyurtmalar yuklanmoqda...</span>
        </div>
      );
    }

    if (!loading && !filteredOrders.length) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <CartFAIcon className="text-gray-400 text-4xl mb-4" />
          <p className="text-gray-500">Buyurtmalar topilmadi</p>
          {(searchTerm || filterStatus) && (
            <button
              onClick={() => { setSearchTerm(''); setFilterStatus(''); }}
              className="mt-2 text-blue-500 hover:text-blue-700 text-sm"
            >
              Filtrni tozalash
            </button>
          )}
        </div>
      );
    }

    const OrderCard = ({ order, orderNumber }) => {
      const isSelected = selectedOrders.has(order._id);
      
      return (
      <div
        className={`bg-white rounded-lg border transition-all duration-200 cursor-pointer ${
          order.isDeleting ? 'opacity-50 pointer-events-none bg-red-50 border-gray-200' : 
          isSelected ? 'border-orange-500 bg-orange-50 shadow-md' : 
          'border-gray-200 hover:shadow-md'
        }`}
        onClick={(e) => {
          // Check if click is on checkbox or its container
          if (e.target.type === 'checkbox' || e.target.closest('.checkbox-container')) {
            return; // Let checkbox handle the click
          }
          if (!order.isDeleting) {
            handleOrderClick(order, e);
          }
        }}
      >
        <div className="p-3 sm:p-4">
          {/* Mobile Layout */}
          <div className="sm:hidden">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                {/* Checkbox */}
                <div className="checkbox-container flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOrderSelection(order._id)}
                    className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                  />
                </div>
                <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {order.isDeleting ? (
                    <SpinnerFAIcon className="text-red-600 text-xs" />
                  ) : (
                    <CartFAIcon className="text-orange-600 text-xs" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${order.isDeleting ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                      #{orderNumber}{order.isDeleting ? ' - O\'chirilmoqda...' : ''}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 block">{formatDate(order.createdAt || order.orderDate)}</span>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); openViewModal(order, e); }}
                  className="w-6 h-6 bg-gray-50 hover:bg-green-50 text-gray-600 hover:text-green-600 rounded-md transition-colors duration-200 flex items-center justify-center border border-gray-200 hover:border-green-200"
                  title="Ko'rish"
                >
                  <EyeFAIcon className="text-xs" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); openDeleteConfirm(order); }}
                  className="w-6 h-6 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-md transition-colors duration-200 flex items-center justify-center border border-gray-200 hover:border-red-200"
                  title="O'chirish"
                >
                  <TrashFAIcon className="text-xs" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <p className="font-medium text-gray-900 text-sm truncate">{order.customerName}</p>
                <p className="text-xs text-blue-600 font-medium truncate">{formatPhoneNumber(order.customerPhone)}</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-shrink-0">
                  <select
                    value={order.status}
                    onChange={(e) => { e.stopPropagation(); updateOrderStatus(order._id, e.target.value); }}
                    disabled={order.isUpdating || order.status === 'cancelled'}
                    title={order.status === 'cancelled' ? "Bekor qilingan buyurtma holatini o'zgartirib bo'lmaydi" : 'Holatni o\'zgartirish'}
                    className={`px-2 py-1 rounded text-xs font-medium cursor-pointer border-0 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mobile-friendly-options ${statusMap[order.status]?.class} ${(order.isUpdating || order.status === 'cancelled') ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {order.isUpdating ? (
                      <option value={order.status}>Yuklanmoqda...</option>
                    ) : (
                      getAllowedStatusOptions(order.status).map(option => (
                        <option key={option.value} value={option.value}>{statusMap[option.value]?.text}</option>
                      ))
                    )}
                  </select>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-orange-600">{formatCurrency(order.totalAmount)}</div>
                  <div className="text-xs text-gray-500">{(order.items && order.items.length) || 0} mahsulot</div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center gap-4">
            {/* Checkbox */}
            <div className="checkbox-container flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleOrderSelection(order._id)}
                className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
              />
            </div>
            
            {/* Left: Order Icon & Info */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                {order.isDeleting ? (
                  <SpinnerFAIcon className="text-red-600 text-sm" />
                ) : (
                  <CartFAIcon className="text-orange-600 text-sm" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm px-3 py-1 rounded font-medium ${order.isDeleting ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                    #{orderNumber}{order.isDeleting ? ' - O\'chirilmoqda...' : ''}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{formatDate(order.createdAt || order.orderDate)}</span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{order.customerName}</p>
              <p className="text-xs text-blue-600 font-medium truncate">{formatPhoneNumber(order.customerPhone)}</p>
            </div>

            {/* Items */}
            <div className="hidden md:block flex-1 min-w-0">
              <div className="space-y-1">
                {(order.items && order.items.length > 0) ? (
                  <>
                    <div className="text-sm text-gray-900 truncate">{order.items[0].name} x{order.items[0].quantity}</div>
                    {order.items.length > 1 && (
                      <div className="text-xs text-gray-500">+{order.items.length - 1} boshqa</div>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-gray-500">Ma'lumot yo'q</span>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="flex-shrink-0">
              <select
                value={order.status}
                onChange={(e) => { e.stopPropagation(); updateOrderStatus(order._id, e.target.value); }}
                disabled={order.isUpdating || order.status === 'cancelled'}
                title={order.status === 'cancelled' ? "Bekor qilingan buyurtma holatini o'zgartirib bo'lmaydi" : 'Holatni o\'zgartirish'}
                className={`px-3 py-2 rounded text-sm font-medium cursor-pointer border-0 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${statusMap[order.status]?.class} ${(order.isUpdating || order.status === 'cancelled') ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={(e) => e.stopPropagation()}
              >
                {order.isUpdating ? (
                  <option value={order.status}>Yuklanmoqda...</option>
                ) : (
                  getAllowedStatusOptions(order.status).map(option => (
                    <option key={option.value} value={option.value}>{statusMap[option.value]?.text}</option>
                  ))
                )}
              </select>
            </div>

            {/* Amount */}
            <div className="flex-shrink-0 text-right">
              <div className="text-lg font-bold text-orange-600">{formatCurrency(order.totalAmount)}</div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); openViewModal(order, e); }}
                className="w-8 h-8 bg-gray-50 hover:bg-green-50 text-gray-600 hover:text-green-600 rounded-lg transition-colors duration-200 flex items-center justify-center border border-gray-200 hover:border-green-200"
                title="Ko'rish"
              >
                <EyeFAIcon className="text-xs" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); openDeleteConfirm(order); }}
                className="w-8 h-8 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg transition-colors duration-200 flex items-center justify-center border border-gray-200 hover:border-red-200"
                title="O'chirish"
              >
                <TrashFAIcon className="text-xs" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
    };

    return (
      <div className="space-y-2">
        {paginatedOrders.map((order, index) => (
          <OrderCard
            key={order._id}
            order={order}
            orderNumber={String(totalCount - (currentPage - 1) * itemsPerPage - index).padStart(4, '0')}
          />
        ))}
      </div>
    );
  }, [loading, filteredOrders, paginatedOrders, totalCount, currentPage, itemsPerPage, updateOrderStatus, openViewModal, openDeleteConfirm, searchTerm, filterStatus, formatDate, formatPhoneNumber, formatCurrency]);

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @media (max-width: 640px) {
          .mobile-friendly-options option {
            padding: 12px 8px;
            min-height: 44px;
            line-height: 1.4;
            font-size: 16px;
          }
          
          .mobile-friendly-options {
            font-size: 16px;
          }
        }
      `}</style>

      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={onMobileToggle}
                className="lg:hidden mr-4 text-gray-600 hover:text-gray-900"
              >
                <BarsFAIcon className="text-xl" />
              </button>

              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                <CartFAIcon className="text-white text-xs sm:text-sm" />
              </div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Buyurtmalar</h1>
            </div>
            <div className="flex items-center">
              <AdminNotificationBell 
                notifications={notifications}
                setNotifications={setNotifications}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Controls */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="relative flex">
                  <SearchFAIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Qidirish..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-20 py-2 w-full border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                  />
                  <button
                    onClick={loadOrders}
                    disabled={loading}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white text-sm font-medium rounded-r-lg transition-colors duration-200"
                  >
                    {loading ? 'Yuklanmoqda...' : 'Yuklash'}
                  </button>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 ml-2"
                    >
                      Tozalash
                    </button>
                  )}
                </div>
              </div>
              <div className="w-full sm:w-48">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm mobile-friendly-options"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Orders Count and Bulk Actions */}
          <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <p className="text-xs sm:text-sm text-gray-600">
                {searchTerm || filterStatus ?
                  `Qidiruv natijalari: ${filteredOrders.length} ta buyurtma` :
                  `Jami ${totalCount} ta buyurtma`
                }
              </p>
              
              {selectedOrders.size > 0 && (
                <p className="text-xs sm:text-sm text-orange-600 font-medium">
                  {selectedOrders.size} ta tanlangan
                </p>
              )}
            </div>
            
            {/* Bulk Action Buttons */}
            {filteredOrders.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAllOrders}
                  className="px-4 py-2 text-sm bg-primary-orange hover:bg-orange-600 text-white rounded-lg transition-colors duration-200 font-medium shadow-sm hover:shadow-md"
                >
                  {selectedOrders.size === filteredOrders.length ? 'Hammasini bekor qilish' : 'Hammasini tanlash'}
                </button>
                
                {selectedOrders.size > 0 && (
                  <>
                    <button
                      onClick={clearSelection}
                      className="px-4 py-2 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 font-medium shadow-sm hover:shadow-md"
                    >
                      Tanlovni tozalash
                    </button>
                    
                    <button
                      onClick={bulkDeleteOrders}
                      className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 font-medium shadow-sm hover:shadow-md flex items-center gap-2"
                    >
                      <TrashFAIcon className="text-sm" />
                      O'chirish ({selectedOrders.size})
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Orders List */}
          {renderOrdersLayout}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-gray-500">
                Ko'rsatilmoqda <span>{((currentPage - 1) * itemsPerPage) + 1}</span> dan <span>{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> gacha, jami <span>{filteredOrders.length}</span> ta
              </div>
              <div className="flex space-x-1 sm:space-x-2 justify-end sm:justify-start">
                <button
                  onClick={() => changePage('prev')}
                  disabled={currentPage === 1}
                  className="pagination-btn px-2 sm:px-3 py-1 border border-gray-300 rounded text-xs sm:text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftFAIcon className="mr-1" />
                  <span className="hidden sm:inline">Oldingi</span>
                  <span className="sm:hidden">Old</span>
                </button>
                <button
                  onClick={() => changePage('next')}
                  disabled={currentPage >= totalPages}
                  className="pagination-btn px-2 sm:px-3 py-1 border border-gray-300 rounded text-xs sm:text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="hidden sm:inline">Keyingi</span>
                  <span className="sm:hidden">Key</span>
                  <ChevronRightFAIcon className="ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {document.body && createPortal(
        <AdminNotificationModals
          alertModal={alertModal}
          confirmModal={confirmModal}
          promptModal={promptModal}
          closeAlert={closeAlert}
          onConfirmResponse={handleConfirmResponse}
          onPromptResponse={handlePromptResponse}
        />,
        document.body
      )}

      {/* Order View Modal */}
      {isViewModalOpen && selectedOrder && document.body && createPortal(
        <div 
          id="admin-orders-modal"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 99999, position: 'fixed' }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Buyurtma ma'lumotlari</h2>
                <button
                  onClick={closeViewModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              {/* Order Info */}
              <div className="space-y-4">
                {/* Order ID & Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Buyurtma raqami</label>
                    <p className="text-lg font-mono bg-gray-100 p-2 rounded">
                      #{String(orders.findIndex(o => o._id === selectedOrder._id) + 1).padStart(4, '0')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sana</label>
                    <p className="text-lg bg-gray-100 p-2 rounded">
                      {formatDateTime(selectedOrder.createdAt || selectedOrder.orderDate)}
                    </p>
                  </div>
                </div>
                
                {/* Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mijoz nomi</label>
                    <p className="text-lg bg-gray-100 p-2 rounded">
                      {selectedOrder.customerName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon raqam</label>
                    <p className="text-lg bg-gray-100 p-2 rounded">
                      {formatPhoneNumber(selectedOrder.customerPhone)}
                    </p>
                  </div>
                </div>
                
                {/* Customer Address & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedOrder.customerAddress ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Manzil</label>
                      <p className="text-lg bg-gray-100 p-2 rounded">
                        {selectedOrder.customerAddress}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <div className="bg-gray-100 p-2 rounded">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          statusMap[selectedOrder.status]?.class || 'bg-gray-100 text-gray-800'
                        }`}>
                          {statusMap[selectedOrder.status]?.text || 'Noma\'lum'}
                        </span>
                      </div>
                    </div>
                  )}
                  {selectedOrder.customerEmail && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-lg bg-gray-100 p-2 rounded">
                        {selectedOrder.customerEmail}
                      </p>
                    </div>
                  )}
                  {selectedOrder.customerAddress && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <div className="bg-gray-100 p-2 rounded">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          statusMap[selectedOrder.status]?.class || 'bg-gray-100 text-gray-800'
                        }`}>
                          {statusMap[selectedOrder.status]?.text || 'Noma\'lum'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Total Amount */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Umumiy summa</label>
                    <p className="text-xl font-bold text-orange-600 bg-gray-100 p-2 rounded">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </p>
                  </div>
                </div>
                
                {/* Order Items */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Buyurtma mahsulotlari</label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      <div className="space-y-3">
                        {selectedOrder.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-white rounded border">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{item.name}</p>
                              <p className="text-sm text-gray-600">Miqdor: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-orange-600">{formatCurrency(item.price)}</p>
                              <p className="text-sm text-gray-600">
                                Jami: {formatCurrency(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">Mahsulotlar ma'lumoti yo'q</p>
                    )}
                  </div>
                </div>
                
                {/* Notes */}
                {selectedOrder.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Izohlar</label>
                    <p className="text-lg bg-gray-100 p-3 rounded">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={closeViewModal}
                  className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors duration-200"
                >
                  Yopish
                </button>
                <button
                  onClick={() => {
                    closeViewModal();
                    openDeleteConfirm(selectedOrder);
                  }}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
                >
                  O'chirish
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Status Change Notification */}
      {showStatusNotification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg" style={{ zIndex: 999999 }}>
          {statusNotificationMessage}
        </div>
      )}
    </div>
  );
};

export default React.memo(AdminOrders);