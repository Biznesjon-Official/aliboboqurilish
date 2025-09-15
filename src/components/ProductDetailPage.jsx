import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProduct } from '../hooks/useProductQueries';
import { ProductsGridSkeleton } from './LoadingSkeleton';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Fetch product data with React Query caching
  const { data, isLoading, error } = useProduct(id);
  const product = data?.product;

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Handle add to cart
  const handleAddToCart = useCallback((productData, variantData = null) => {
    const cartItem = {
      ...productData,
      selectedVariant: variantData,
      quantity,
      cartId: `${productData._id}_${variantData?.id || 'default'}_${Date.now()}`
    };
    
    // Dispatch custom event for cart management
    window.dispatchEvent(new CustomEvent('addToCart', { detail: cartItem }));
    
    // Show success notification
    console.log('Added to cart:', cartItem);
  }, [quantity]);

  // Format price helper
  const formatPrice = (price) => {
    const numeric = parseInt(price?.toString().replace(/[^\d]/g, '') || '0', 10);
    return numeric.toLocaleString() + " so'm";
  };

  // Get all product images
  const getAllProductImages = () => {
    const allImages = [];

    if (product?.hasVariants && product?.variants?.length > 0) {
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

    if (allImages.length === 0) {
      if (product?.images && product.images.length > 0) {
        allImages.push(...product.images);
      } else if (product?.image) {
        allImages.push(product.image);
      }
    }

    const uniqueImages = [...new Set(allImages)];
    return uniqueImages.length > 0 ? uniqueImages : ['/assets/default-product.png'];
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <ProductsGridSkeleton count={1} />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
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

  const productImages = getAllProductImages();
  const currentImage = productImages[selectedImage];
  const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Orqaga
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                <img
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full object-contain"
                  loading="eager"
                />
                
                {/* Discount Badge */}
                {discount > 0 && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                      -{discount}%
                    </span>
                  </div>
                )}

                {/* Image Navigation */}
                {productImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImage(prev => prev === 0 ? productImages.length - 1 : prev - 1)}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full w-10 h-10 flex items-center justify-center shadow-md transition-all duration-200"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setSelectedImage(prev => prev === productImages.length - 1 ? 0 : prev + 1)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full w-10 h-10 flex items-center justify-center shadow-md transition-all duration-200"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Images */}
              {productImages.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {productImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        selectedImage === index ? 'border-orange-500' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Product Name and Brand */}
              <div>
                {product.brand && (
                  <div className="text-sm text-gray-500 uppercase tracking-wide mb-2">
                    {product.brand}
                  </div>
                )}
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                  {product.name}
                </h1>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl font-bold text-orange-600">
                    {formatPrice(product.price)}
                  </span>
                  {discount > 0 && (
                    <span className="text-sm bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                      -{discount}%
                    </span>
                  )}
                </div>
                {product.oldPrice && product.oldPrice > product.price && (
                  <div className="text-gray-500 line-through text-lg">
                    {formatPrice(product.oldPrice)}
                  </div>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Tavsif</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Stock Info */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Mavjud:</span>
                <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {product.stock > 0 ? `${product.stock} ${product.unit || 'dona'}` : 'Tugagan'}
                </span>
              </div>

              {/* Quantity Selector */}
              {product.stock > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Miqdor</label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors duration-200"
                    >
                      -
                    </button>
                    <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(prev => Math.min(product.stock, prev + 1))}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors duration-200"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => handleAddToCart(product, selectedVariant)}
                  disabled={product.stock === 0}
                  className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-300 ${
                    product.stock === 0
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg'
                  }`}
                >
                  {product.stock === 0 ? 'Tugagan' : 'Savatga qo\'shish'}
                </button>
                
                <button
                  onClick={handleBack}
                  className="w-full py-4 px-6 rounded-lg font-semibold text-lg border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                >
                  Davom etish
                </button>
              </div>

              {/* Additional Info */}
              <div className="border-t pt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Kategoriya:</span>
                  <span className="font-medium">{product.category}</span>
                </div>
                {product.brand && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Brend:</span>
                    <span className="font-medium">{product.brand}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Mahsulot kodi:</span>
                  <span className="font-medium">{product._id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;