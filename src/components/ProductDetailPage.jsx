import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProduct } from '../hooks/useProductQueries';
import { getCategoryDisplayName } from '../utils/categoryMapping';
import ProductVariantSelector from './ProductVariantSelector';
import { ProductsGridSkeleton } from './LoadingSkeleton';
import { CartFAIcon, TimesFAIcon, PlusFAIcon, MinusFAIcon } from './FontAwesome';
import OptimizedImage from './OptimizedImage';
import MobileBottomNavigation from './MobileBottomNavigation';
import CartSidebar from './CartSidebar';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  // Variant system (match modal behavior)
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedVariants, setSelectedVariants] = useState({});
  const [variantPrice, setVariantPrice] = useState(0);
  const [variantStock, setVariantStock] = useState(0);
  const [variantOldPrice, setVariantOldPrice] = useState(null);
  const [variantImage, setVariantImage] = useState('');
  const [variantImages, setVariantImages] = useState([]);
  // Local add-to-cart confirmation modal
  const [showAddedModal, setShowAddedModal] = useState(false);
  const [justAddedProduct, setJustAddedProduct] = useState(null);
  
  // Cart state for mobile navigation
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on mount
  React.useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cartItems');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  }, []);

  // Cart helper functions
  const getTotalItems = useCallback(() => {
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  }, [cart]);

  const handleToggleCart = useCallback(() => {
    setIsCartOpen(prev => !prev);
  }, []);

  const handleRemoveFromCart = useCallback((itemId) => {
    setCart(prevCart => {
      const newCart = prevCart.filter(item => (item.cartId || item._id || item.id) !== itemId);
      localStorage.setItem('cartItems', JSON.stringify(newCart));
      return newCart;
    });
  }, []);

  const handleUpdateQuantity = useCallback((itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }
    
    setCart(prevCart => {
      const newCart = prevCart.map(item => {
        const currentId = item.cartId || item._id || item.id;
        if (currentId === itemId) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
      localStorage.setItem('cartItems', JSON.stringify(newCart));
      return newCart;
    });
  }, [handleRemoveFromCart]);

  const handleCheckout = useCallback(() => {
    // Simple checkout - could be enhanced
    setIsCartOpen(false);
  }, []);

  // Fetch product data with React Query caching
  const { data, isLoading, isFetching, isError, isSuccess, error, fetchStatus } = useProduct(id);
  const loading = isLoading || isFetching || fetchStatus === 'fetching';
  // Normalize API shape: accept either { product } or raw product document
  const product = data?.product ?? (data && data._id ? data : null);

  // Handle back navigation
  const handleBack = useCallback(() => {
    try {
      const pid = (id || '').toString();
      if (pid) sessionStorage.setItem('scrollToProductId', pid);
    } catch (e) {}
    // Force navigate to home with state to prevent layout issues on iOS
    navigate('/', { 
      state: { restoreProductId: id },
      replace: false 
    });
  }, [navigate, id]);

  // Handle add to cart (align with modal)
  const handleAddToCart = useCallback(() => {
    if (!product) return;

    // Build display name with variant info
    let displayName = product?.name || 'Mahsulot';
    if (product?.hasVariants && Object.keys(selectedVariants).length > 0) {
      const variantInfo = Object.values(selectedVariants).join(', ');
      displayName = `${product?.name || 'Mahsulot'} (${variantInfo})`;
    }

    const productToAdd = {
      ...product,
      name: displayName,
      selectedColor,
      selectedSize,
      quantity,
      price: product?.hasVariants ? variantPrice : product?.price,
      selectedVariants: product?.hasVariants ? selectedVariants : {},
      finalPrice: product?.hasVariants ? variantPrice : product?.price,
      finalStock: product?.hasVariants ? variantStock : (product?.stock || product?.quantity),
      finalImage: product?.hasVariants ? variantImage : product?.image,
      image: product?.hasVariants ? (variantImage || product?.image) : product?.image,
      unit: product?.unit,
      cartId: product?.hasVariants
        ? `${product?.id || product?._id}-${Object.values(selectedVariants).join('-')}`
        : (product?.id || product?._id)
    };

    // Update local cart state
    setCart(prevCart => {
      const idKey = productToAdd.cartId || productToAdd._id || productToAdd.id;
      let found = false;
      const newCart = prevCart.map((item) => {
        const itemKey = item.cartId || item._id || item.id;
        if (itemKey === idKey) {
          found = true;
          return { ...item, quantity: (item.quantity || 1) + (productToAdd.quantity || 1) };
        }
        return item;
      });
      
      if (!found) {
        newCart.push({ ...productToAdd, id: idKey, quantity: productToAdd.quantity || 1 });
      }
      
      // Save to localStorage
      localStorage.setItem('cartItems', JSON.stringify(newCart));
      return newCart;
    });

    // Dispatch a global event (legacy)
    window.dispatchEvent(new CustomEvent('addToCart', { detail: productToAdd }));
    
    // Also store a one-shot pending add to cart for Home to consume
    try {
      sessionStorage.setItem('pendingAddToCart', JSON.stringify(productToAdd));
    } catch (_) {}
    
    // Show confirmation modal
    setJustAddedProduct(productToAdd);
    setShowAddedModal(true);
  }, [product, quantity, selectedVariants, selectedColor, selectedSize, variantPrice, variantStock, variantImage]);

  // Format price helper
  const formatPrice = (price) => {
    const numeric = parseInt(price?.toString().replace(/[^\d]/g, '') || '0', 10);
    return numeric.toLocaleString() + " so'm";
  };

  // Unit suffix helper (donasi/kilosi/...)
  const getUnitSuffix = (unitRaw) => {
    const unit = (unitRaw || '').toLowerCase();
    if (['kg', 'kilo', 'kilogram', 'kilogramm'].includes(unit)) return 'kilosi';
    if (['dona', 'pcs', 'piece'].includes(unit)) return 'donasi';
    if (unit) return `${unit} uchun`;
    return 'donasi';
  };

  // Initialize variant defaults ONLY ONCE per product to avoid auto-toggling on refetch
  const initForProductRef = React.useRef(null);
  React.useEffect(() => {
    if (!product || !product._id) return;
    if (initForProductRef.current === product._id) return; // already initialized for this product

    setSelectedImage(0);
    setQuantity(1);
    setSelectedColor(product?.colors?.[0] || '');
    setSelectedSize(product?.sizes?.[0] || '');
    setVariantPrice(product?.price || 0);
    setVariantStock(product?.stock || product?.quantity || 0);
    setVariantImage(product?.image || '');
    setVariantImages(product?.images || (product?.image ? [product?.image] : []));

    if (product?.hasVariants && Array.isArray(product?.variants) && product?.variants.length > 0) {
      const autoSelected = {};
      let autoPrice = product?.price || 0;
      let autoOldPrice = (typeof product?.oldPrice === 'number' ? product?.oldPrice : null);
      let autoStock = (typeof product?.stock === 'number' ? product?.stock : (typeof product?.quantity === 'number' ? product?.quantity : 0));
      let autoImage = product?.image || '';
      let autoImages = product?.images || (product?.image ? [product?.image] : []);
      product?.variants.forEach(v => {
        if (Array.isArray(v.options) && v.options.length > 0) {
          const first = v.options[0];
          autoSelected[v.name] = first.value;
          if (first.price && first.price > 0) autoPrice = first.price;
          if (typeof first.oldPrice === 'number') autoOldPrice = first.oldPrice;
          if (typeof first.stock === 'number') autoStock = Math.min(autoStock, first.stock);
          if (Array.isArray(first.images) && first.images.length > 0) {
            autoImages = first.images;
            autoImage = first.images[0];
          } else if (first.image) {
            autoImage = first.image;
            autoImages = [first.image];
          }
        }
      });
      setSelectedVariants(autoSelected);
      setVariantPrice(autoPrice);
      setVariantStock(autoStock);
      setVariantImage(autoImage);
      setVariantImages(autoImages);
      setVariantOldPrice(autoOldPrice);
    } else {
      setSelectedVariants({});
      setVariantOldPrice(product?.oldPrice ?? null);
    }

    initForProductRef.current = product._id;
  }, [product]);

  // Reset selected image when variant images change
  React.useEffect(() => {
    if (variantImages && variantImages.length > 0) {
      setSelectedImage(0);
    }
  }, [variantImages]);

  // Compute memoized images and pricing BEFORE any early returns to keep hook order stable
  const productImages = React.useMemo(() => {
    if (variantImages && variantImages.length > 0) return variantImages;
    const baseImages = product?.images && product.images.length > 0
      ? product.images
      : (product?.image ? [product.image] : []);
    return baseImages;
  }, [variantImages, product?.images, product?.image]);

  // Normalize images to string URLs in case API returns objects
  const toSrc = React.useCallback((item) => {
    if (!item) return null;
    if (typeof item === 'string') return item;
    if (typeof item === 'object') {
      const cand = item.url || item.path || item.src || item.image || item.href;
      return typeof cand === 'string' ? cand : null;
    }
    return null;
  }, []);

  const normalizedImages = React.useMemo(
    () => (Array.isArray(productImages) ? productImages.map(toSrc).filter(Boolean) : []),
    [productImages, toSrc]
  );

  const currentImage = normalizedImages[selectedImage] || null;
  const effectivePrice = (product?.hasVariants ? variantPrice : product?.price) ?? 0;
  const effectiveOldPriceCandidate = product?.hasVariants
    ? (typeof variantOldPrice === 'number' ? variantOldPrice : product?.oldPrice)
    : product?.oldPrice;
  const effectiveOldPrice = (typeof effectiveOldPriceCandidate === 'number') ? effectiveOldPriceCandidate : null;
  const discount = (typeof effectiveOldPrice === 'number' && effectiveOldPrice > effectivePrice)
    ? Math.round(((effectiveOldPrice - effectivePrice) / effectiveOldPrice) * 100)
    : 0;
  // Current available stock depending on variant selection
  const stockBound = product?.hasVariants ? (variantStock || 0) : ((product?.stock || 0));

  // Clamp quantity whenever available stock changes (e.g., variant switched)
  React.useEffect(() => {
    setQuantity(prev => Math.max(1, Math.min(prev, stockBound || 1)));
  }, [stockBound]);

  // Auto-hide add-to-cart toast after a short delay
  React.useEffect(() => {
    if (!showAddedModal) return;
    const t = setTimeout(() => setShowAddedModal(false), 3000);
    return () => clearTimeout(t);
  }, [showAddedModal]);

  // Loading state - show skeleton until we have product data
  if (loading || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <ProductsGridSkeleton count={1} />
        </div>
      </div>
    );
  }

  // Error/empty state: show only after a settled successful fetch with no product,
  // or when there is an error and no ongoing fetch (avoid flashing cached error during refetch)
  // Don't show error immediately - give it time to load
  if (!loading && !product && ((isError && !isFetching) || isSuccess)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Mahsulot topilmadi
          </h3>
          <p className="text-gray-500 mb-4">
            {error?.message || 'Mahsulot mavjud emas yoki o\'chirilgan'}
          </p>
          <button
            onClick={handleBack}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
          >
            Orqaga qaytish
          </button>
        </div>
      </div>
    );
  }

  

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200 border border-gray-300 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Orqaga
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-2 sm:px-3 md:px-4 py-4 md:py-6 pb-24 lg:pb-6">
        <div className="bg-white rounded-lg md:rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 p-2 sm:p-3 md:p-4">
            {/* Image Gallery */}
            <div className="space-y-3">
              {/* Main Image */}
              <div className="aspect-square bg-white rounded-lg overflow-hidden relative border border-gray-100">
                <OptimizedImage
                  src={currentImage}
                  alt={product?.name || 'Mahsulot rasmi'}
                  className="w-full h-full"
                  objectFit="contain"
                  priority={true}
                  placeholder="skeleton"
                />
                
                {/* Discount Badge */}
                {discount > 0 && (
                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                    <span className="bg-red-500 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full font-medium">
                      -{discount}%
                    </span>
                  </div>
                )}

                {/* Image Navigation */}
                {productImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImage(prev => prev === 0 ? productImages.length - 1 : prev - 1)}
                      className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shadow-md transition-all duration-200"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setSelectedImage(prev => prev === productImages.length - 1 ? 0 : prev + 1)}
                      className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shadow-md transition-all duration-200"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Images */}
              {normalizedImages.length > 1 && (
                <div className="flex gap-1 sm:gap-2 overflow-x-auto">
                  {normalizedImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        selectedImage === index ? 'border-primary-orange' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <OptimizedImage
                        src={image}
                        alt={`${product?.name || 'Mahsulot'} ${index + 1}`}
                        className="w-full h-full"
                        objectFit="contain"
                        placeholder="skeleton"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-4 sm:space-y-5">
              {/* Product Name and Brand */}
              <div>
                {product?.brand && (
                  <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide mb-1.5">
                    {product?.brand}
                  </div>
                )}
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                  {product?.name || 'Mahsulot nomi'}
                </h1>
              </div>

              {/* Price - Styled like modal */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
                {discount > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      -{discount}% Chegirma
                    </span>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700 font-medium text-sm">Narxi</span>
                    </div>
                    <span className="text-xl font-bold text-primary-orange flex items-baseline gap-1">
                      {formatPrice(effectivePrice)}
                      <span className="text-sm font-medium text-gray-500">/ {product?.unit || 'dona'}</span>
                    </span>
                  </div>
                  {/* Holati row (like modal) */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700 font-medium text-sm">Holati</span>
                    </div>
                    <span className="text-green-600 font-medium flex items-center gap-1 text-sm bg-green-50 px-2 py-1 rounded-md">
                      Mavjud
                    </span>
                  </div>
                  {typeof effectiveOldPrice === 'number' && effectiveOldPrice > effectivePrice && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-gray-700 font-medium text-sm">Eski narx</span>
                      </div>
                      <span className="text-gray-500 line-through text-sm">
                        {formatPrice(effectiveOldPrice)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {product?.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Tavsif</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {product?.description}
                  </p>
                </div>
              )}

              {/* Product Variants */}
              {product?.hasVariants && product?.variants && product?.variants.length > 0 && (
                <div className="space-y-4">
                  <ProductVariantSelector
                    product={product}
                    selectedVariants={selectedVariants}
                    onVariantChange={(variantData) => {
                      setSelectedVariants(variantData.selectedVariants);
                      setVariantPrice(variantData.price);
                      setVariantStock(variantData.stock);
                      setVariantImage(variantData.image);
                      setVariantImages(variantData.images || []);
                      setVariantOldPrice(typeof variantData.oldPrice === 'number' ? variantData.oldPrice : null);
                      // Reset quantity on variant change to avoid exceeding new stock
                      setQuantity(1);
                    }}
                  />
                </div>
              )}

              {/* Quantity Selector */}
              {stockBound > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Miqdor ({product?.unit || 'dona'})</label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      disabled={quantity <= 1}
                      className={`w-12 h-12 rounded-lg border flex items-center justify-center transition-colors duration-200 ${quantity <= 1 ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}
                      aria-disabled={quantity <= 1}
                    >
                      <MinusFAIcon className="text-xs sm:text-sm leading-none" />
                    </button>
                    <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(prev => Math.min(stockBound, prev + 1))}
                      disabled={quantity >= stockBound}
                      className={`w-12 h-12 rounded-lg border flex items-center justify-center transition-colors duration-200 ${quantity >= stockBound ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}
                      aria-disabled={quantity >= stockBound}
                    >
                      <PlusFAIcon className="text-xs sm:text-sm leading-none" />
                    </button>
                  </div>
                </div>
              )}

              {/* Product Information - same styling as modal */}
              <div className="space-y-3 border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-800 text-sm">Mahsulot ma'lumotlari</h4>
                <div className="space-y-3">
                  {/* Category Info */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700 text-sm font-medium">Kategoriya</span>
                    </div>
                    <span className="text-gray-900 font-semibold text-sm bg-blue-50 px-2 py-1 rounded-md">
                      {getCategoryDisplayName(product?.category)}
                    </span>
                  </div>

                  {/* Stock Info */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        stockBound > 10
                          ? 'bg-green-500'
                          : stockBound > 0
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}></div>
                      <span className="text-gray-700 text-sm font-medium">Miqdor</span>
                    </div>
                    <span className={`font-semibold text-sm px-2 py-1 rounded-md ${
                      stockBound > 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
                    }`}>
                      {stockBound > 0 ? `${stockBound} ta mavjud` : 'Tugagan'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    onClick={handleBack}
                    type="button"
                    className="w-full px-5 py-3.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                    aria-label="Yopish"
                    title="Yopish"
                  >
                    <TimesFAIcon className="text-sm" />
                    Yopish
                  </button>
                  <button
                    onClick={handleAddToCart}
                    disabled={stockBound === 0}
                    className={`w-full py-3.5 px-6 rounded-lg font-semibold text-base sm:text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                      stockBound === 0
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-primary-orange text-white hover:bg-orange-600 hover:shadow-lg'
                    }`}
                    aria-label={stockBound === 0 ? 'Tugagan' : "Savatga qo'shish"}
                    title={stockBound === 0 ? 'Tugagan' : "Savatga qo'shish"}
                  >
                    {stockBound === 0 ? (
                      'Tugagan'
                    ) : (
                      <>
                        <CartFAIcon className="text-sm" />
                        {"Savatga qo'shish"}
                      </>
                    )}
                  </button>
                </div>
              </div>
              {/* No extra sections below (match modal) */}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNavigation
        cart={cart}
        isCartOpen={isCartOpen}
        onToggleCart={handleToggleCart}
        getTotalItems={getTotalItems}
      />

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemoveFromCart={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateQuantity}
        onCheckout={handleCheckout}
        onToggleCart={handleToggleCart}
        getTotalItems={getTotalItems}
      />

      {/* Add-to-cart toast (top-right) */}
      {showAddedModal && (
        <div className="fixed top-0 right-2 md:right-4 z-[70]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div className="bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg max-w-xs md:max-w-sm flex items-start gap-2">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="font-medium text-sm md:text-base">Savatga qo'shildi</div>
              <div className="text-xs md:text-sm opacity-90">{justAddedProduct?.name || product?.name}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;