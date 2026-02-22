import React from 'react';

// Shimmer effect base class
const shimmerClass = "relative overflow-hidden bg-gray-200 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent";

// Product Card Skeleton
const ProductCardSkeleton = () => (
  <div className="bg-white rounded-lg lg:rounded-xl overflow-hidden shadow-lg border border-gray-200 flex flex-col h-full">
    {/* Image Skeleton */}
    <div className={`h-28 sm:h-48 lg:h-56 ${shimmerClass} rounded-t-xl border-b border-gray-200`}></div>
    
    {/* Content Skeleton */}
    <div className="p-1.5 sm:p-3 lg:p-4 flex flex-col flex-grow bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 border-t border-gray-200/50">
      <div className="flex-grow">
        {/* Title */}
        <div className="mb-1 sm:mb-2">
          <div className={`h-3 sm:h-5 lg:h-6 ${shimmerClass} rounded mb-1`}></div>
          <div className={`h-3 sm:h-5 lg:h-6 ${shimmerClass} rounded w-3/4`}></div>
        </div>
        
        {/* Description */}
        <div className="mb-1 sm:mb-2 p-1 sm:p-2 bg-blue-50 rounded-md border-l-3 border-blue-200">
          <div className={`h-2 sm:h-4 ${shimmerClass} rounded mb-1`}></div>
          <div className={`h-2 sm:h-4 ${shimmerClass} rounded w-4/5 sm:block hidden`}></div>
        </div>
      </div>

      <div className="mt-auto">
        {/* Price and Stock */}
        <div className="flex items-center justify-between mb-1 sm:mb-2">
          <div className="flex flex-col">
            <div className={`h-3 sm:h-5 lg:h-6 ${shimmerClass} rounded w-16 sm:w-20 mb-1`}></div>
            <div className={`h-2 sm:h-4 ${shimmerClass} rounded w-12 sm:w-16`}></div>
          </div>
          <div className="text-right">
            <div className={`h-2 sm:h-4 ${shimmerClass} rounded w-10 sm:w-12 mb-1`}></div>
            <div className={`h-2 sm:h-3 ${shimmerClass} rounded w-12 sm:w-16`}></div>
          </div>
        </div>
        
        {/* Button */}
        <div className={`h-6 sm:h-10 lg:h-11 ${shimmerClass} rounded-lg`}></div>
      </div>
    </div>
  </div>
);

// Products Grid Skeleton
const ProductsGridSkeleton = ({ count = 8 }) => (
  <div className="container mx-auto px-4 lg:px-6 py-6 lg:py-8">
    {/* Filters Skeleton */}
    <div className="mb-6 lg:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={`h-8 ${shimmerClass} rounded-full w-20 flex-shrink-0`}></div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-8 ${shimmerClass} rounded w-24`}></div>
          <div className={`h-8 ${shimmerClass} rounded w-32`}></div>
        </div>
      </div>
    </div>
    
    {/* Products Grid Skeleton */}
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  </div>
);

// Craftsman Card Skeleton
const CraftsmanCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-lg overflow-hidden">
    {/* Image Skeleton */}
    <div className={`h-48 ${shimmerClass} rounded-t-xl`}></div>
    
    {/* Content Skeleton */}
    <div className="p-2 sm:p-3 lg:p-4">
      <div className="mb-2 sm:mb-3">
        {/* Name */}
        <div className={`h-4 sm:h-5 ${shimmerClass} rounded mb-1`}></div>
        {/* Specialty */}
        <div className={`h-3 sm:h-4 ${shimmerClass} rounded w-3/4 mb-1`}></div>
        {/* Price */}
        <div className={`h-4 ${shimmerClass} rounded w-24 mt-1`}></div>
      </div>
      
      <div className="mb-2 sm:mb-3">
        {/* Description */}
        <div className={`h-3 sm:h-4 ${shimmerClass} rounded mb-1`}></div>
        <div className={`h-3 sm:h-4 ${shimmerClass} rounded w-2/3 mb-2`}></div>
        {/* Phone */}
        <div className="flex items-center">
          <div className={`w-3 h-3 ${shimmerClass} rounded mr-1`}></div>
          <div className={`h-3 ${shimmerClass} rounded w-20`}></div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        {/* Status */}
        <div className={`h-6 ${shimmerClass} rounded-full w-12`}></div>
        {/* Button */}
        <div className={`h-8 sm:h-9 ${shimmerClass} rounded-lg w-16 sm:w-20`}></div>
      </div>
    </div>
  </div>
);

// Craftsmen Grid Skeleton
const CraftsmenGridSkeleton = ({ count = 6 }) => (
  <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-20 lg:pb-12">
    {/* Search Skeleton */}
    <div className="mb-4">
      <div className="relative max-w-xl mx-auto">
        <div className={`h-10 ${shimmerClass} rounded-lg`}></div>
      </div>
    </div>
    
    {/* Filters Skeleton */}
    <div className="mb-6">
      <div className="flex items-center gap-2 overflow-x-auto py-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={`h-8 ${shimmerClass} rounded-full w-20 flex-shrink-0`}></div>
        ))}
      </div>
    </div>
    
    {/* Craftsmen Grid Skeleton */}
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
      {Array.from({ length: count }).map((_, index) => (
        <CraftsmanCardSkeleton key={index} />
      ))}
    </div>
  </div>
);

// Main LoadingSkeleton component with type-based rendering
const LoadingSkeleton = ({ 
  type = 'product-card', 
  count = 1, 
  className = '' 
}) => {
  const skeletonComponents = {
    'product-card': ProductCardSkeleton,
    'craftsman-card': CraftsmanCardSkeleton,
    'product-grid': ProductsGridSkeleton,
    'craftsmen-grid': CraftsmenGridSkeleton
  };

  const SkeletonComponent = skeletonComponents[type] || ProductCardSkeleton;

  if (type === 'product-grid' || type === 'craftsmen-grid') {
    return <SkeletonComponent count={count} className={className} />;
  }

  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonComponent key={index} />
      ))}
    </div>
  );
};

export default LoadingSkeleton;

export {
  ProductCardSkeleton,
  ProductsGridSkeleton,
  CraftsmanCardSkeleton,
  CraftsmenGridSkeleton
};

