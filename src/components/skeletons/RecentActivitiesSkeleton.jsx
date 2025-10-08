import React from 'react';

const RecentActivitiesSkeleton = ({ itemCount = 5 }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="bg-gray-200 rounded-md h-6 w-32 animate-pulse"></div>
        <div className="bg-gray-100 rounded-md h-8 w-24 animate-pulse"></div>
      </div>

      {/* Activity items skeleton */}
      <div className="space-y-4">
        {Array.from({ length: itemCount }).map((_, index) => (
          <div key={index} className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
            {/* Icon skeleton */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            
            {/* Content skeleton */}
            <div className="flex-1 min-w-0">
              {/* Title skeleton */}
              <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
              
              {/* Description skeleton */}
              <div className="w-full h-3 bg-gray-100 rounded animate-pulse mb-1"></div>
              <div className="w-2/3 h-3 bg-gray-100 rounded animate-pulse"></div>
            </div>
            
            {/* Timestamp skeleton */}
            <div className="flex-shrink-0">
              <div className="w-16 h-3 bg-gray-100 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivitiesSkeleton;