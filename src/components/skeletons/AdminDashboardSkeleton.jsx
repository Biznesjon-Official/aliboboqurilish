import React from 'react';
import RecentActivitiesSkeleton from './RecentActivitiesSkeleton';

const AdminDashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse lg:hidden"></div>
            <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </header>

      {/* Main content skeleton */}
      <main className="p-6 max-w-7xl mx-auto">
        {/* Stats Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="w-4 h-4 bg-gray-100 rounded animate-pulse"></div>
              </div>
              <div className="w-16 h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="w-20 h-4 bg-gray-100 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
        
        {/* Recent Activities skeleton */}
        <RecentActivitiesSkeleton itemCount={5} />
      </main>
    </div>
  );
};

export default AdminDashboardSkeleton;