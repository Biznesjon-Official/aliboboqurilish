import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
import useRealNotifications from '../hooks/useRealNotifications';

const AdminOrders = ({ onCountChange, notifications, setNotifications, onMobileToggle }) => {
  // Real notification system for notification bell
  const {
    notifications: realNotifications,
    setNotifications: setRealNotifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
    deleteNotification,
    deleteAllNotifications,
    notifyOrderReceived,
    notifyOrderDeleted
  } = useRealNotifications(true, 30000);

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
    addNotification
  } = useNotifications();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  const previousOrderIdsRef = useRef(new Set());

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Status change notification states
  const [showStatusNotification, setShowStatusNotification] = useState(false);
  const [statusNotificationMessage, setStatusNotificationMessage] = useState('');

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

  // Load orders function - memoized to prevent recreating on every render
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '1000',
      });

      const base = process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'production' ? 'https://aliboboqurilish.uz/api' : 'http://localhost:5000/api');

      let sortedOrders = [];
      let totalCount = 0;

      try {
        const url = `${base}/orders?${params.toString()}`;


        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000)
        });
        const data = await response.json();



        if (response.ok) {
          const apiOrders = data.orders || [];

          sortedOrders = apiOrders.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.orderDate);
            const dateB = new Date(b.createdAt || b.orderDate);
            return dateB - dateA;
          });
          totalCount = data.pagination?.totalCount || apiOrders.length;
        } else {
          throw new Error(data.message || 'API error');
        }
      } catch (apiError) {

        sortedOrders = [];
        totalCount = 0;
      }

      setOrders(sortedOrders);
      setTotalCount(prevCount => {
        if (prevCount !== totalCount && onCountChange) {
          onCountChange(totalCount);
        }
        return totalCount;
      });


    } catch (error) {
      console.error('❌ Error loading orders:', error);
      setOrders([]);
      setTotalCount(prevCount => {
        if (prevCount !== 0 && onCountChange) {
          onCountChange(0);
        }
        return 0;
      });
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since this function doesn't depend on any props or state

  // Load orders on component mount - optimized to prevent remounting
  const mountedRef = useRef(true);
  const intervalRef = useRef(null);

  useEffect(() => {


    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    loadOrders();

    // Set up interval for periodic refresh
    intervalRef.current = setInterval(() => {
      if (mountedRef.current) {

        loadOrders();
      }
    }, 30000);

    return () => {

      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []); // Keep empty dependency array

  // Client-side filtering
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    if (filterStatus) {
      filtered = filtered.filter(order => order.status === filterStatus);
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(order =>
        order.customerName?.toLowerCase().includes(search) ||
        order.customerPhone?.includes(search) ||
        order._id?.toLowerCase().includes(search) ||
        order.notes?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [orders, filterStatus, searchTerm]);

  // Pagination logic
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, currentPage, itemsPerPage]);

  // Update total pages when filtered orders change
  useEffect(() => {
    const pages = Math.ceil(filteredOrders.length / itemsPerPage);
    setTotalPages(pages);

    if (currentPage > pages && pages > 0) {
      setCurrentPage(1);
    }
  }, [filteredOrders.length, itemsPerPage, currentPage]);

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

  const openViewModal = (order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const handleOrderClick = (order) => {
    openViewModal(order);
  };

  const openDeleteConfirm = (order) => {
    const customerName = order.customerName || 'Noma\'lum mijoz';

    showConfirm(
      'Buyurtmani o\'chirish',
      `"${customerName}" buyurtmasini o\'chirishni xohlaysizmi?`,
      () => deleteOrder(order._id),
      () => {

      },
      'danger'
    );
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedOrder(null);
  };

  const deleteOrder = async (id) => {
    try {
      const deletedOrder = orders.find(o => o._id === id);

      const base = process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'production' ? 'https://aliboboqurilish.uz/api' : 'http://localhost:5000/api');
      const response = await fetch(`${base}/orders/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Buyurtmani o\'chirishda xatolik');
      }

      setOrders(prevOrders => prevOrders.filter(order => order._id !== id));

      setTotalCount(prevCount => {
        const newCount = prevCount - 1;
        onCountChange(newCount);
        return newCount;
      });

      setTimeout(() => {
        const orderIndex = orders.findIndex(o => o._id === id);
        const orderNumber = String(orderIndex + 1).padStart(4, '0');
        safeNotifySuccess("Buyurtma o'chirildi", `Buyurtma #${orderNumber} muvaffaqiyatli o'chirildi`);

        if (deletedOrder) {
          notifyOrderDeleted(deletedOrder);
        }

        addNotification({
          title: "Buyurtma o'chirildi",
          message: `Buyurtma #${orderNumber} - ${formatCurrency(deletedOrder?.totalAmount || 0)}`,
          type: 'order'
        });
      }, 0);

      const remainingOrders = orders.filter(order => order._id !== id).length;
      if (remainingOrders === 0 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }

      loadOrders();
    } catch (error) {
      console.error("Order o'chirishda xatolik:", error);
      setTimeout(() => {
        safeNotifyError('Xatolik', error.message || "Server bilan bog'lanishda xatolik");
      }, 0);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
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
  };

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "0 so'm";
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('998')) {
      const code = cleaned.substring(3, 5);
      const number = cleaned.substring(5);
      return `+998 (${code}) ${number.substring(0, 3)}-${number.substring(3, 5)}-${number.substring(5)}`;
    }
    return phone;
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatDateTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

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

    const OrderCard = ({ order, orderNumber }) => (
      <div
        className={`bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer ${order.isDeleting ? 'opacity-50 pointer-events-none bg-red-50' : ''
          }`}
        onClick={() => !order.isDeleting && handleOrderClick(order)}
      >
        <div className="p-3 sm:p-4">
          {/* Mobile Layout */}
          <div className="sm:hidden">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
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
                  onClick={(e) => { e.stopPropagation(); openViewModal(order); }}
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
                onClick={(e) => { e.stopPropagation(); openViewModal(order); }}
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
  }, [orders, loading, filteredOrders, paginatedOrders, totalCount, currentPage, itemsPerPage, statusMap, formatDate, formatPhoneNumber, formatCurrency, updateOrderStatus, openViewModal, openDeleteConfirm, searchTerm, filterStatus]);

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
                notifications={realNotifications}
                unreadCount={unreadCount}
                markAsRead={markAsRead}
                markAllAsRead={markAllAsRead}
                deleteNotification={deleteNotification}
                deleteAllNotifications={deleteAllNotifications}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6">
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
                    onClick={() => { }}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-r-lg transition-colors duration-200"
                  >
                    Qidirish
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

          {/* Orders Count */}
          <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs sm:text-sm text-gray-600">
              {searchTerm || filterStatus ?
                `Qidiruv natijalari: ${filteredOrders.length} ta buyurtma` :
                `Jami ${totalCount} ta buyurtma`
              }
            </p>
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
      <AdminNotificationModals
        alertModal={alertModal}
        confirmModal={confirmModal}
        promptModal={promptModal}
        closeAlert={closeAlert}
        handleConfirmResponse={handleConfirmResponse}
        handlePromptResponse={handlePromptResponse}
      />

      {/* View Order Modal */}
      {isViewModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Buyurtma tafsilotlari</h2>
                <button
                  onClick={closeViewModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <TimesFAIcon className="text-xl" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mijoz ismi</label>
                    <p className="text-sm text-gray-900">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon raqami</label>
                    <p className="text-sm text-gray-900">{formatPhoneNumber(selectedOrder.customerPhone)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manzil</label>
                    <p className="text-sm text-gray-900">{selectedOrder.customerAddress || 'Ko\'rsatilmagan'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Buyurtma sanasi</label>
                    <p className="text-sm text-gray-900">{formatDateTime(selectedOrder.createdAt || selectedOrder.orderDate)}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mahsulotlar</label>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mahsulot</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Miqdor</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Narx</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jami</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedOrder.items && selectedOrder.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(item.price)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(item.price * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="text-lg font-medium text-gray-900">Jami summa:</span>
                  <span className="text-xl font-bold text-orange-600">{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Holat</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${statusMap[selectedOrder.status]?.class}`}>
                    {statusMap[selectedOrder.status]?.text}
                  </span>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Izohlar</label>
                    <p className="text-sm text-gray-900">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Notification */}
      {showStatusNotification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {statusNotificationMessage}
        </div>
      )}
    </div>
  );
};

export default React.memo(AdminOrders);