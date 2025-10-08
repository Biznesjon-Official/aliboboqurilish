import React from 'react';

const ProductCardSkeleton = ({ count = 1, className = '' }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse ${className}`}>
          {/* Image Skeleton with Construction Theme */}
          <div className="relative h-48 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100">
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
            
            {/* Construction Icon Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
                </svg>
              </div>
            </div>
            
            {/* Badge Skeleton */}
            <div className="absolute top-3 left-3">
              <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
            </div>
            
            {/* Discount Badge Skeleton */}
            <div className="absolute top-3 right-3">
              <div className="w-10 h-10 bg-orange-200 rounded-full"></div>
            </div>
          </div>
          
          {/* Content Skeleton */}
          <div className="p-4 space-y-3">
            {/* Title Skeleton */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded-lg w-4/5"></div>
              <div className="h-3 bg-gray-200 rounded-lg w-3/5"></div>
            </div>
            
            {/* Price Section */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                {/* Current Price */}
                <div className="h-6 bg-gradient-to-r from-orange-200 to-orange-100 rounded-lg w-20"></div>
                {/* Old Price */}
                <div className="h-3 bg-gray-200 rounded-lg w-16"></div>
              </div>
              
              {/* Add to Cart Button Skeleton */}
              <div className="w-10 h-10 bg-gradient-to-r from-orange-200 to-orange-100 rounded-lg"></div>
            </div>
            
            {/* Rating Skeleton */}
            <div className="flex items-center space-x-1">
              {/* Stars */}
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-4 h-4 bg-yellow-200 rounded-sm"></div>
              ))}
              {/* Rating Text */}
              <div className="h-3 bg-gray-200 rounded w-8 ml-2"></div>
            </div>
            
            {/* Stock Status */}
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-200 rounded-full"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default ProductCardSkeleton;