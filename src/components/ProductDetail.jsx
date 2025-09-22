import React, { useState, useEffect } from 'react';
import { getCategoryDisplayName } from '../utils/categoryMapping';
import ProductVariantSelector from './ProductVariantSelector';
import { 
  TimesFAIcon, 
  ChevronLeftFAIcon, 
  ChevronRightFAIcon, 
  CheckCircleFAIcon, 
  MinusFAIcon, 
  PlusFAIcon, 
  CartFAIcon 
} from './FontAwesome';

const ProductDetail = ({ product, isOpen, onClose, onAddToCart }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  // Notification state
  const [showNotification, setShowNotification] = useState(false);

  // Variant system states
  const [selectedVariants, setSelectedVariants] = useState({});
  const [variantPrice, setVariantPrice] = useState(product?.price || 0);
  const [variantStock, setVariantStock] = useState(product?.stock || 0);
  const [variantImage, setVariantImage] = useState(product?.image || '');
  const [variantImages, setVariantImages] = useState(product?.images || (product?.image ? [product.image] : []));

  // Get product images - support both old and new format, prioritize variant images
  const productImages = React.useMemo(() => {
    // If we have variant images, use them
    if (variantImages && variantImages.length > 0) {
      return variantImages;
    }
    
    // Otherwise use base product images
    const baseImages = product?.images && product.images.length > 0
      ? product.images
      : (product?.image ? [product.image] : ['/assets/default-product.png']);
    
    return baseImages;
  }, [variantImages, product?.images, product?.image]);

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setSelectedImageIndex(0);
      setQuantity(1);
      setSelectedColor(product.colors?.[0] || '');
      setSelectedSize(product.sizes?.[0] || '');
      setVariantPrice(product.price);
      setVariantStock(product.stock);
      setVariantImage(product.image);
      setVariantImages(product.images || (product.image ? [product.image] : []));

      // Auto-select first variant options
      if (product.hasVariants && product.variants && product.variants.length > 0) {
        const autoSelectedVariants = {};
        let autoPrice = product.price;
        let autoStock = product.stock;
        let autoImage = product.image;
        let autoImages = product.images || (product.image ? [product.image] : []);

        product.variants.forEach(variant => {
          if (variant.options && variant.options.length > 0) {
            // Always select first option as default
            const firstOption = variant.options[0];
            autoSelectedVariants[variant.name] = firstOption.value;

            // Update price, stock, image and images based on first variant
            if (firstOption.price && firstOption.price > 0) {
              autoPrice = firstOption.price;
            }
            if (firstOption.stock !== undefined) {
              autoStock = Math.min(autoStock, firstOption.stock);
            }
            if (firstOption.images && firstOption.images.length > 0) {
              autoImages = firstOption.images;
              autoImage = firstOption.images[0];
            } else if (firstOption.image) {
              autoImage = firstOption.image;
              autoImages = [firstOption.image];
            }
          }
        });

        setSelectedVariants(autoSelectedVariants);
        setVariantPrice(autoPrice);
        setVariantStock(autoStock);
        setVariantImage(autoImage);
        setVariantImages(autoImages);
      } else {
        setSelectedVariants({});
      }
    }
  }, [product]);

  // Update main image when variant images change
  useEffect(() => {
    // Reset to first image when variant images change
    if (variantImages && variantImages.length > 0) {
      setSelectedImageIndex(0);
    }
  }, [variantImages]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px';
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.paddingRight = '0px';
    }

    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.paddingRight = '0px';
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return "0 so'm";
    return price.toLocaleString() + " so'm";
  };

  const calculateDiscount = (currentPrice, oldPrice) => {
    if (!oldPrice || !currentPrice || oldPrice <= currentPrice) return 0;
    return Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
  };

  const discount = product.oldPrice ? calculateDiscount(product.price, product.oldPrice) : 0;

  // Check if all variants are selected - always true since we auto-select
  const allVariantsSelected = !product.hasVariants ||
    !product.variants ||
    product.variants.length === 0 ||
    product.variants.every(variant => selectedVariants[variant.name]);

  const handleAddToCart = () => {
    // Ensure all variants are selected before adding to cart
    if (product.hasVariants && product.variants && product.variants.length > 0) {
      // Check if all variants have been selected
      const missingVariants = product.variants.filter(variant => 
        !selectedVariants[variant.name] || selectedVariants[variant.name] === ''
      );
      
      if (missingVariants.length > 0) {
        console.warn('Missing variants detected:', missingVariants.map(v => v.name));
        console.log('Current selectedVariants:', selectedVariants);
        // Auto-select missing variants (fallback)
        const autoCompleted = { ...selectedVariants };
        missingVariants.forEach(variant => {
          if (variant.options && variant.options.length > 0) {
            autoCompleted[variant.name] = variant.options[0].value;
          }
        });
        setSelectedVariants(autoCompleted);
        console.log('Auto-completed variants:', autoCompleted);
      }
    }

    // Create display name with variant info
    let displayName = product.name;
    if (product.hasVariants && Object.keys(selectedVariants).length > 0) {
      const variantInfo = Object.values(selectedVariants).join(', ');
      displayName = `${product.name} (${variantInfo})`;
    }

    const productToAdd = {
      ...product,
      name: displayName, // Use display name with variant info
      selectedColor,
      selectedSize,
      quantity,
      // Override price with variant price
      price: product.hasVariants ? variantPrice : product.price,
      // Add variant information - ensure it's populated
      selectedVariants: product.hasVariants ? selectedVariants : {},
      finalPrice: product.hasVariants ? variantPrice : product.price,
      finalStock: product.hasVariants ? variantStock : (product.stock || product.quantity),
      finalImage: product.hasVariants ? variantImage : product.image,
      // Create a unique identifier for cart items with variants
      cartId: product.hasVariants
        ? `${product.id || product._id}-${Object.values(selectedVariants).join('-')}`
        : (product.id || product._id)
    };
    
    console.log('Adding to cart with variants:', {
      productName: product.name,
      hasVariants: product.hasVariants,
      selectedVariants,
      variantKeys: Object.keys(selectedVariants),
      variantValues: Object.values(selectedVariants),
      cartId: productToAdd.cartId
    });
    
    onAddToCart(productToAdd);

    // Show notification
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
  };

  const navigateImage = (direction) => {
    if (direction === 'prev' && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    } else if (direction === 'next' && selectedImageIndex < productImages.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start md:items-center justify-center p-1 sm:p-2 md:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg md:rounded-xl max-w-6xl w-full max-h-[99vh] sm:max-h-[98vh] md:max-h-[90vh] overflow-y-auto mt-1 sm:mt-2 md:mt-0 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-3 md:p-4 flex items-center justify-between z-20 shadow-sm">
          <h2 className="text-sm md:text-base lg:text-lg font-medium text-gray-800 line-clamp-2 md:line-clamp-1 pr-2">{product.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 flex-shrink-0"
          >
            <TimesFAIcon className="text-gray-500 text-lg" />
          </button>
        </div>

        <div className="p-2 sm:p-3 md:p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {/* Image Gallery */}
            <div className="space-y-3">
              {/* Thumbnail Images */}
              {productImages.length > 1 && (
                <div className="flex gap-1 sm:gap-2 overflow-x-auto">
                  {productImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => handleImageClick(index)}
                      className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${selectedImageIndex === index
                          ? 'border-primary-orange'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-contain bg-white"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Image */}
              <div className="relative bg-white rounded-lg overflow-hidden aspect-square border border-gray-100">
                <img
                  src={productImages[selectedImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />

                {/* Navigation Arrows */}
                {productImages.length > 1 && (
                  <>
                    <button
                      onClick={() => navigateImage('prev')}
                      className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-1 sm:p-2 shadow-md transition-all duration-200"
                      disabled={selectedImageIndex === 0}
                    >
                      <ChevronLeftFAIcon className="text-gray-600 text-xs sm:text-sm" />
                    </button>
                    <button
                      onClick={() => navigateImage('next')}
                      className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-1 sm:p-2 shadow-md transition-all duration-200"
                      disabled={selectedImageIndex === productImages.length - 1}
                    >
                      <ChevronRightFAIcon className="text-gray-600 text-xs sm:text-sm" />
                    </button>
                  </>
                )}

                {/* Badges */}
                {product.badge && (
                  <span className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-primary-orange text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                    {product.badge}
                  </span>
                )}
                {discount > 0 && (
                  <span className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-red-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                    -{discount}%
                  </span>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-4 sm:space-y-5">
              {/* Price - Compact and styled */}
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
                    <span className="text-xl font-bold text-primary-orange">
                      {formatPrice(product.hasVariants ? variantPrice : product.price)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700 font-medium text-sm">Holati</span>
                    </div>
                    <span className="text-green-600 font-medium flex items-center gap-1 text-sm bg-green-50 px-2 py-1 rounded-md">
                      <CheckCircleFAIcon className="text-xs" />
                      Mavjud
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800 text-sm">Tavsif</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Product Variants */}
              {product.hasVariants && product.variants && product.variants.length > 0 && (
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
                    }}
                  />
                </div>
              )}

              {/* Legacy Colors - Show only if no variants */}
              {!product.hasVariants && product.colors && product.colors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 text-sm">Rang: {selectedColor}</h4>
                  <div className="flex gap-1 sm:gap-2 flex-wrap">
                    {product.colors.map((color, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedColor(color)}
                        className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg border transition-all duration-200 text-xs sm:text-sm ${selectedColor === color
                            ? 'border-primary-orange bg-orange-50 text-primary-orange'
                            : 'border-gray-300 hover:border-gray-400'
                          }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Legacy Sizes - Show only if no variants */}
              {!product.hasVariants && product.sizes && product.sizes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 text-sm">O'lcham:</h4>
                  <div className="flex gap-1 sm:gap-2 flex-wrap">
                    {product.sizes.map((size, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedSize(size)}
                        className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg border transition-all duration-200 text-xs sm:text-sm ${selectedSize === size
                            ? 'border-primary-orange bg-orange-50 text-primary-orange'
                            : 'border-gray-300 hover:border-gray-400'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800 text-sm">Miqdor:</h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors duration-200"
                  >
                    <MinusFAIcon className="text-gray-600 text-sm" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      setQuantity(Math.max(1, value));
                    }}
                    inputMode="numeric"
                    step="1"
                    aria-label="Miqdor"
                    placeholder="1"
                    className="w-20 h-10 text-center border border-gray-300 rounded-lg focus:outline-none focus:border-primary-orange text-sm font-medium"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors duration-200"
                  >
                    <PlusFAIcon className="text-gray-600 text-sm" />
                  </button>
                </div>
              </div>

              {/* Product Information */}
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
                      {getCategoryDisplayName(product.category)}
                    </span>
                  </div>

                  {/* Stock Info */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        (product.hasVariants ? variantStock : (product.quantity || product.stock || 0)) > 10 
                          ? 'bg-green-500' 
                          : (product.hasVariants ? variantStock : (product.quantity || product.stock || 0)) > 0 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                      }`}></div>
                      <span className="text-gray-700 text-sm font-medium">Miqdor</span>
                    </div>
                    {product.hasVariants && product.variants && product.variants.length > 0 ? (
                      <span className={`font-semibold text-sm px-2 py-1 rounded-md ${
                        variantStock > 0 
                          ? 'text-green-700 bg-green-50' 
                          : 'text-red-700 bg-red-50'
                      }`}>
                        {variantStock > 0 ? `${variantStock} ta mavjud` : 'Tugagan'}
                      </span>
                    ) : (
                      <span className={`font-semibold text-sm px-2 py-1 rounded-md ${
                        (product.quantity || product.stock || 0) > 0 
                          ? 'text-green-700 bg-green-50' 
                          : 'text-red-700 bg-red-50'
                      }`}>
                        {(product.quantity || product.stock || 0) > 0 
                          ? `${product.quantity || product.stock || '100'} ta mavjud` 
                          : 'Tugagan'
                        }
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-5 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                    aria-label="Yopish"
                    title="Yopish"
                  >
                    <TimesFAIcon className="text-sm" />
                    Yopish
                  </button>
                  <button
                    onClick={handleAddToCart}
                    className="w-full sm:flex-1 py-3 px-6 rounded-lg transition-all duration-200 font-medium text-base flex items-center justify-center gap-2 shadow-md bg-primary-orange text-white hover:bg-opacity-90"
                    aria-label="Savatga qo'shish"
                    title="Savatga qo'shish"
                  >
                    <CartFAIcon className="text-sm" />
                    Savatga qo'shish
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification - Kichik modal */}
      {showNotification && (
        <div className="fixed top-20 right-4 md:top-24 md:right-6 bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg z-[60] transform transition-all duration-300 max-w-xs md:max-w-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-sm md:text-base">Savatga qo'shildi!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;