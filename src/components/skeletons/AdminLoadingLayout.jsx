import React from 'react';
import AdminDashboardSkeleton from './AdminDashboardSkeleton';
import LoadingCard from '../LoadingCard';

const AdminLoadingLayout = ({ isLoading = true, message = "Sahifa yuklanmoqda..." }) => {
  return (
    <div className="flex-1 lg:ml-64 p-6">
      <div className="mb-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="flex space-x-3 mb-6">
          <div className="h-10 bg-gray-200 rounded w-1/5 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-1/6 animate-pulse"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <LoadingCard count={8} />
      </div>
    </div>
  );
};

export default AdminLoadingLayout;