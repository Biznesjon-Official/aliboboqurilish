import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import AdminNotificationBell from './AdminNotificationBell';
import AdminNotificationModals from './AdminNotificationModals';
import LoadingSpinner from './LoadingSpinner';
import useNotifications from '../hooks/useNotifications';
import useRealNotifications from '../hooks/useRealNotifications';
import { useOrders, useUpdateOrderStatus, useCancelOrder, useDeleteOrder, useOrderCache } from '../hooks/useOrderQueries';
import { queryClient } from '../lib/queryClient';

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

  // Demo notification system for modals (keep existing modal functionality)
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

  // React Query hooks for order operations
  const updateOrderStatusMutation = useUpdateOrderStatus();
  const cancelOrderMutation = useCancelOrder();
  const deleteOrderMutation = useDeleteOrder();
  const orderCache = useOrderCache();

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

  // Modal states - simplified with new notification system
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Selection mode states
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  
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

  const paymentMap = {
    cash: { text: 'Naqd', class: 'bg-green-100 text-green-800' },
    card: { text: 'Plastik karta', class: 'bg-blue-100 text-blue-800' },
    online: { text: 'Onlayn', class: 'bg-purple-100 text-purple-800' }
  };

  // Original fetch approach instead of React Query
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '1000', // Load all orders for client-side filtering
      });
      
      const response = await fetch(`http://localhost:5000/api/orders?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        // Sort orders by creation date (newest first)
        const sortedOrders = (data.orders || []).sort((a, b) => {
          const dateA = new Date(a.createdAt || a.orderDate);
          const dateB = new Date(b.createdAt || b.orderDate);
          return dateB - dateA; // Newest first
        });
        
        setOrders(sortedOrders);
        setTotalCount(data.totalCount || 0);
        if (onCountChange) onCountChange(data.totalCount || 0);
        console.log('✅ Loaded orders:', sortedOrders?.length || 0);
      } else {
        throw new Error(data.message || 'Buyurtmalar yuklanmadi');
      }
    } catch (error) {
      console.error('❌ Error loading orders:', error);
      safeNotifyError('Xatolik', 'Buyurtmalar yuklanmadi');
    } finally {
      setLoading(false);
    }
  }, [currentPage, onCountChange, safeNotifyError]);

  // Load orders on component mount and page change
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Auto refresh every 2 minutes (reduced frequency)
  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders();
    }, 120000); // 2 minutes instead of 30 seconds
    
    return () => clearInterval(interval);
  }, [loadOrders]);
  
  // Client-side filtering
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];
    
    // Filter by status
    if (filterStatus) {
      filtered = filtered.filter(order => order.status === filterStatus);
    }
    
    // Filter by search term
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
    
    // Reset to page 1 if current page exceeds total pages
    if (currentPage > pages && pages > 0) {
      setCurrentPage(1);
    }
  }, [filteredOrders.length, itemsPerPage, currentPage]);

  // Detect new orders and notify admin
  useEffect(() => {
    if (orders.length > 0) {
      console.log(`📊 Order count check: current=${orders.length}, previous=${previousOrderCount}`);
      
      // Get current order IDs
      const currentOrderIds = new Set(orders.map(order => order._id));
      
      // If we have previous IDs, check for new orders
      if (previousOrderIdsRef.current.size > 0) {
        const newOrderIds = [...currentOrderIds].filter(id => !previousOrderIdsRef.current.has(id));
        
        if (newOrderIds.length > 0) {
          console.log(`🔔 Yangi buyurtma(lar) aniqlandi: ${newOrderIds.length} ta`);
          
          // Find the actual new order objects (these should be the newest ones)
          const newOrders = orders.filter(order => newOrderIds.includes(order._id));
          
          // Notify for each new order immediately
          newOrders.forEach((order) => {
            if (order && order._id) {
              console.log(`📱 Yangi buyurtma uchun bildirishnoma yuborilmoqda:`, {
                id: order._id,
                customer: order.customerName,
                amount: order.totalAmount,
                time: order.createdAt
              });
              
              // Send notification immediately (don't wait for async)
              notifyOrderReceived(order)
                .then(() => {
                  console.log(`✅ Buyurtma bildirishnomasi muvaffaqiyatli yuborildi: ${order._id}`);
                })
                .catch((error) => {
                  console.error(`❌ Buyurtma bildirishnomasi yuborishda xato: ${order._id}`, error);
                });
            }
          });
        }
      } else {
        // First load - just set the reference without notifications
        console.log('🗒 Dastlabki yuklash - bildirishnomalar yuborilmaydi');
      }
      
      // Update the previous IDs and count
      previousOrderIdsRef.current = currentOrderIds;
      setPreviousOrderCount(orders.length);
    }
  }, [orders, notifyOrderReceived]); // Watch the entire orders array for changes

  // Prevent body scrolling when any modal is open
  useEffect(() => {
    if (isViewModalOpen || alertModal?.show || confirmModal?.show || promptModal?.show) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    // Cleanup function to remove class when component unmounts
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isViewModalOpen, alertModal?.show, confirmModal?.show, promptModal?.show]);

  const openViewModal = (order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  // Selection functions
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedOrders(new Set());
  };

  const selectAll = () => {
    const orderIds = paginatedOrders.map(order => order._id);
    setSelectedOrders(new Set(orderIds));
  };

  const handleOrderClick = (order) => {
    if (selectionMode) {
      // In selection mode, toggle selection
      const newSelected = new Set(selectedOrders);
      if (newSelected.has(order._id)) {
        newSelected.delete(order._id);
      } else {
        newSelected.add(order._id);
      }
      setSelectedOrders(newSelected);
    } else {
      // Normal mode: open view modal
      openViewModal(order);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedOrders.size === 0) {
      return;
    }
    
    const orderCount = selectedOrders.size;
    const message = `${orderCount} ta buyurtmani o'chirmoqchimisiz?`;
    
    showConfirm(
      'Buyurtmalarni o\'chirish',
      message,
      async () => {
        try {
          // Get current order IDs to avoid stale data
          const currentOrderIds = Array.from(selectedOrders);
          let deletedCount = 0;
          let errorCount = 0;
          
          // Delete orders one by one with visual feedback
          for (const orderId of currentOrderIds) {
            try {
              // Check if order still exists in current state before attempting deletion
              const orderExists = orders.find(order => order._id === orderId);
              if (!orderExists) {
                console.warn(`Order ${orderId} not found in current state, skipping`);
                continue;
              }
              
              // Update UI to show this order is being deleted
              setOrders(prevOrders => 
                prevOrders.map(order => 
                  order._id === orderId 
                    ? { ...order, isDeleting: true }
                    : order
                )
              );
              
              const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                // If order was already deleted (404), count as success
                if (response.status === 404) {
                  console.warn(`Order ${orderId} was already deleted`);
                  // Remove from UI as it's already gone
                  setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
                  deletedCount++;
                } else {
                  throw new Error(errorData.message || 'Buyurtmani o\'chirishda xatolik');
                }
              } else {
                // Successful deletion
                setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
                deletedCount++;
              }
              
              // Small delay to show visual feedback
              await new Promise(resolve => setTimeout(resolve, 300));
              
            } catch (error) {
              console.error(`Error deleting order ${orderId}:`, error);
              errorCount++;
              
              // Remove loading state on error
              setOrders(prevOrders => 
                prevOrders.map(order => 
                  order._id === orderId 
                    ? { ...order, isDeleting: false }
                    : order
                )
              );
              
              // Continue with next order instead of stopping the entire process
              continue;
            }
          }
          
          // Update count based on actually deleted orders
          setTotalCount(prevCount => {
            const newCount = prevCount - deletedCount;
            onCountChange(newCount);
            return newCount;
          });
          
          setSelectedOrders(new Set());
          setSelectionMode(false);
          
          // Show summary notification
          if (deletedCount > 0 && errorCount === 0) {
            safeNotifySuccess(
              'Muvaffaqiyat', 
              `${deletedCount} ta buyurtma muvaffaqiyatli o'chirildi`
            );
          } else if (deletedCount > 0 && errorCount > 0) {
            safeNotifyWarning(
              'Qisman muvaffaqiyat', 
              `${deletedCount} ta buyurtma o'chirildi, ${errorCount} ta xatolik yuz berdi`
            );
          } else if (errorCount > 0) {
            safeNotifyError(
              'Xatolik', 
              `Buyurtmalarni o'chirishda ${errorCount} ta xatolik yuz berdi`
            );
          }
          
          // Reload orders to ensure consistency
          loadOrders();
        } catch (error) {
          console.error('Error in bulk deletion process:', error);
          safeNotifyError('Xatolik', 'Buyurtmalarni o\'chirishda xatolik yuz berdi');
        }
      },
      () => {
        // Bulk deletion cancelled - no action needed
      },
      'danger'
    );
  };

  const openDeleteConfirm = (order) => {
    // Show customer name instead of order number
    const customerName = order.customerName || 'Noma\'lum mijoz';
    
    // Show confirmation modal before deletion
    showConfirm(
      'Buyurtmani o\'chirish',
      `"${customerName}" buyurtmasini o\'chirishni xohlaysizmi?`,
      () => deleteOrder(order._id),
      () => {
        // Cancel callback - just close modal without any action
        console.log('Order deletion cancelled for:', customerName);
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
      // Get order info for notification before removing
      const deletedOrder = orders.find(o => o._id === id);
      
      // Use React Query mutation for automatic cache invalidation
      await deleteOrderMutation.mutateAsync(id);
      
      // Update local state for immediate UI feedback
      setOrders(prevOrders => prevOrders.filter(order => order._id !== id));
      
      // Update count
      setTotalCount(prevCount => {
        const newCount = prevCount - 1;
        onCountChange(newCount); // Dashboard update
        return newCount;
      });
      
      // Notification with order details
      setTimeout(() => {
        const orderIndex = orders.findIndex(o => o._id === id);
        const orderNumber = String(orderIndex + 1).padStart(4, '0');
        safeNotifySuccess("Buyurtma o'chirildi", `Buyurtma #${orderNumber} muvaffaqiyatli o'chirildi`);
        
        // Add real notification for notification bell
        if (deletedOrder) {
          notifyOrderDeleted(deletedOrder);
        }
        
        // Keep demo notification for modals
        addNotification({
          title: "Buyurtma o'chirildi",
          message: `Buyurtma #${orderNumber} - ${formatCurrency(deletedOrder?.totalAmount || 0)}`,
          type: 'order'
        });
      }, 0);
      
      // Auto-pagination adjustment
      const remainingOrders = orders.filter(order => order._id !== id).length;
      if (remainingOrders === 0 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }

      // Reload orders to get updated list
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
      // Show loading state immediately
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId 
            ? { ...order, status: newStatus, isUpdating: true }
            : order
        )
      );

      // Use React Query mutation for automatic cache invalidation
      const result = await updateOrderStatusMutation.mutateAsync({ id: orderId, status: newStatus });
      
      // Update the order in the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId 
            ? { ...order, status: newStatus, isUpdating: false }
            : order
        )
      );

      // Also update selectedOrder if it's currently being viewed in modal
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }

      setTimeout(() => {
        safeNotifySuccess('Status yangilandi', 'Buyurtma statusi muvaffaqiyatli yangilandi');
        
        // Show status change notification
        setStatusNotificationMessage(`Status "${statusMap[newStatus]?.text}" ga o'zgartirildi`);
        setShowStatusNotification(true);
        
        // Hide notification after 3 seconds
        setTimeout(() => {
          setShowStatusNotification(false);
        }, 3000);
      }, 0);

      // Reload orders to get updated list
      loadOrders();
    } catch (error) {
      // Revert the change if failed
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
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // Format as +998 (XX) XXX-XX-XX
    if (cleaned.length === 12 && cleaned.startsWith('998')) {
      const code = cleaned.substring(3, 5);
      const number = cleaned.substring(5);
      return `+998 (${code}) ${number.substring(0, 3)}-${number.substring(3, 5)}-${number.substring(5)}`;
    }
    return phone; // Return original if not in expected format
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

  // Simple pagination like the original
  const changePage = (direction) => {
    setCurrentPage(prev => {
      const newPage = direction === 'next' ? prev + 1 : prev - 1;
      return Math.max(1, Math.min(newPage, totalPages));
    });
  };

  // Original table-based rendering replaced with card-based layout
  const renderOrdersLayout = useMemo(() => {
    if (loading && !orders.length) {
      return (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Buyurtmalar yuklanmoqda..." />
        </div>
      );
    }
    
    if (!loading && !filteredOrders.length) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <i className="fas fa-shopping-cart text-gray-400 text-4xl mb-4"></i>
          <p className="text-gray-500">Buyurtmalar topilmadi</p>
          {(searchTerm || filterStatus) && (
            <button 
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('');
              }}
              className="mt-2 text-blue-500 hover:text-blue-700 text-sm"
            >
              Filtrni tozalash
            </button>
          )}
        </div>
      );
    }
    
    // OrderCard component for better mobile experience
    const OrderCard = ({ order, orderNumber }) => (
      <div 
        className={`bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer ${
          selectionMode && selectedOrders.has(order._id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
        } ${
          order.isDeleting ? 'opacity-50 pointer-events-none bg-red-50' : ''
        }`}
        onClick={() => !order.isDeleting && handleOrderClick(order)}
      >
        <div className="p-3 sm:p-4">
          {/* Mobile Layout */}
          <div className="sm:hidden">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                {selectionMode && (
                  <div className="flex items-center justify-center flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(order._id)}
                      onChange={() => handleOrderClick(order)}
                      className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2 touch-manipulation"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
                <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {order.isDeleting ? (
                    <i className="fas fa-spinner fa-spin text-red-600 text-xs"></i>
                  ) : (
                    <i className="fas fa-shopping-cart text-orange-600 text-xs"></i>
                  )}
                </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        order.isDeleting 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        #{orderNumber}{order.isDeleting ? ' - O\'chirilmoqda...' : ''}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 block">{formatDate(order.createdAt || order.orderDate)}</span>
                  </div>
              </div>
              {!selectionMode && (
                <div className="flex gap-1 flex-shrink-0">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      openViewModal(order);
                    }}
                    className="w-6 h-6 bg-gray-50 hover:bg-green-50 text-gray-600 hover:text-green-600 rounded-md transition-colors duration-200 flex items-center justify-center border border-gray-200 hover:border-green-200"
                    title="Ko'rish"
                  >
                    <i className="fas fa-eye text-xs"></i>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteConfirm(order);
                    }}
                    className="w-6 h-6 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-md transition-colors duration-200 flex items-center justify-center border border-gray-200 hover:border-red-200"
                    title="O'chirish"
                  >
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div>
                <p className="font-medium text-gray-900 text-sm truncate">{order.customerName}</p>
                <p className="text-xs text-blue-600 font-medium truncate">{formatPhoneNumber(order.customerPhone)}</p>
              </div>
              
              <div className="flex items-center justify-between">
                {!selectionMode && (
                  <div className="flex-shrink-0">
                    <select
                      value={order.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateOrderStatus(order._id, e.target.value);
                      }}
                      disabled={order.isUpdating}
                      className={`px-2 py-1 rounded text-xs font-medium cursor-pointer border-0 focus:ring-2 focus:ring-orange-500 mobile-friendly-options ${statusMap[order.status]?.class} ${order.isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {order.isUpdating ? (
                        <option value={order.status}>Yuklanmoqda...</option>
                      ) : (
                        statusOptions.slice(1).map(option => (
                          <option key={option.value} value={option.value}>
                            {statusMap[option.value]?.text}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                )}
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-orange-600">
                    {formatCurrency(order.totalAmount)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(order.items && order.items.length) || 0} mahsulot
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center gap-4">
            {/* Checkbox for selection mode */}
            {selectionMode && (
              <div className="flex items-center justify-center flex-shrink-0">
                <input
                  type="checkbox"
                  checked={selectedOrders.has(order._id)}
                  onChange={() => handleOrderClick(order)}
                 className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2 touch-manipulation"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            
            {/* Left: Order Icon & Info */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                {order.isDeleting ? (
                  <i className="fas fa-spinner fa-spin text-red-600 text-sm"></i>
                ) : (
                  <i className="fas fa-shopping-cart text-orange-600 text-sm"></i>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm px-3 py-1 rounded font-medium ${
                    order.isDeleting 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
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
                    <div className="text-sm text-gray-900 truncate">
                      {order.items[0].name} x{order.items[0].quantity}
                    </div>
                    {order.items.length > 1 && (
                      <div className="text-xs text-gray-500">
                        +{order.items.length - 1} boshqa
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-gray-500">Ma'lumot yo'q</span>
                )}
              </div>
            </div>

            {/* Status */}
            {!selectionMode && (
              <div className="flex-shrink-0">
                <select
                  value={order.status}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateOrderStatus(order._id, e.target.value);
                  }}
                  disabled={order.isUpdating}
                  className={`px-3 py-2 rounded text-sm font-medium cursor-pointer border-0 focus:ring-2 focus:ring-orange-500 ${statusMap[order.status]?.class} ${order.isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {order.isUpdating ? (
                    <option value={order.status}>Yuklanmoqda...</option>
                  ) : (
                    statusOptions.slice(1).map(option => (
                      <option key={option.value} value={option.value}>
                        {statusMap[option.value]?.text}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            {/* Amount */}
            <div className="flex-shrink-0 text-right">
              <div className="text-lg font-bold text-orange-600">
                {formatCurrency(order.totalAmount)}
              </div>
            </div>

            {/* Action Buttons - Icon Only */}
            {!selectionMode && (
              <div className="flex gap-1 flex-shrink-0">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openViewModal(order);
                  }}
                  className="w-8 h-8 bg-gray-50 hover:bg-green-50 text-gray-600 hover:text-green-600 rounded-lg transition-colors duration-200 flex items-center justify-center border border-gray-200 hover:border-green-200"
                  title="Ko'rish"
                >
                  <i className="fas fa-eye text-xs"></i>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteConfirm(order);
                  }}
                  className="w-8 h-8 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg transition-colors duration-200 flex items-center justify-center border border-gray-200 hover:border-red-200"
                  title="O'chirish"
                >
                  <i className="fas fa-trash text-xs"></i>
                </button>
              </div>
            )}
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
  }, [orders, loading, filteredOrders, paginatedOrders, totalCount, currentPage, itemsPerPage, statusMap, statusOptions, formatDate, formatPhoneNumber, formatCurrency, updateOrderStatus, openViewModal, openDeleteConfirm, searchTerm, filterStatus]);

  // The main render with original styling
  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        /* Mobile-friendly dropdown options */
        @media (max-width: 640px) {
          .mobile-friendly-options option {
            padding: 12px 8px;
            min-height: 44px;
            line-height: 1.4;
            font-size: 16px;
          }
          
          .mobile-friendly-options {
            font-size: 16px; /* Prevents zoom on iOS */
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
                <i className="fas fa-bars text-xl"></i>
              </button>
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-shopping-cart text-white text-xs sm:text-sm"></i>
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
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
                  <input
                    type="text"
                    placeholder="Qidirish..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-20 py-2 w-full border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                  />
                  <button
                    onClick={() => {
                      // Simple search - no debouncing needed
                    }}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-r-lg transition-colors duration-200"
                  >
                    Qidirish
                  </button>
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                      }}
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

          {/* Orders Count and Selection Controls */}
          <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs sm:text-sm text-gray-600">
              {searchTerm || filterStatus ? 
                `Qidiruv natijalari: ${filteredOrders.length} ta buyurtma` : 
                `Jami ${totalCount} ta buyurtma`
              }
            </p>
            
            {/* Selection controls */}
            {paginatedOrders.length > 0 && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={toggleSelectionMode}
                  className="text-sm text-orange-500 hover:text-orange-600 transition-colors px-3 py-1.5 rounded-lg border border-orange-500 hover:bg-orange-50 font-medium"
                >
                  {selectionMode ? 'Bekor qilish' : 'Tanlash'}
                </button>
              </div>
            )}
          </div>
          
          {/* Selection action buttons */}
          {selectionMode && paginatedOrders.length > 0 && (
            <div className="flex gap-2 mb-4 justify-end">
              <button
                onClick={selectAll}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm touch-manipulation min-w-[120px]"
              >
                Hammasini tanlash
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedOrders.size === 0}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
              >
                {selectedOrders.size > 0 ? `O'chirish (${selectedOrders.size})` : "O'chirish"}
              </button>
            </div>
          )}

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
                  <i className="fas fa-chevron-left mr-1"></i>
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
                  <i className="fas fa-chevron-right ml-1"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Existing modals */}
      <AdminNotificationModals
        alertModal={alertModal}
        confirmModal={confirmModal}
        promptModal={promptModal}
        closeAlert={closeAlert}
        onConfirmResponse={handleConfirmResponse}
        onPromptResponse={handlePromptResponse}
      />
      
      {/* Order View Modal */}
      {isViewModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
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
        </div>
      )}
      
      {/* Status Change Notification */}
      {showStatusNotification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 notification-enter max-w-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{statusNotificationMessage}</p>
            </div>
            <button 
              onClick={() => setShowStatusNotification(false)}
              className="ml-4 text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminOrders; 