import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  SearchFAIcon,
  TimesFAIcon,
  PlusFAIcon,
  EyeFAIcon,
  EditFAIcon,
  TrashFAIcon,
  ChevronLeftFAIcon,
  ChevronRightFAIcon,
  SpinnerFAIcon,
  RotateLeftFAIcon
} from './FontAwesome';
import { useDeleteProduct, useRestoreProduct, useUpdateProduct, useCreateProduct, useProducts } from '../hooks/useProductQueries';
import { useUltraFastProducts } from '../hooks/useUltraFastProducts';
import { useRecentActivitiesCache } from '../hooks/useRecentActivities';
import { queryClient, queryKeys } from '../lib/queryClient';

import AdminNotificationBell from './AdminNotificationBell';
import AdminNotificationModals from './AdminNotificationModals';
import LoadingCard from './LoadingCard';
import ProductLoader from './ProductLoader';
import ProductCardSkeleton from './ProductCardSkeleton';
import SimpleSpinner from './SimpleSpinner';
import useNotifications from '../hooks/useNotifications';
import useRealNotifications from '../hooks/useRealNotifications';
import ProductVariants from './admin/ProductVariants';
import ImageUploader from './admin/ImageUploader';
import VariantEditor from './admin/VariantEditor';
import SimpleProductForm from './admin/SimpleProductForm';
import VariantManager from './admin/VariantManager';
import OptimizedImage from './OptimizedImage';
import '../styles/select-styles.css';

const AdminProducts = ({ onCountChange, notifications, setNotifications }) => {
  const navigate = useNavigate();

  // Real notification system for notification bell
  const {
    notifications: realNotifications,
    setNotifications: setRealNotifications,
    markAllAsRead,
    markAsRead,
    deleteNotification,
    deleteAllNotifications,
    notifyProductAdded,
    notifyProductDeleted
  } = useRealNotifications(true, 30000);

  // Calculate unread count from real notifications
  const unreadCount = realNotifications.filter(notification => !notification.read).length;

  // Demo notification system for modals (keep existing modal functionality)
  const {
    notifications: notificationList,
    alertModal,
    confirmModal,
    promptModal,
    showAlert,
    showConfirm,
    closeAlert,
    handleConfirmResponse,
    handlePromptResponse,
    safeNotifySuccess,
    safeNotifyError,
    safeNotifyWarning,
    safeNotifyProductDeleted,
    addNotification
  } = useNotifications();

  // React Query hooks for product operations
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();

  // Debug mutation states (only when needed)
  if (process.env.NODE_ENV === 'development' && createProductMutation.isError) {
    console.log('🔍 Create mutation error:', createProductMutation.error);
  }

  // Recent activities cache management
  const activitiesCache = useRecentActivitiesCache();

  // State management
  const [products, setProducts] = useState([]);
  // Local loading removed; use React Query's isLoading/isFetching
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 100; // Increased to 100 per page for categories
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  // Modal states - simplified with new notification system
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);



  // Delete notification states
  const [showDeleteNotification, setShowDeleteNotification] = useState(false);
  const [deleteNotificationMessage, setDeleteNotificationMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    oldPrice: '',
    stock: '',
    unit: 'dona',
    images: [], // Changed from single image to images array
    badge: '',
    hasVariants: false,
    variants: []
  });
  const [selectedImages, setSelectedImages] = useState([]); // Changed from selectedImage to selectedImages
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for debouncing and initialization tracking
  const debounceTimeoutRef = useRef(null);
  const isInitializedRef = useRef(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debouncedCategory, setDebouncedCategory] = useState('');

  // React Query: fetch products with standard hook (same as homepage)
  const { data: productsData, isLoading, isFetching, isFetched, isSuccess, isError, error } =
    useProducts(debouncedCategory, debouncedSearch, currentPage, ITEMS_PER_PAGE);

  // Debug: Log filter values (disabled for performance)
  // useEffect(() => {
  //   console.log('🔍 Filter Debug:', {
  //     filterCategory,
  //     debouncedCategory,
  //     searchTerm,
  //     debouncedSearch,
  //     currentPage,
  //     ITEMS_PER_PAGE,
  //     productsData: productsData?.products?.length || 0,
  //     totalCount: productsData?.pagination?.totalCount || 0
  //   });
  // }, [filterCategory, debouncedCategory, searchTerm, debouncedSearch, currentPage, productsData]);

  // Debounce search/filter to reduce query churn
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setDebouncedCategory(filterCategory);
      setCurrentPage(1);
    }, 300); // 300ms debounce delay for faster response

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchTerm, filterCategory]);

  // Image slideshow state (per product)
  const imageIndexRef = useRef(new Map()); // productId -> current image index
  const [, setImageStateVersion] = useState(0); // bump to trigger rerender
  const hoverTimerRef = useRef(new Map()); // productId -> interval id
  const touchStartXRef = useRef(new Map()); // productId -> startX

  // Dynamic categories loaded from database
  const [categories, setCategories] = useState(['Barcha kategoriyalar']);

  // Main categories (asosiy kategoriyalar) - database'dagi haqiqiy nomlar
  const mainCategories = [
    'xoz-mag',
    'yevro-remont',
    'elektrika',
    'dekor', // Database'da 'dekor' saqlanadi
    'santexnika'
  ];

  // Category display names mapping (database name → display name)
  const categoryDisplayNames = {
    'xoz-mag': 'Xoz-Mag',
    'yevro-remont': 'Yevro-Remont',
    'elektrika': 'Elektrika',
    'dekor': 'Dekorativ-mahsulotlar', // Database'da 'dekor' saqlanadi
    'santexnika': 'Santexnika'
  };

  // Reverse mapping (display name → database name) - eski nomlarni yangi nomlarga mapping
  const categoryValueMapping = {
    'dekorativ-mahsulotlar': 'dekor', // Frontend'dan backend'ga
    'Dekorativ-mahsulotlar': 'dekor'
  };

  // Get display name for category
  const getCategoryDisplayName = (categoryName) => {
    return categoryDisplayNames[categoryName] || categoryName;
  };

  // Load categories from API with fallback to main categories
  const loadCategories = useCallback(async () => {
    try {
      const API_BASE = process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');
      const response = await fetch(`${API_BASE}/products/categories/list`);
      if (response.ok) {
        const categoriesData = await response.json();
        // Extract categories with counts
        if (categoriesData && Array.isArray(categoriesData.categories)) {
          const categoryArray = categoriesData.categories.map((c) => ({
            value: c.category,
            label: c.category,
            count: c.count
          }));
          setCategories([
            { name: 'Barcha kategoriyalar', count: categoryArray.reduce((sum, c) => sum + c.count, 0) },
            ...categoryArray
          ]);
        } else {
          // Fallback to simple array
          const extract = (data) => {
            if (Array.isArray(data)) return data;
            if (data && Array.isArray(data.categories)) {
              return data.categories
                .map((c) => (typeof c === 'string' ? c : (c?._id || c?.name)))
                .filter(Boolean);
            }
            return [];
          };
          const categoryArray = extract(categoriesData);
          setCategories(['Barcha kategoriyalar', ...categoryArray]);
        }
      } else {
        console.log('⚠️ API failed, using main categories as fallback');
        setCategories(['Barcha kategoriyalar', ...mainCategories]);
      }
    } catch (error) {
      console.error('❌ Error loading categories, using main categories as fallback:', error);
      // Ensure mainCategories is an array before spreading
      const categoryArray = Array.isArray(mainCategories) ? mainCategories : [];
      setCategories(['Barcha kategoriyalar', ...categoryArray]);
    }
  }, []);

  // Load categories on mount so selects are populated
  useEffect(() => {
    // Clear React Query cache for fresh data
    queryClient.clear();
    loadCategories();
  }, [loadCategories]);

  // Build a merged, unique categories list for selects.
  // Ensures the current product's category (formData.category) is present.
  const mergedCategories = useMemo(() => {
    const set = new Set();
    // Add main categories first (priority order)
    mainCategories.forEach((c) => c && set.add(c));
    // Add dynamic categories (skip the placeholder)
    categories.forEach((c) => {
      if (!c) return;
      if (typeof c === 'string') {
        if (c !== 'Barcha kategoriyalar') set.add(c);
      } else {
        const val = c?.name || c?._id;
        if (val && val !== 'Barcha kategoriyalar') set.add(val);
      }
    });
    // Ensure currently selected form category is selectable
    if (formData?.category) set.add(formData.category);
    return Array.from(set);
  }, [mainCategories, categories, formData?.category]);

  // React Query mutations for product actions
  const { mutateAsync: softDeleteProductMutate } = useDeleteProduct();
  const { mutateAsync: restoreProductMutate } = useRestoreProduct();

  // categoryMap removed - now using direct category names from database

  const badgeOptions = [
    { value: '', label: "Badge yo'q" },
    { value: 'Mashhur', label: 'Mashhur' },
    { value: 'Yangi', label: 'Yangi' }
  ];

  const unitOptions = [
    { value: 'dona', label: 'Dona' },
    { value: 'kg', label: 'Kilogramm' },
    { value: 'm', label: 'Metr' },
    { value: 'm2', label: 'Kvadrat metr' },
    { value: 'm3', label: 'Kub metr' },
    { value: 'litr', label: 'Litr' },
    { value: 'paket', label: 'Paket' },
    { value: 'rulon', label: 'Rulon' }
  ];

  // Collect all possible images for a product (variants -> product.images -> product.image)
  const getAllProductImages = useCallback((product) => {
    const allImages = [];
    try {
      if (product?.hasVariants && Array.isArray(product?.variants)) {
        product.variants.forEach(variant => {
          if (Array.isArray(variant?.options)) {
            variant.options.forEach(option => {
              if (Array.isArray(option?.images) && option.images.length > 0) {
                allImages.push(...option.images);
              } else if (option?.image) {
                allImages.push(option.image);
              }
            });
          }
        });
      }
      if (allImages.length === 0) {
        if (Array.isArray(product?.images) && product.images.length > 0) {
          allImages.push(...product.images);
        } else if (product?.image) {
          allImages.push(product.image);
        }
      }
    } catch (e) {
      // ignore, fallback below
    }
    const unique = [...new Set(allImages.filter(Boolean))];
    // Normalize paths for frontend rendering
    const normalized = unique.map((img) => {
      try {
        let s = String(img || '');
        // Fix Windows backslashes
        s = s.replace(/\\/g, '/');
        // Ensure leading slash for uploads
        if (s.startsWith('uploads/')) s = '/' + s;
        return s;
      } catch (_) {
        return img;
      }
    });
    return normalized.length > 0 ? normalized : [];
  }, []);

  // Handlers to change images on hover/move and touch
  const startHoverSlideshow = useCallback((product) => {
    const id = product?._id || product?.id;
    const images = getAllProductImages(product);
    if (!id || images.length <= 1) return;
    if (hoverTimerRef.current.get(id)) return; // already running
    const interval = setInterval(() => {
      const current = imageIndexRef.current.get(id) || 0;
      const next = (current + 1) % images.length;
      imageIndexRef.current.set(id, next);
      setImageStateVersion(v => v + 1);
    }, 1200);
    hoverTimerRef.current.set(id, interval);
  }, [getAllProductImages]);

  const stopHoverSlideshow = useCallback((product) => {
    const id = product?._id || product?.id;
    if (!id) return;
    const interval = hoverTimerRef.current.get(id);
    if (interval) {
      clearInterval(interval);
      hoverTimerRef.current.delete(id);
    }
  }, []);

  // Removed mouse move based switcher to keep UX simple; using slideshow on hover instead.

  const handleTouchStartOnImage = useCallback((product, e) => {
    const id = product?._id || product?.id;
    const images = getAllProductImages(product);
    if (!id || images.length <= 1) return;
    const touch = e.touches && e.touches[0];
    if (!touch) return;
    touchStartXRef.current.set(id, touch.clientX);
  }, [getAllProductImages]);

  const handleTouchEndOnImage = useCallback((product, e) => {
    const id = product?._id || product?.id;
    const images = getAllProductImages(product);
    if (!id || images.length <= 1) return;
    const touch = e.changedTouches && e.changedTouches[0];
    const startX = touchStartXRef.current.get(id);
    if (!touch || typeof startX !== 'number') return;
    const deltaX = touch.clientX - startX;
    const threshold = 30; // px
    let current = imageIndexRef.current.get(id) || 0;
    if (deltaX <= -threshold) {
      // swipe left -> next
      current = (current + 1) % images.length;
      // prevent triggering click after swipe
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    } else if (deltaX >= threshold) {
      // swipe right -> prev
      current = (current - 1 + images.length) % images.length;
      // prevent triggering click after swipe
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    } else {
      return; // ignore tiny moves
    }
    imageIndexRef.current.set(id, current);
    setImageStateVersion(v => v + 1);
  }, [getAllProductImages]);

  // Cleanup hover timers on unmount
  useEffect(() => {
    return () => {
      try {
        hoverTimerRef.current.forEach((intervalId) => clearInterval(intervalId));
        hoverTimerRef.current.clear();
      } catch (_) { }
    };
  }, []);

  // Debounce search/filter to reduce query churn
  useEffect(() => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setDebouncedCategory(filterCategory);
      setCurrentPage(1);
    }, 300);
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, [searchTerm, filterCategory]);

  // Restore product with confirmation
  const openRestoreConfirm = (product) => {
    if (!product || !product._id) {
      setTimeout(() => {
        safeNotifyError('Xatolik', 'Mahsulot ma\'lumotlari to\'g\'ri emas');
      }, 0);
      return;
    }
    const title = 'Mahsulotni tiklash';
    const message = `"${product.name}" mahsuloti tiklansinmi?`;
    setSelectedProduct(product);
    showConfirm(title, message, () => restoreProduct(product._id), null, 'info');
  };

  const restoreProduct = async (id) => {
    if (!id) {
      setTimeout(() => {
        safeNotifyError('Xatolik', 'Mahsulot ID si topilmadi');
      }, 0);
      return;
    }
    try {
      await restoreProductMutate({ id });
      // If the product is in the current list, update its status locally
      setProducts(prev => prev.map(p => p._id === id ? { ...p, isDeleted: false, status: 'active' } : p));
      setTimeout(() => {
        safeNotifySuccess('Tiklandi', 'Mahsulot muvaffaqiyatli tiklandi');
      }, 0);
      // Invalidate to keep pagination/count accurate
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    } catch (error) {
      console.error('Mahsulotni tiklashda xatolik:', error);
      setTimeout(() => {
        safeNotifyError('Xatolik', (error && error.message) ? error.message : 'Tiklash amalga oshmadi');
      }, 0);
    }
  };

  // Prefetch next page when available
  useEffect(() => {
    const p = productsData?.pagination;
    if (p?.hasNextPage) {
      const nextPage = (p.currentPage || currentPage) + 1;
      const key = queryKeys.products.list(debouncedCategory, debouncedSearch, nextPage, ITEMS_PER_PAGE);
      const params = new URLSearchParams({
        limit: String(ITEMS_PER_PAGE),
        page: String(nextPage),
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      });
      if (debouncedCategory) params.append('category', debouncedCategory);
      if (debouncedSearch) params.append('search', debouncedSearch);
      queryClient.prefetchQuery({
        queryKey: key,
        queryFn: ({ signal }) => {
          const API_BASE = process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');
          return fetch(`${API_BASE}/products?${params.toString()}`, { signal }).then(r => r.json());
        },
        staleTime: 2 * 60 * 1000,
      });
    }
  }, [productsData, debouncedCategory, debouncedSearch, currentPage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        // console.log('🧹 Komponent unmount: timeout tozalandi');
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Prevent body scrolling when any modal is open
  useEffect(() => {
    if (isModalOpen || isViewModalOpen || alertModal?.show || confirmModal?.show || promptModal?.show) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    // Cleanup function to remove class when component unmounts
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isModalOpen, isViewModalOpen, alertModal?.show, confirmModal?.show, promptModal?.show]);

  // Debug: Monitor formData changes (removed for performance)

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isModalOpen]);

  const openAddModal = () => {
    setSelectedProduct(null);
    setFormData({
      name: '',
      category: '',
      description: '',
      price: '',
      oldPrice: '',
      stock: '',
      unit: 'dona',
      images: [], // Changed from single image to images array
      badge: '',
      hasVariants: false,
      variants: []
    });
    setSelectedImages([]); // Changed from selectedImage to selectedImages
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    // Product null yoki undefined bo'lsa, xatolik ko'rsatamiz
    if (!product || !product._id) {
      setTimeout(() => {
        safeNotifyError('Xatolik', 'Mahsulot ma\'lumotlari to\'g\'ri emas');
      }, 0);
      return;
    }

    // console.log('🔍 Tahrirlash uchun mahsulot ma\'lumotlari:', JSON.stringify(product, null, 2));

    // Mahsulot rasmlarini to'g'ri olish
    const productImages = (product.images && product.images.length > 0)
      ? product.images
      : (product.image ? [product.image] : []);

    // Images loaded successfully

    // Product data loaded for editing
    console.log('🔍 Product description from API:', product.description);
    console.log('🔍 Product keys from API:', Object.keys(product));

    setSelectedProduct(product);
    setFormData({
      name: product.name || '',
      category: (product.category || '').trim(),
      description: product.description || '',
      price: product.price ? product.price.toString() : '',
      oldPrice: product.oldPrice ? product.oldPrice.toString() : '',
      stock: product.stock ? product.stock.toString() : '',
      unit: product.unit || 'dona',
      images: productImages, // Mavjud rasmlarni saqlash
      badge: product.badge || '',
      hasVariants: product.hasVariants || false,
      variants: product.variants || []
    });
    setSelectedImages([]); // Faqat yangi qo'shiladigan rasmlar uchun
    setIsModalOpen(true);
  };

  const openViewModal = (product) => {
    // Product null yoki undefined bo'lsa, xatolik ko'rsatamiz
    if (!product || !product._id) {
      setTimeout(() => {
        safeNotifyError('Xatolik', 'Mahsulot ma\'lumotlari to\'g\'ri emas');
      }, 0);
      return;
    }

    setSelectedProduct(product);
    setIsViewModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setFormData({
      name: '',
      category: '',
      description: '',
      price: '',
      oldPrice: '',
      stock: '',
      unit: 'dona',
      images: [], // Changed from single image to images array
      badge: '',
      hasVariants: false,
      variants: []
    });
    setSelectedImages([]); // Changed from selectedImage to selectedImages
  };

  const openDeleteConfirm = (product) => {
    if (!product || !product._id) {
      setTimeout(() => {
        safeNotifyError('Xatolik', 'Mahsulot ma\'lumotlari to\'g\'ri emas');
      }, 0);
      return;
    }

    // Show confirmation modal before deletion
    showConfirm(
      'Mahsulotni o\'chirish',
      `"${product.name}" mahsulotini o'chirishni xohlaysizmi?`,
      () => deleteProduct(product._id),
      null, // onCancel callback - null means just close modal
      'danger'
    );
  };

  const deleteProduct = async (id) => {
    if (!id) {
      setTimeout(() => {
        safeNotifyError('Xatolik', 'Mahsulot ID si topilmadi');
      }, 0);
      return;
    }

    try {
      // Soft-delete via React Query mutation (backend marks isDeleted: true)
      await softDeleteProductMutate(id);

      // Get product info for notification before removing
      const deletedProduct = products.find(p => p._id === id);
      const productName = deletedProduct?.name || 'Mahsulot';
      const productPrice = deletedProduct?.price || 0;

      // Muvaffaqiyatli o'chirish
      setProducts(prevProducts => prevProducts.filter(product => product._id !== id));
      setTotalCount(prev => {
        const newCount = prev - 1;
        // Prevent setState during render by deferring onCountChange
        if (onCountChange) {
          setTimeout(() => {
            onCountChange(newCount);
          }, 0);
        }
        return newCount;
      });

      // Show deletion notification and add to recent activities
      notifyProductDeleted({
        _id: id,
        name: productName,
        price: productPrice
      });

      // Show delete notification
      setDeleteNotificationMessage(`Mahsulot "${productName}" o'chirildi`);
      setShowDeleteNotification(true);

      // Hide notification after 3 seconds
      setTimeout(() => {
        setShowDeleteNotification(false);
      }, 3000);
    } catch (error) {
      console.error('Mahsulot o\'chirishda xatolik:', error);

      // Tarmoq xatoligi uchun modal
      setTimeout(() => {
        safeNotifyError('Xatolik', (error && error.message) ? error.message : 'Server bilan bog\'lanishda xatolik yuz berdi');
      }, 0);
    }
  };

  // cancelDelete function removed - now using useNotifications hook

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Majburiy maydonlarni tekshirish
    if (!formData.name.trim() || !formData.category) {
      setTimeout(() => {
        safeNotifyError('Xatolik', 'Mahsulot nomi va kategoriya kiritilishi shart');
      }, 0);
      return;
    }

    // Variant bo'lmagan mahsulotlar uchun narx va stock tekshirish
    if (!formData.hasVariants) {
      if (!formData.price || !formData.stock) {
        setTimeout(() => {
          safeNotifyError('Xatolik', 'Narx va zaxira kiritilishi shart');
        }, 0);
        return;
      }
    } else {
      // Variant bo'lgan mahsulotlar uchun kamida bitta variant bo'lishi kerak
      if (!formData.variants || formData.variants.length === 0) {
        setTimeout(() => {
          safeNotifyError('Xatolik', 'Kamida bitta variant qo\'shish kerak');
        }, 0);
        return;
      }

      // Har bir variantda kamida bitta option bo'lishi kerak
      const hasValidVariants = formData.variants.every(variant =>
        variant.name && variant.options && variant.options.length > 0 &&
        variant.options.every(option =>
          option.value && option.price && option.stock !== undefined
        )
      );

      if (!hasValidVariants) {
        setTimeout(() => {
          safeNotifyError('Xatolik', 'Barcha variantlar to\'liq to\'ldirilishi kerak');
        }, 0);
        return;
      }
    }

    setIsSubmitting(true);


    try {
      // For non-variant products, rely on images managed by SimpleProductForm's ImageUploader
      let allImages = formData.images || [];
      if (!formData.hasVariants) {
        // Ensure at least one image is provided for non-variant products
        if (allImages.length === 0) {
          safeNotifyError('Xatolik', 'Kamida bitta rasm qo\'shish kerak');
          setIsSubmitting(false);
          return;
        }
      } else {
        // For variant products, images are handled within variants
        // Check if at least one variant has images
        const hasVariantImages = formData.variants.some(variant =>
          variant.options.some(option => option.images && option.images.length > 0)
        );
        if (!hasVariantImages) {
          safeNotifyError('Xatolik', 'Kamida bitta variant uchun rasm qo\'shish kerak');
          setIsSubmitting(false);
          return;
        }
      }

      const productData = {
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim(),
        unit: formData.unit,
        badge: formData.badge,
        hasVariants: formData.hasVariants,
        variants: formData.variants || [],
        rating: 0,
        reviews: 0,
        status: 'active'
      };

      // Product data prepared for submission

      // Add price, stock, and images based on variant status
      if (formData.hasVariants) {
        // For variant products, use base price from first variant or 0
        const firstVariantOption = formData.variants[0]?.options[0];
        productData.price = firstVariantOption?.price ? parseFloat(firstVariantOption.price) : 0;
        productData.oldPrice = firstVariantOption?.oldPrice ? parseFloat(firstVariantOption.oldPrice) : null;
        productData.stock = formData.variants.reduce((total, variant) =>
          total + variant.options.reduce((sum, option) => sum + (parseInt(option.stock) || 0), 0), 0
        );
        productData.image = firstVariantOption?.images?.[0] || '';
        productData.images = firstVariantOption?.images || [];
      } else {
        // For non-variant products, use form data
        productData.price = parseFloat(formData.price);
        productData.oldPrice = formData.oldPrice ? parseFloat(formData.oldPrice) : null;
        productData.stock = parseInt(formData.stock);
        productData.image = allImages[0]; // First image for backward compatibility
        productData.images = allImages; // All images array
      }


      // Use React Query mutations for automatic cache invalidation
      if (selectedProduct && selectedProduct._id) {
        // Update existing product using React Query mutation
        const updatedProduct = await updateProductMutation.mutateAsync({
          id: selectedProduct._id,
          ...productData
        });

        // console.log('✅ Muvaffaqiyatli yangilandi:', updatedProduct);

        setTimeout(() => {
          safeNotifySuccess('Mahsulot yangilandi', `${productData.name} muvaffaqiyatli yangilandi`);
        }, 0);
      } else {
        // Create new product using React Query mutation
        const newProduct = await createProductMutation.mutateAsync(productData);

        setTimeout(() => {
          safeNotifySuccess('Mahsulot qo\'shildi', `${productData.name} muvaffaqiyatli qo\'shildi`);
          // Add to recent activities
          notifyProductAdded(newProduct);
        }, 0);
      }

      // Close modal after successful operation
      closeModal();

      // Refresh notifications and recent activities
      setTimeout(() => {
        // Invalidate notifications to show new notification
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        // Refresh recent activities to show new activity
        if (activitiesCache && activitiesCache.refreshAll) {
          activitiesCache.refreshAll();
        }
        // Reload categories to include new ones (if any)
        loadCategories();
      }, 300);

    } catch (error) {
      console.error('❌ Mahsulot saqlashda xatolik:', error);

      // Extract error message from different error formats
      let errorMessage = 'Mahsulot saqlanmadi';

      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      // Handle specific error types
      if (error?.response?.status === 409 || error?.code === 'DUPLICATE_SLUG' || errorMessage.includes('Slug')) {
        setTimeout(() => {
          safeNotifyError('Slug xatosi', "Slug allaqachon mavjud. Iltimos mahsulot nomini o'zgartiring.");
        }, 0);
        // Keep modal open so user can adjust the name and resubmit
        return;
      } else if (error?.response?.status === 400 || errorMessage.includes('Validation')) {
        setTimeout(() => {
          safeNotifyError('Xatolik', "Yaroqsiz ma'lumotlar kiritildi");
        }, 0);
        return;

      } else {
        setTimeout(() => {
          safeNotifyError('Xatolik', errorMessage);
        }, 0);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const changePage = (direction) => {
    setCurrentPage(prev => {
      const newPage = direction === 'next' ? prev + 1 : prev - 1;
      return Math.max(1, Math.min(newPage, totalPages));
    });
  };

  // Old modal functions removed - now using useNotifications hook

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // getCategoryName function removed - now using direct category names from database

  const getProductInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getAvatarGradient = (name) => {
    const gradients = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-orange-500 to-orange-600',
      'from-red-500 to-red-600',
      'from-indigo-500 to-indigo-600'
    ];
    const index = name.length % gradients.length;
    return gradients[index];
  };

  const getStockStatus = (stock) => {
    if (stock > 100) return { text: 'Zaxira', class: 'bg-green-100 text-green-800' };
    if (stock > 20) return { text: 'O\'rtacha', class: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Kam', class: 'bg-red-100 text-red-800' };
  };
  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const handleFilterChange = (value) => {
    console.log('🔄 Filter changed to:', value);
    setFilterCategory(value);

    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Map frontend category to backend category if needed
    const mappedValue = categoryValueMapping[value] || value;
    console.log('🔄 Mapped category value:', value, '→', mappedValue);

    // Immediately apply the filter change
    setDebouncedCategory(mappedValue);
    setDebouncedSearch(searchTerm); // Keep current search
    setCurrentPage(1);

    // Clear cache to force refetch with specific pattern
    queryClient.invalidateQueries({
      queryKey: ['products'],
      exact: false // Invalidate all products queries
    });

    // Also remove all cached data
    queryClient.removeQueries({
      queryKey: ['products'],
      exact: false
    });
  };

  const clearSearchAndFilter = () => {
    setSearchTerm('');
    setFilterCategory('');
    setCurrentPage(1);

    // Clear debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Immediately clear debounced values
    setDebouncedSearch('');
    setDebouncedCategory('');

    // Clear cache to force refetch with specific pattern
    queryClient.invalidateQueries({
      queryKey: ['products'],
      exact: false // Invalidate all products queries
    });

    // Also remove all cached data
    queryClient.removeQueries({
      queryKey: ['products'],
      exact: false
    });
  };

  // ... (rest of the code remains the same)

  const removeExistingImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const removeSelectedImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const moveImageDown = (index, isSelected) => {
    if (isSelected) {
      setSelectedImages(prev => {
        if (index >= prev.length - 1) return prev;
        const newImages = [...prev];
        [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
        return newImages;
      });
    } else {
      setFormData(prev => {
        if (index >= prev.images.length - 1) return prev;
        const newImages = [...prev.images];
        [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
        return { ...prev, images: newImages };
      });
    }
  };

  // Derive products and pagination from query
  const queriedProducts = productsData?.products || [];
  useEffect(() => {
    setProducts(queriedProducts);
    const p = productsData?.pagination;

    // Calculate total pages based on total count
    const totalProductCount = p?.totalCount || productsData?.totalCount || 0;
    const calculatedTotalPages = Math.ceil(totalProductCount / ITEMS_PER_PAGE);

    // API pagination ma'lumotlaridan foydalanish
    const apiTotalPages = p?.totalPages || Math.ceil(223 / ITEMS_PER_PAGE);
    const apiTotalCount = p?.total || 223;

    // Agar API'dan ma'lumot kelmasa, majburiy ravishda pagination qo'shish
    const finalTotalPages = apiTotalPages;
    const finalTotalCount = apiTotalCount;

    setTotalPages(finalTotalPages);
    setTotalCount(finalTotalCount);


  }, [productsData]);

  const loading = isLoading;
  // Show skeleton only during initial loading, not during refetching
  const showSkeleton = (!isSuccess && !isError) || (loading && !products?.length);
  const showEmpty = isSuccess && !loading && (products?.length || 0) === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
      /* Notification animations */
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      
      .notification-enter {
        animation: slideInRight 0.3s ease-out;
      }
      
      .notification-exit {
        animation: slideOutRight 0.3s ease-in;
      }
    `}</style>
      {/* Main Content */}
      <main className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
        {/* Top Bar: Title + Notification Bell (no mobile menu) */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-primary-dark">Mahsulotlar</h2>
          <div className="flex items-center gap-2 sm:gap-3">
            <AdminNotificationBell
              notifications={realNotifications}
              unreadCount={unreadCount}
              markAllAsRead={markAllAsRead}
              markAsRead={markAsRead}
              deleteNotification={deleteNotification}
              deleteAllNotifications={deleteAllNotifications}
            />
            <span className="text-xs sm:text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
              <span className="hidden sm:inline">{totalCount} ta mahsulot</span>
              <span className="sm:hidden">{totalCount}</span>
            </span>
          </div>
        </div>

        {/* Mobile-only divider under header */}
        <div className="sm:hidden border-b border-gray-200 mb-3"></div>

        {/* Search and Filters Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full">
            {/* Search - first row full width on mobile */}
            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                placeholder="Mahsulot qidirish..."
                value={searchTerm}
                onChange={e => {
                  const value = e.target.value;
                  handleSearchChange(value);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    // console.log('🔍 Enter bosildi, qidiruv boshlandi');
                    if (debounceTimeoutRef.current) {
                      clearTimeout(debounceTimeoutRef.current);
                    }
                    // Immediately apply debounced values and reset to page 1
                    setDebouncedSearch(searchTerm);
                    setDebouncedCategory(filterCategory);
                    setCurrentPage(1);
                    // Trigger React Query to refetch with updated params
                    queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
                  }
                }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-orange w-full sm:w-64"
              />
              <SearchFAIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              {(searchTerm || filterCategory) && (
                <button
                  onClick={clearSearchAndFilter}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <TimesFAIcon />
                </button>
              )}
            </div>
            {/* Row 2 on mobile: Category + Add button in one row */}
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={e => {
                  const value = e.target.value;
                  handleFilterChange(value);
                }}
                className="custom-select flex-1"
              >
                {categories.map(category => {
                  if (typeof category === 'string') {
                    return (
                      <option key={category} value={category === 'Barcha kategoriyalar' ? '' : category}>
                        {category}
                      </option>
                    );
                  } else {
                    const displayName = getCategoryDisplayName(category.name);
                    return (
                      <option key={category.name} value={category.name === 'Barcha kategoriyalar' ? '' : category.name}>
                        {category.name === 'Barcha kategoriyalar' ? category.name : `${displayName} (${category.count})`}
                      </option>
                    );
                  }
                })}
              </select>

              {/* Add Product Button */}
              <button
                onClick={openAddModal}
                className="bg-primary-orange text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-opacity-90 transition duration-300 whitespace-nowrap"
              >
                <PlusFAIcon className="mr-2" />Yangi mahsulot
              </button>

              {/* Base64 Conversion Button */}
              <button
                onClick={() => navigate('/admin/base64-conversion')}
                className="bg-purple-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-purple-700 transition duration-300 whitespace-nowrap inline-flex items-center"
                title="Base64 rasmlarni URL formatiga o'tkazish"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Base64 Konvertatsiya
              </button>


            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="mb-6">
          {showSkeleton ? (
            <SimpleSpinner
              message="Mahsulotlar yuklanmoqda..."
              size="large"
            />
          ) : showEmpty ? (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-500">Mahsulot topilmadi</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
              {products.map((product) => (
                <div key={product._id || product.id} className="group bg-white rounded-lg shadow-md p-2 sm:p-2.5 md:p-3 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border border-gray-200 hover:border-orange-200 relative h-full flex flex-col">
                  {/* Product Image */}
                  <div
                    className="relative cursor-pointer overflow-hidden rounded-lg mb-2 sm:mb-3 border border-gray-100 bg-white h-44 sm:h-52 lg:h-60"
                    onClick={() => openViewModal(product)}
                    onMouseEnter={() => startHoverSlideshow(product)}
                    onMouseLeave={() => { stopHoverSlideshow(product); }}
                    onTouchStart={(e) => handleTouchStartOnImage(product, e)}
                    onTouchEnd={(e) => handleTouchEndOnImage(product, e)}
                  >
                    {(function () { const imgs = getAllProductImages(product); return imgs && imgs.length > 0; })() ? (
                      <OptimizedImage
                        src={(function () { const imgs = getAllProductImages(product); const id = product?._id || product?.id; const idx = (id && imageIndexRef.current.get(id)) || 0; return imgs[idx] || imgs[0]; })()}
                        alt={product.name}
                        className="w-full h-full p-2 bg-white transition-transform duration-300 group-hover:scale-105"
                        placeholder="skeleton"
                        objectFit="contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center bg-gradient-to-r ${getAvatarGradient(product.name)}`}>
                        <span className="text-white text-2xl font-bold">{getProductInitials(product.name)}</span>
                      </div>
                    )}
                    {product.badge && (
                      <div className="absolute top-2 left-2">
                        <span className="bg-primary-orange text-white text-xs px-2 py-1 rounded-full">
                          {product.badge}
                        </span>
                      </div>
                    )}
                    {product.oldPrice && product.oldPrice > product.price && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                          -{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStockStatus(product.stock).class}`}>
                        {getStockStatus(product.stock).text}
                      </span>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="flex flex-col flex-1">
                    <div className="mb-2">
                      <h3 className="font-semibold text-xs sm:text-sm md:text-base text-gray-900 leading-tight hover:text-primary-orange transition-colors duration-200 line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
                    </div>
                    {product.description && (
                      <div className="bg-slate-50 p-2 rounded border-l-2 border-slate-200 mb-3">
                        <p className="text-slate-600 text-[11px] sm:text-xs leading-snug line-clamp-2 m-0">{product.description}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base sm:text-lg font-bold text-primary-orange">{formatCurrency(product.price)}</span>
                        {product.oldPrice && product.oldPrice > product.price && (
                          <span className="text-xs sm:text-sm text-gray-400 line-through">{formatCurrency(product.oldPrice)}</span>
                        )}
                      </div>
                      <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap flex-shrink-0">{product.stock} {product.unit}</span>
                    </div>
                    <div className="mt-auto flex gap-1.5 pt-2">
                      <button
                        onClick={() => openViewModal(product)}
                        className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 py-2 px-1 rounded-md font-medium transition-colors duration-200 flex items-center justify-center border border-green-200"
                        title="Ko'rish"
                        aria-label="Ko'rish"
                      >
                        <EyeFAIcon className="text-green-600 text-sm" />
                        <span className="hidden sm:inline ml-1 text-xs">Ko'rish</span>
                      </button>
                      <button
                        onClick={() => openEditModal(product)}
                        className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-1 rounded-md font-medium transition-colors duration-200 flex items-center justify-center border border-blue-200"
                        title="Tahrirlash"
                        aria-label="Tahrirlash"
                      >
                        <EditFAIcon className="text-blue-600 text-sm" />
                        <span className="hidden sm:inline ml-1 text-xs">Tahrir</span>
                      </button>
                      {(product?.isDeleted || product?.status === 'inactive') && (
                        <button
                          onClick={() => openRestoreConfirm(product)}
                          className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 py-2 px-1 rounded-md font-medium transition-colors duration-200 flex items-center justify-center border border-green-200"
                          title="Tiklash"
                          aria-label="Tiklash"
                        >
                          <RotateLeftFAIcon className="text-green-600 text-sm" />
                          <span className="hidden sm:inline ml-1 text-xs">Tiklash</span>
                        </button>
                      )}
                      <button
                        onClick={() => openDeleteConfirm(product)}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 py-2 px-1 rounded-md font-medium transition-colors duration-200 flex items-center justify-center border border-red-200"
                        title="O'chirish"
                        aria-label="O'chirish"
                      >
                        <TrashFAIcon className="text-red-600 text-sm" />
                        <span className="hidden sm:inline ml-1 text-xs">O'chir</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Pagination - har doim ko'rsatish agar totalPages > 1 bo'lsa */}
        {
          totalPages > 1 && (
            <div className="flex justify-center mt-6 sm:mt-8 space-x-1 sm:space-x-2">
              {/* Previous Page */}
              {currentPage > 1 && (
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold transition-colors text-base sm:text-lg flex items-center justify-center hover:shadow-md"
                >
                  ←
                </button>
              )}

              {/* Page Numbers - Responsive Sliding Window */}
              {(() => {
                const maxVisiblePages = window.innerWidth < 640 ? 5 : 10;
                let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                // Agar oxirgi sahifaga yaqin bo'lsa, boshlanishni tuzatish
                if (endPage - startPage + 1 < maxVisiblePages) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }

                return Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                  const pageNum = startPage + i;
                  const isCurrentPage = pageNum === currentPage;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg font-bold transition-colors text-base sm:text-lg flex items-center justify-center ${isCurrentPage
                        ? 'bg-primary-orange text-white shadow-lg'
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-700 hover:shadow-md'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                });
              })()}

              {/* Next Page */}
              {currentPage < totalPages && (
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold transition-colors text-base sm:text-lg flex items-center justify-center hover:shadow-md"
                >
                  →
                </button>
              )}
            </div>
          )
        }

        {/* Ma'lumot qatori - responsive */}
        {
          totalCount > 0 && (
            <div className="text-center text-xs sm:text-sm text-gray-600 mt-3 sm:mt-4 px-2">
              <span className="hidden sm:inline">
                {filterCategory ? `"${getCategoryDisplayName(filterCategory)}" kategoriyasida` : 'Barcha kategoriyalarda'} {totalCount} ta mahsulotdan {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} tasi ko'rsatilmoqda
              </span>
              <span className="sm:hidden">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} / {totalCount}
                {filterCategory && <div className="text-xs text-gray-500 mt-1">"{getCategoryDisplayName(filterCategory)}"</div>}
              </span>
            </div>
          )
        }
      </main >

      {/* Add/Edit Modal */}
      {isModalOpen && document.body && createPortal(
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center modal-overlay overflow-hidden p-4"
          style={{ zIndex: 99999 }}
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 rounded-t-lg z-20">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold text-gray-900">
                  {selectedProduct ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot qo\'shish'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <TimesFAIcon className="text-xl" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Mahsulot nomi *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                    placeholder="Mahsulot nomini kiriting"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Kategoriya *
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="custom-select custom-select-modal"
                    required
                  >
                    <option value="">Kategoriya tanlang</option>
                    {mergedCategories.map(category => (
                      <option key={category} value={category}>
                        {getCategoryDisplayName(category)}
                      </option>
                    ))}
                  </select>
                </div>



                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    O'lchov birligi
                  </label>
                  <select
                    value={formData.unit === 'boshqa' ? 'boshqa' : (unitOptions.find(opt => opt.value === formData.unit) ? formData.unit : 'boshqa')}
                    onChange={e => {
                      if (e.target.value === 'boshqa') {
                        setFormData(prev => ({ ...prev, unit: '' }));
                      } else {
                        setFormData(prev => ({ ...prev, unit: e.target.value }));
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                  >
                    {unitOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                    <option value="boshqa">Boshqa</option>
                  </select>
                  {(formData.unit === '' || !unitOptions.find(opt => opt.value === formData.unit)) && (
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent mt-2"
                      placeholder="Masalan: qop, quti, to'plam"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Badge (Chegirma badge yo'q)
                </label>
                <select
                  value={formData.badge}
                  onChange={e => setFormData(prev => ({ ...prev, badge: e.target.value }))}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent w-auto inline-block max-w-full"
                >
                  {badgeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tavsif
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent resize-none"
                  placeholder="Mahsulot haqida batafsil ma'lumot"
                />
              </div>

              {/* Variant System Toggle */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="hasVariants"
                    checked={formData.hasVariants}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      hasVariants: e.target.checked,
                      variants: e.target.checked ? prev.variants : []
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="hasVariants" className="ml-2 block text-sm font-medium text-gray-700">
                    Bu mahsulotda variantlar bor (rang, o'lcham, xotira va h.k.)
                  </label>
                </div>

                {formData.hasVariants ? (
                  <div className="mt-4">
                    <VariantManager
                      variants={formData.variants}
                      onVariantsChange={(variants) => setFormData(prev => ({ ...prev, variants }))}
                    />
                  </div>
                ) : (
                  <div className="mt-4">
                    <SimpleProductForm
                      price={formData.price}
                      oldPrice={formData.oldPrice}
                      stock={formData.stock}
                      images={formData.images}
                      onPriceChange={(price) => setFormData(prev => ({ ...prev, price }))}
                      onOldPriceChange={(oldPrice) => setFormData(prev => ({ ...prev, oldPrice }))}
                      onStockChange={(stock) => setFormData(prev => ({ ...prev, stock }))}
                      onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
                    />
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-white pt-6 border-t border-gray-200">
                <div className="flex items-center justify-end space-x-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200 font-medium"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-primary-orange text-white rounded-lg hover:bg-opacity-90 transition duration-200 disabled:opacity-50 font-medium min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <span><SpinnerFAIcon className="mr-2" />Saqlanmoqda...</span>
                    ) : (
                      <span>{selectedProduct ? 'Yangilash' : 'Qo\'shish'}</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* View Modal */}
      {isViewModalOpen && selectedProduct && document.body && createPortal(
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center modal-overlay overflow-hidden p-4"
          style={{ zIndex: 99999 }}
          onClick={() => setIsViewModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 rounded-t-lg z-20">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold text-gray-900">Mahsulot ma'lumotlari</h3>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <TimesFAIcon className="text-xl" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Product Images */}
              {((selectedProduct.images && selectedProduct.images.length > 0) || selectedProduct.image) && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Mahsulot rasmlari</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {selectedProduct.images && selectedProduct.images.length > 0 ? (
                      selectedProduct.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <OptimizedImage
                            src={image}
                            alt={`${selectedProduct.name} - ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 hover:border-primary-orange transition-colors cursor-pointer"
                            fallbackSrc={null}
                            placeholder="skeleton"
                          />
                          <div className="absolute -top-2 -left-2 bg-primary-orange text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                        </div>
                      ))
                    ) : selectedProduct.image && (
                      <div className="relative group">
                        <OptimizedImage
                          src={selectedProduct.image}
                          alt={selectedProduct.name}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 hover:border-primary-orange transition-colors cursor-pointer"
                          fallbackSrc={null}
                          placeholder="skeleton"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Product Information Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-500 mb-2">Mahsulot nomi</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedProduct.name}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-500 mb-2">Kategoriya</label>
                    <p className="text-gray-900 capitalize">{selectedProduct.category}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-500 mb-2">Narx</label>
                    <div className="flex items-center space-x-3">
                      <p className="text-xl font-bold text-primary-dark">{formatCurrency(selectedProduct.price)}</p>
                      {selectedProduct.oldPrice && selectedProduct.oldPrice > selectedProduct.price && (
                        <div className="flex items-center space-x-2">
                          <p className="text-sm text-gray-400 line-through decoration-red-500 decoration-2">{formatCurrency(selectedProduct.oldPrice)}</p>
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                            -{Math.round(((selectedProduct.oldPrice - selectedProduct.price) / selectedProduct.oldPrice) * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-500 mb-2">Zaxira</label>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-900 font-medium">{selectedProduct.stock} {selectedProduct.unit}</p>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStockStatus(selectedProduct.stock).class}`}>
                        {getStockStatus(selectedProduct.stock).text}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-500 mb-2">O'lchov birligi</label>
                    <p className="text-gray-900">{selectedProduct.unit}</p>
                  </div>

                  {selectedProduct.badge && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-500 mb-2">Badge</label>
                      <span className="bg-primary-orange text-white text-sm px-3 py-1 rounded-full font-medium">
                        {selectedProduct.badge}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {selectedProduct.description && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-500 mb-2">Tavsif</label>
                  <p className="text-gray-900 leading-relaxed">{selectedProduct.description}</p>
                </div>
              )}

              {/* Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedProduct.stock}</div>
                  <div className="text-sm text-blue-600 font-medium">Zaxirada</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(selectedProduct.price)}</div>
                  <div className="text-sm text-green-600 font-medium">Joriy narx</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600 capitalize">{selectedProduct.category}</div>
                  <div className="text-sm text-purple-600 font-medium">Kategoriya</div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white pt-6 border-t border-gray-200 z-10">
                <div className="flex items-center justify-end space-x-4">
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200 font-medium"
                  >
                    Yopish
                  </button>
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      openEditModal(selectedProduct);
                    }}
                    className="px-6 py-3 bg-primary-orange text-white rounded-lg hover:bg-opacity-90 transition duration-200 font-medium"
                  >
                    <EditFAIcon className="mr-2" />Tahrirlash
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* AdminNotificationModals - matching index.html exactly */}
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

      {/* Old alert modal removed - now using AdminNotificationModals */}
    </div >
  );
};

export default AdminProducts; 
