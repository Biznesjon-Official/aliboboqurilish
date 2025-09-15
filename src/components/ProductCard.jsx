import React, { useState, useCallback, useEffect, memo } from 'react';
import { ChevronLeftFAIcon, ChevronRightFAIcon } from './FontAwesome';
import { useNavigate } from 'react-router-dom';
import OptimizedImage from './OptimizedImage';

const ProductCard = memo(({
  product,
  onAddToCart,
  onOpenDetail,
  className = "",
  enableRouteNavigation = true
}) => {
  const navigate = useNavigate();
  const [imageLoading, setImageLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  // Get all product images from variants
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

    // Remove duplicates and ensure at least one image
    const uniqueImages = [...new Set(allImages)];
    return uniqueImages.length > 0 ? uniqueImages : ['/assets/default-product.svg'];
  };

  const productImages = getAllProductImages();
  const currentImage = productImages[currentImageIndex];
  const discount = product.oldPrice ? calculateDiscount(product.price, product.oldPrice) : 0;

  // Handle card click - navigate to product detail page
  const handleCardClick = useCallback(() => {
    if (enableRouteNavigation) {
      navigate(`/product/${product._id}`);
    } else {
      // Fallback to modal for quick preview
      if (product.hasVariants && product.variants && product.variants.length > 0) {
        onOpenDetail(product);
      } else {
        onAddToCart(product);
      }
    }
  }, [product, onOpenDetail, onAddToCart, navigate, enableRouteNavigation]);

  // Handle quick preview button
  const handleQuickPreview = useCallback((e) => {
    e.stopPropagation();
    if (onOpenDetail) {
      onOpenDetail(product);
    }
  }, [onOpenDetail, product]);

  // Handle add to cart button
  const handleAddToCart = useCallback((e) => {
    e.stopPropagation();
    if (product.hasVariants && product.variants && product.variants.length > 0) {
      // For products with variants, open detail page or modal
      if (enableRouteNavigation) {
        navigate(`/product/${product._id}`);
      } else {
        onOpenDetail(product);
      }
    } else {
      onAddToCart(product);
    }
  }, [onAddToCart, onOpenDetail, product, navigate, enableRouteNavigation]);

  return (
    <div
      className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-orange-200 relative h-full flex flex-col cursor-pointer ${className}`}
      onClick={handleCardClick}
    >
      {/* Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {/* New Badge */}
        {product.isNew && (
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-md font-normal">
            Yangi
          </span>
        )}

        {/* Popular Badge */}
        {product.isPopular && (
          <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-md font-normal">
            Top
          </span>
        )}

        {/* Custom Badge */}
        {product.badge && product.badge !== 'Yo\'q' && !product.isNew && (
          <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-md font-normal">
            {product.badge}
          </span>
        )}
      </div>

      {/* Discount Badge */}
      {discount > 0 && (
        <div className="absolute top-2 right-2 z-10">
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-md font-normal">
            -{discount}%
          </span>
        </div>
      )}

      {/* Image Container */}
      <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden relative group">
        <OptimizedImage
          src={currentImage}
          alt={product.name}
          className="w-full h-full hover:scale-105 transition-transform duration-300"
          aspectRatio="1"
          objectFit="contain"
          placeholder="skeleton"
          priority={true}
          fallbackSrc="/assets/default-product.svg"
          onLoad={() => setImageLoading(false)}
          onError={() => setImageLoading(false)}
        />

        {/* Image Navigation - Show only if multiple images */}
        {productImages.length > 1 && (
          <>
            {/* Previous Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(prev =>
                  prev === 0 ? productImages.length - 1 : prev - 1
                );
              }}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md"
            >
              <ChevronLeftFAIcon className="text-xs text-gray-600" />
            </button>

            {/* Next Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(prev =>
                  prev === productImages.length - 1 ? 0 : prev + 1
                );
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md"
            >
              <ChevronRightFAIcon className="text-xs text-gray-600" />
            </button>

            {/* Image Indicators */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {productImages.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${index === currentImageIndex
                    ? 'bg-primary-orange'
                    : 'bg-white bg-opacity-60 hover:bg-opacity-80'
                    }`}
                />
              ))}
            </div>

            {/* Image Counter */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {currentImageIndex + 1}/{productImages.length}
            </div>
          </>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 flex flex-col flex-grow">
        {/* Brand */}
        {product.brand && (
          <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">
            {product.brand}
          </div>
        )}

        {/* Product Name */}
        <h3 className="font-semibold text-gray-800 text-sm md:text-base mb-2 leading-tight line-clamp-2 min-h-[2.5rem]">
          {product.name || 'Noma\'lum mahsulot'}
        </h3>

        {/* Description */}
        <p className="text-gray-500 text-xs md:text-sm mb-3 line-clamp-2 leading-relaxed flex-grow">
          {product.description}
        </p>

        {/* Price Section */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg md:text-xl font-bold text-primary-orange">
              {formatPrice(product.price)}
            </span>
            {discount > 0 && (
              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                -{discount}%
              </span>
            )}
          </div>

          {/* Old Price */}
          {product.oldPrice && product.oldPrice > product.price && (
            <div className="text-gray-400 line-through text-xs">
              {formatPrice(product.oldPrice)}
            </div>
          )}
        </div>

        {/* Stock Info */}
        <div className="text-xs text-gray-500 mb-4">
          Mavjud: {product.stock || 0} {product.unit || 'dona'}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-300 ${product.stock === 0
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-primary-orange text-white hover:bg-opacity-90 hover:shadow-md'
              }`}
          >
            {product.stock === 0 ? 'Tugagan' : 
             (product.hasVariants && product.variants && product.variants.length > 0) ? 'Ko\'rish' : 'Savatga'}
          </button>
          
          {/* Quick Preview Button (only show if modal handler exists) */}
          {onOpenDetail && enableRouteNavigation && (
            <button
              onClick={handleQuickPreview}
              className="w-full py-2 px-4 rounded-lg font-medium text-sm border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
            >
              Tez ko'rish
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;