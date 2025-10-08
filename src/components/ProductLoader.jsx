import React from 'react';

const ProductLoader = ({ 
  count = 8, 
  variant = 'grid', // 'grid', 'list', 'card'
  showText = false,
  className = ''
}) => {
  const renderGridLoader = () => (
    <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden animate-pulse">
          {/* Product Image Skeleton */}
          <div className="relative">
            <div className="w-full h-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer"></div>
            {/* Badge Skeleton */}
            <div className="absolute top-2 left-2 w-12 h-5 bg-gray-200 rounded-full"></div>
            {/* Discount Badge Skeleton */}
            <div className="absolute top-2 right-2 w-8 h-8 bg-gray-200 rounded-full"></div>
          </div>
          
          {/* Product Info Skeleton */}
          <div className="p-3 space-y-2">
            {/* Product Name */}
            <div className="space-y-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            
            {/* Price */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-5 bg-orange-200 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
              {/* Add to Cart Button */}
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
            </div>
            
            {/* Rating */}
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-3 h-3 bg-gray-200 rounded-full"></div>
              ))}
              <div className="h-3 bg-gray-200 rounded w-8 ml-2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListLoader = () => (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 animate-pulse">
          <div className="flex space-x-4">
            {/* Image */}
            <div className="w-20 h-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-lg flex-shrink-0"></div>
            
            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="flex items-center justify-between">
                <div className="h-5 bg-orange-200 rounded w-20"></div>
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCardLoader = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 animate-pulse">
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Construction Icon Skeleton */}
        <div className="w-16 h-16 bg-gradient-to-r from-orange-200 via-orange-100 to-orange-200 bg-[length:200%_100%] animate-shimmer rounded-full"></div>
        
        {/* Text Lines */}
        <div className="space-y-2 w-full">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
        
        {showText && (
          <div className="text-sm text-gray-500">
            Mahsulotlar tayyorlanmoqda...
          </div>
        )}
      </div>
    </div>
  );

  // Minimalist construction-themed loader
  const renderConstructionLoader = () => (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      {/* Clean Spinner */}
      <div className="relative w-16 h-16 mb-8">
        {/* Outer Ring */}
        <div className="absolute inset-0 border-3 border-orange-200 rounded-full"></div>
        
        {/* Spinning Arc */}
        <div className="absolute inset-0 border-3 border-transparent border-t-orange-500 rounded-full animate-spin"></div>
        
        {/* Construction Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.7 19L13.6 9.9C14.5 7.6 14 4.9 12.1 3C10.1 1 7.1 0.6 4.7 1.7L9 6L6 9L1.6 4.7C0.4 7.1 0.9 10.1 2.9 12.1C4.8 14 7.5 14.5 9.8 13.6L18.9 22.7C19.3 23.1 19.9 23.1 20.3 22.7L22.6 20.4C23.1 20 23.1 19.3 22.7 19Z"/>
          </svg>
        </div>
      </div>
      
      {/* Loading Text */}
      {showText && (
        <div className="text-center mb-6">
          <div className="text-lg font-semibold text-gray-800">Mahsulotlar yuklanmoqda</div>
          <div className="text-sm text-gray-500 mt-1">Iltimos kuting...</div>
        </div>
      )}
      
      {/* Minimalist Dots */}
      <div className="flex space-x-2">
        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-100"></div>
        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-200"></div>
      </div>
    </div>
  );

  // Render based on variant
  switch (variant) {
    case 'list':
      return renderListLoader();
    case 'card':
      return renderCardLoader();
    case 'construction':
      return renderConstructionLoader();
    default:
      return renderGridLoader();
  }
};

export default ProductLoader;