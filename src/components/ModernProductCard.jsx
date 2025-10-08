import React, { useState, useCallback, memo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { ShoppingCartIcon, EyeIcon } from './Icons';
import OptimizedImage from './OptimizedImage';
import { useStockMonitor } from '../hooks/useRealTimeStock';
import { useProduct } from '../hooks/useProductQueries';

const ModernProductCard = memo(({
  product,
  index = 0,
  onAddToCart,
  onOpenDetail,
  currentImageIndex: externalCurrentImageIndex = 0,
  onImageChange,
  lastHoverTime: externalLastHoverTime = 0,
  onHoverTimeChange,
  className = ""
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [internalCurrentImageIndex, setInternalCurrentImageIndex] = useState(0);
  const [internalLastHoverTime, setInternalLastHoverTime] = useState(0);
  const [localStock, setLocalStock] = useState(product?.stock || 0);
  const [stockUpdateAnimation, setStockUpdateAnimation] = useState(false);
  const containerRef = useRef(null);
  const cachedWidthRef = useRef(0);

  // Initialize real-time stock monitoring
  const { isConnected } = useStockMonitor();

  // Update local stock when product prop changes
  useEffect(() => {
    if (product?.stock !== undefined && product.stock !== localStock) {
      setLocalStock(product.stock);
      // Trigger animation for stock changes
      setStockUpdateAnimation(true);
      const timer = setTimeout(() => setStockUpdateAnimation(false), 600);
      return () => clearTimeout(timer);
    }
  }, [product?.stock, localStock]);

  // Helper function to format price safely
  const formatPrice = (price) => {
    const numeric = parseInt(price?.toString().replace(/[^\d]/g, '') || '0', 10);
    return numeric.toLocaleString() + " so'm";
  };

  // Calculate discount percentage
  const calculateDiscount = (currentPrice, oldPrice) => {
    if (!oldPrice || !currentPrice || oldPrice <= currentPrice) return 0;
    return Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
  };

  // Get all product images from variants (do NOT de-duplicate)
  const getAllProductImages = () => {
    const allImages = [];
    
    // If product has variants, collect all variant images
    if (product.hasVariants && product.variants && product.variants.length > 0) {
      product.variants.forEach(variant => {
        if (variant.options && variant.options.length > 0) {
          variant.options.forEach(option => {
            if (option.images && option.images.length > 0) {
              allImages.push(...option.images);
            } else if (option.image) {
              allImages.push(option.image);
            }
          });
        }
      });
    }
    
    // If no variant images, use product images
    if (allImages.length === 0) {
      if (product.images && product.images.length > 0) {
        allImages.push(...product.images);
      } else if (product.image) {
        allImages.push(product.image);
      }
    }
    
    // Ensure at least one image - return empty array if no images
    return allImages.length > 0 ? allImages : [];
  };

  const productImages = getAllProductImages();

  // Lazy fetch full product details to get complete images list (variants + gallery)
  const [shouldFetchDetails, setShouldFetchDetails] = useState(false);
  // Disable individual product fetching for now to prevent 400 errors
  // const { data: detailData } = useProduct(product?._id, shouldFetchDetails);
  const detailData = null;

  const getImagesFromDetail = useCallback((detail) => {
    if (!detail) return [];
    const p = detail.product || detail;
    const imgs = [];
    if (p?.hasVariants && Array.isArray(p?.variants)) {
      p.variants.forEach(variant => {
        if (Array.isArray(variant?.options)) {
          variant.options.forEach(option => {
            if (Array.isArray(option?.images) && option.images.length > 0) {
              imgs.push(...option.images);
            } else if (option?.image) {
              imgs.push(option.image);
            }
          });
        }
      });
    }
    if (imgs.length === 0) {
      if (Array.isArray(p?.images) && p.images.length > 0) imgs.push(...p.images);
      else if (p?.image) imgs.push(p.image);
    }
    return imgs.length > 0 ? imgs : [];
  }, []);

  const detailedImages = getImagesFromDetail(detailData);
  const images = detailedImages.length > 0 ? detailedImages : productImages;

  // Use external state if provided, otherwise use internal state
  const currentImageIndex = onImageChange ? externalCurrentImageIndex : internalCurrentImageIndex;
  const lastHoverTime = onHoverTimeChange ? externalLastHoverTime : internalLastHoverTime;

  const currentImage = images[currentImageIndex] || images[0];
  const discount = product.oldPrice ? calculateDiscount(product.price, product.oldPrice) : 0;
  const hasMultipleImages = images.length > 1;

  // Handle hover-based image navigation (from original ProductCard.jsx)
  const handleMouseMove = useCallback((e) => {
    if (images.length <= 1) {
      // If we only have 0/1 images from list, fetch details to get full gallery
      if (!shouldFetchDetails) setShouldFetchDetails(true);
      return;
    }

    const currentTime = Date.now();
    const hoverDelay = 300; // Faster response on desktop hover

    if (currentTime - lastHoverTime < hoverDelay) {
      return; // Too soon, ignore this hover
    }

    // Use nativeEvent.offsetX to avoid layout thrash, and cache width
    const width = cachedWidthRef.current || e.currentTarget.clientWidth;
    const x = (e.nativeEvent && typeof e.nativeEvent.offsetX === 'number')
      ? e.nativeEvent.offsetX
      : (e.clientX - e.currentTarget.getBoundingClientRect().left);

    let newIndex;

    if (x < width / 2) {
      // Left side - previous image
      newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : currentImageIndex;
    } else {
      // Right side - next image
      newIndex = currentImageIndex < images.length - 1 ? currentImageIndex + 1 : currentImageIndex;
    }

    if (newIndex !== currentImageIndex) {
      if (onImageChange && onHoverTimeChange) {
        // Use external state management
        onImageChange(product._id, newIndex);
        onHoverTimeChange(product._id, currentTime);
      } else {
        // Use internal state management
        setInternalCurrentImageIndex(newIndex);
        setInternalLastHoverTime(currentTime);
      }
    }
  }, [productImages.length, lastHoverTime, currentImageIndex, onImageChange, onHoverTimeChange, product._id]);

  const handleMouseLeave = useCallback(() => {
    if (onHoverTimeChange) {
      onHoverTimeChange(product._id, 0);
    }
  }, [onHoverTimeChange, product._id]);

  // Handle touch events for mobile (real swipe)
  const touchDataRef = useRef({ startX: 0, startY: 0, time: 0, active: false });
  const SWIPE_THRESHOLD = 40; // px
  const SWIPE_TIME_LIMIT = 800; // ms

  const pendingNavRef = useRef(null);

  const setImageIndex = useCallback((newIndex) => {
    if (newIndex === currentImageIndex) return;
    // If images not ready yet, queue the nav and force details fetch
    if (!Array.isArray(images) || images.length <= 1) {
      setShouldFetchDetails(true);
      pendingNavRef.current = newIndex;
      return;
    }
    if (onImageChange) {
      onImageChange(product._id, newIndex);
    } else {
      setInternalCurrentImageIndex(newIndex);
    }
    if (onHoverTimeChange) {
      onHoverTimeChange(product._id, Date.now());
    } else {
      setInternalLastHoverTime(Date.now());
    }
  }, [currentImageIndex, onImageChange, onHoverTimeChange, product._id, images]);

  // When images become available, execute any pending navigation
  useEffect(() => {
    if (Array.isArray(images) && images.length > 1 && pendingNavRef.current != null) {
      const target = Math.max(0, Math.min(images.length - 1, pendingNavRef.current));
      pendingNavRef.current = null;
      if (onImageChange) {
        onImageChange(product._id, target);
      } else {
        setInternalCurrentImageIndex(target);
      }
    }
  }, [images, onImageChange, product._id]);

  // Click to navigate left/right on desktop
  const handleImageClick = useCallback((e) => {
    e.stopPropagation();
    if (images.length <= 1) {
      setShouldFetchDetails(true);
      // We'll still compute the intended direction and queue it in setImageIndex
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const x = e.clientX - rect.left;
    if (x < width / 2) {
      // Left
      const prevIndex = Math.max(0, currentImageIndex - 1);
      setImageIndex(prevIndex);
    } else {
      // Right
      const nextIndex = Math.min(Math.max(images.length - 1, 1), currentImageIndex + 1);
      setImageIndex(nextIndex);
    }
  }, [images.length, currentImageIndex, setImageIndex]);

  const handleTouchStart = useCallback((e) => {
    // On first touch, if only 0/1 images available from list, prefetch details
    if (images.length <= 1 && !shouldFetchDetails) {
      setShouldFetchDetails(true);
    }
    const touch = e.touches[0];
    touchDataRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      time: Date.now(),
      active: true
    };
  }, [images.length, shouldFetchDetails]);

  const handleTouchMove = useCallback((e) => {
    // Do not call preventDefault here to avoid passive listener warning.
    // Horizontal vs vertical intent is handled via touch-action CSS and thresholds in touchEnd.
    if (!touchDataRef.current.active) return;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!touchDataRef.current.active || images.length <= 1) return;
    const dt = Date.now() - touchDataRef.current.time;
    const touch = e.changedTouches && e.changedTouches[0];
    const endX = touch ? touch.clientX : 0;
    const dx = endX - touchDataRef.current.startX;

    touchDataRef.current.active = false;

    if (dt <= SWIPE_TIME_LIMIT && Math.abs(dx) >= SWIPE_THRESHOLD) {
      if (dx < 0) {
        // Swipe left -> next image
        const nextIndex = Math.min(images.length - 1, currentImageIndex + 1);
        setImageIndex(nextIndex);
      } else {
        // Swipe right -> previous image
        const prevIndex = Math.max(0, currentImageIndex - 1);
        setImageIndex(prevIndex);
      }
    }
  }, [images.length, currentImageIndex, setImageIndex]);
  
  // Start fetching details when image container is visible or on interaction
  // Disabled viewport-triggered detail prefetch to prevent many concurrent /products/:id requests
  // useEffect(() => {
  //   if (!containerRef.current || shouldFetchDetails) return;
  //   const el = containerRef.current;
  //   const obs = new IntersectionObserver((entries) => {
  //     const first = entries[0];
  //     if (first.isIntersecting) {
  //       setShouldFetchDetails(true);
  //       obs.disconnect();
  //     }
  //   }, { rootMargin: '100px', threshold: 0.1 });
  //   obs.observe(el);
  //   return () => obs.disconnect();
  // }, [shouldFetchDetails]);

  // Handle dot navigation
  const handleDotClick = useCallback((index, e) => {
    e.stopPropagation();
    if (onImageChange) {
      onImageChange(product._id, index);
    } else {
      setInternalCurrentImageIndex(index);
    }
  }, [onImageChange, product._id]);

  // Handle action buttons - Navigate to detail route; add to cart only if no variants
  const handleAddToCart = useCallback((e) => {
    e.stopPropagation();
    if (onOpenDetail) {
      onOpenDetail(product);
    } else {
      try {
        sessionStorage.setItem('homeScroll', String(window.scrollY || window.pageYOffset || 0));
      } catch (err) {}
      navigate(`/product/${product._id}`);
    }
  }, [navigate, product, onOpenDetail]);

  const handleOpenDetail = useCallback(() => {
    if (onOpenDetail) {
      onOpenDetail(product);
    } else {
      try {
        sessionStorage.setItem('homeScroll', String(window.scrollY || window.pageYOffset || 0));
      } catch (err) {}
      navigate(`/product/${product._id}`);
    }
  }, [navigate, product, onOpenDetail]);

  const handleCardClick = useCallback(() => {
    if (onOpenDetail) {
      onOpenDetail(product);
    } else {
      try {
        sessionStorage.setItem('homeScroll', String(window.scrollY || window.pageYOffset || 0));
      } catch (err) {}
      navigate(`/product/${product._id}`);
    }
  }, [product, navigate, onOpenDetail]);

  // Badge/chegirma borligini tekshirish
  const hasBadges = product.isNew || product.isPopular || (product.badge && product.badge !== 'Yo\'q') || 
                   (localStock !== undefined && localStock < 5 && localStock > 0) || discount > 0;

  return (
    <div
      id={`product-${product?._id || product?.id}`}
      className={`group bg-white rounded-lg shadow-md p-2 sm:p-2.5 md:p-3 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border border-gray-200 hover:border-orange-200 relative h-full flex flex-col cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Image Container - Dinamik height */}
      <div className="relative cursor-pointer overflow-hidden rounded-lg mb-2 sm:mb-3 border border-gray-100" onClick={handleOpenDetail}>
        <div
          className={`relative w-full bg-white rounded-lg overflow-hidden touch-pan-y select-none ${
            hasBadges 
              ? 'h-40 sm:h-48 lg:h-56' // Badge bor bo'lsa kichikroq
              : 'h-44 sm:h-52 lg:h-60' // Badge yo'q bo'lsa kattaroq
          }`}
          ref={containerRef}
          onMouseEnter={(e) => {
            cachedWidthRef.current = e.currentTarget.clientWidth;
            // Prefetch detail on hover if we currently only have 0/1 images from list
            if (!shouldFetchDetails && (!Array.isArray(images) || images.length <= 1)) {
              setShouldFetchDetails(true);
            }
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleImageClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Main Image (lazy-loaded and URL-optimized) */}
          <div className="w-full h-full overflow-hidden rounded-lg flex items-center justify-center">
            {currentImage ? (
              <OptimizedImage
                src={currentImage}
                alt={product.name}
                className={`w-full h-full ${isHovered ? 'scale-105' : 'scale-100'}`}
                placeholder="skeleton"
                objectFit="contain"
                loading={index < 4 ? "eager" : "lazy"}
                priority={index < 2}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {/* Loading Skeleton */}
          {imageLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              <svg className="w-6 h-6 lg:w-8 lg:h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
          )}

          {/* Hover Areas Indicator (only visible on hover for multiple images) */}
          {hasMultipleImages && (
            <>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="absolute left-0 top-0 w-1/2 h-full bg-gradient-to-r from-black/5 to-transparent"></div>
                <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-black/5 to-transparent"></div>
              </div>
            </>
          )}

          {/* Removed overlay progress indicators (we will render persistent bars below the image) */}

          {/* Badges - Left side - Telefon uchun kichraytirilgan */}
          <div className="absolute top-1 left-1 z-10 flex flex-col gap-0.5">
            {/* New Badge - Telefon uchun kichik */}
            {product.isNew && (
              <span className="bg-blue-500 text-white text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 rounded font-normal">
                Yangi
              </span>
            )}
            
            {/* Popular Badge - Telefon uchun kichik */}
            {product.isPopular && (
              <span className="bg-green-500 text-white text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 rounded font-normal">
                Top
              </span>
            )}

            {/* Custom Badge - Telefon uchun kichik */}
            {product.badge && product.badge !== 'Yo\'q' && (
              <span className="bg-blue-500 text-white text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 rounded font-normal">
                {product.badge}
              </span>
            )}

            {/* Stock Badge - Telefon uchun kichik with real-time updates */}
            {localStock !== undefined && localStock < 5 && localStock > 0 && (
              <span className={`bg-orange-500 text-white text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 rounded font-normal transition-all duration-300 ${
                stockUpdateAnimation ? 'animate-bounce' : ''
              }`}>
                Kam qoldi
              </span>
            )}
          </div>

          {/* Discount Badge - Right side - Telefon uchun kichik */}
          {discount > 0 && (
            <div className="absolute top-1 right-1 z-10">
              <span className="bg-red-500 text-white text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 rounded font-normal">
                -{discount}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Persistent Image Progress Bars (visible under image) */}
      {hasMultipleImages && (
        <div className="px-1.5 sm:px-2 pt-1 sm:pt-1.5">
          <div className="flex items-center gap-1 justify-center">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => handleDotClick(index, e)}
                className={`${index === currentImageIndex
                  ? 'w-5 sm:w-6 h-0.5 sm:h-1 bg-primary-orange rounded-full'
                  : 'w-1.5 h-1.5 bg-gray-300 rounded-full hover:bg-gray-400'
                } transition-all duration-200`}
                aria-label={`Rasm ${index + 1}`}
                title={`Rasm ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Product Info - Kichraytirilgan */}
      <div className="flex flex-col flex-1 justify-between">
        {/* All Product Information in One Container */}
        <div className="space-y-1.5 sm:space-y-2">
          {/* Brand - Rangli brand indicator */}
          {product.brand && (
            <div className="inline-flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
              <span className="text-xs text-purple-600 font-medium tracking-wide uppercase bg-purple-50 px-2 py-0.5 rounded-full">
                {product.brand}
              </span>
            </div>
          )}
          
          {/* Product Name va Description - Kichraytirilgan */}
          <div className="cursor-pointer space-y-0.5 sm:space-y-1" onClick={handleOpenDetail}>
            <h3 className="font-semibold text-xs sm:text-sm md:text-base text-gray-900 leading-tight hover:text-primary-orange transition-colors duration-200 line-clamp-2">
              {product.name || 'Noma\'lum mahsulot'}
            </h3>
            
            {/* Description - Kichraytirilgan */}
            {product.description && (
              <div className="bg-slate-50 p-1 sm:p-1.5 rounded border-l-2 border-slate-200 mt-0">
                <p className="text-slate-600 text-[10px] sm:text-xs leading-tight line-clamp-2 font-medium m-0">
                  {product.description}
                </p>
              </div>
            )}
          </div>
          
          {/* Price Section - Narxlar yopishiq */}
          <div>
            {/* Telefon uchun - alohida qatorlarda, gap yo'q */}
            <div className="flex flex-col sm:hidden">
              <span className="text-base font-bold text-primary-orange leading-tight">
                {formatPrice(product.price)}
              </span>
              {product.oldPrice && (
                <span className="text-xs text-gray-400 line-through leading-tight">
                  {formatPrice(product.oldPrice)}
                </span>
              )}
            </div>
            
            {/* Desktop uchun - yonma-yon */}
            <div className="hidden sm:flex items-baseline gap-2">
              <span className="text-lg md:text-xl font-bold text-primary-orange">
                {formatPrice(product.price)}
              </span>
              {product.oldPrice && (
                <span className="text-xs text-gray-400 line-through bg-gray-50 px-1.5 py-0.5 rounded">
                  {formatPrice(product.oldPrice)}
                </span>
              )}
            </div>
          </div>
          
          {/* Stock Info - Kichraytirilgan with real-time updates */}
          <div className="flex items-center justify-between text-[10px] sm:text-xs">
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${
                localStock > 10 ? 'bg-green-500' : localStock > 0 ? 'bg-yellow-500' : 'bg-red-500'
              } ${stockUpdateAnimation ? 'animate-pulse scale-125' : ''}`}></div>
              <span className="text-gray-600 font-medium">Mavjud:</span>
              {/* Real-time connection indicator */}
              {isConnected && (
                <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" title="Real-time yangilanish"></div>
              )}
            </div>
            <span className={`font-semibold transition-all duration-300 ${
              localStock > 10 
                ? 'text-green-600' 
                : localStock > 0 
                  ? 'text-yellow-600' 
                  : 'text-red-600'
            } ${stockUpdateAnimation ? 'scale-110 font-bold' : ''}`}>
              {localStock > 0 ? `${localStock} ${product.unit || 'dona'}` : 'Tugagan'}
            </span>
          </div>
        </div>
        
        {/* Button - Kichraytirilgan */}
        <button
          onClick={handleAddToCart}
          className={`w-full py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 mt-2 sm:mt-3 bg-gradient-to-r from-primary-orange to-orange-500 text-white hover:from-orange-600 hover:to-orange-600 hover:shadow-lg active:scale-[0.98] shadow-md`}
        >
          <div className="flex items-center justify-center gap-2">
            <EyeIcon className="w-4 h-4" />
            <span>Ko'rish</span>
          </div>
        </button>
      </div>
    </div>
  );
});

ModernProductCard.displayName = 'ModernProductCard';

export default ModernProductCard;