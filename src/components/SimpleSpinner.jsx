import React from 'react';

const SimpleSpinner = ({ size = 'medium', message = 'Yuklanmoqda...', className = '' }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      <div className={`${sizeClasses[size]} border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin`}></div>
      {message && (
        <p className="mt-3 text-gray-600 text-sm font-medium">{message}</p>
      )}
    </div>
  );
};

export default SimpleSpinner;