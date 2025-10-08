import React from 'react';

// Individual skeleton components
const CategoryNavigationSkeleton = () => (
  <div className="mb-2">
    <div className="flex gap-4 overflow-x-auto pb-2">
      {[...Array(6)].map((_, index) => (
        <div 
          key={index} 
          className="h-8 bg-gray-200 rounded-full animate-pulse min-w-[80px] flex-shrink-0"
        />
      ))}
    </div>
  </div>
);

const FilterSectionSkeleton = () => (
  <div className="mb-4">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3 lg:gap-4">
        {/* Saralash label */}
        <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
        
        {/* Select dropdown */}
        <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
        
        {/* Desktop price filter */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
          <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-2"></div>
          <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
          <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
        </div>
        
        {/* Mobile price filter button */}
        <div className="sm:hidden h-10 bg-gray-200 rounded-lg animate-pulse w-28"></div>
      </div>
    </div>
  </div>
);

const ProductCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm animate-pulse">
    {/* Image skeleton */}
    <div className="h-56 bg-gray-200 relative">
      {/* Badge skeleton */}
      <div className="absolute top-2 left-2 h-5 bg-gray-300 rounded-full w-16"></div>
    </div>
    
    {/* Content skeleton */}
    <div className="p-4">
      {/* Product name */}
      <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
      
      {/* Category */}
      <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
      
      {/* Description */}
      <div className="h-3 bg-gray-200 rounded mb-3 w-5/6"></div>
      
      {/* Price section */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-5 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
      
      {/* Add to cart button */}
      <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
    </div>
  </div>
);

const ProductCardsSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
    {[...Array(count)].map((_, index) => (
      <ProductCardSkeleton key={index} />
    ))}
  </div>
);

// Main skeleton component
const ProductGridSkeleton = ({ count = 8 }) => (
  <div className="container mx-auto px-4 lg:px-6 py-4 lg:py-6">
    {/* Category Navigation Skeleton */}
    <CategoryNavigationSkeleton />
    
    {/* Filter Section Skeleton */}
    <FilterSectionSkeleton />
    
    {/* Products Grid Skeleton */}
    <ProductCardsSkeleton count={count} />
  </div>
);

export default ProductGridSkeleton;
export { 
  CategoryNavigationSkeleton, 
  FilterSectionSkeleton, 
  ProductCardSkeleton, 
  ProductCardsSkeleton 
};