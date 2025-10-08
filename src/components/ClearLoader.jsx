import React from 'react';

const ClearLoader = ({ 
  message = "Yuklanmoqda...", 
  size = "medium", // "small", "medium", "large"
  type = "construction" // "construction", "simple", "modern"
}) => {
  const sizeClasses = {
    small: "w-12 h-12",
    medium: "w-16 h-16", 
    large: "w-20 h-20"
  };

  const sizeClass = sizeClasses[size];

  // Construction themed loader
  const ConstructionTheme = () => (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Main Building Icon */}
      <div className={`relative ${sizeClass} mb-6`}>
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full"></div>
        
        {/* Building Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-10 h-10 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3L2 12H5V20H19V12H22L12 3M12 5.7L17 10.7V18H15V13H9V18H7V10.7L12 5.7M11 14H13V16H11V14Z"/>
          </svg>
        </div>
        
        {/* Rotating Border */}
        <div className="absolute inset-0 border-4 border-transparent border-t-orange-500 rounded-full animate-spin"></div>
      </div>
      
      {/* Tools */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center animate-bounce">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.5 5.5L18.5 7.5L16.5 5.5L18.5 3.5L20.5 5.5M12 1L10.5 2.5L16.5 8.5L18 7L12 1Z"/>
          </svg>
        </div>
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center animate-bounce delay-200">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.7 19L13.6 9.9C14.5 7.6 14 4.9 12.1 3C10.1 1 7.1 0.6 4.7 1.7L9 6L6 9L1.6 4.7C0.4 7.1 0.9 10.1 2.9 12.1C4.8 14 7.5 14.5 9.8 13.6L18.9 22.7C19.3 23.1 19.9 23.1 20.3 22.7L22.6 20.4C23.1 20 23.1 19.3 22.7 19Z"/>
          </svg>
        </div>
        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center animate-bounce delay-400">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16.06 10.94L15.06 11.94L17.06 13.94L18.06 12.94L16.06 10.94M4 2C2.9 2 2 2.9 2 4S2.9 6 4 6 6 5.1 6 4 5.1 2 4 2Z"/>
          </svg>
        </div>
      </div>
      
      {/* Message */}
      <div className="text-center">
        <div className="text-lg font-semibold text-gray-800 mb-1">{message}</div>
        <div className="text-sm text-gray-500">Qurilish materiallari</div>
      </div>
      
      {/* Progress Dots */}
      <div className="flex space-x-2 mt-4">
        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-100"></div>
        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-200"></div>
      </div>
    </div>
  );

  // Simple spinner loader
  const SimpleTheme = () => (
    <div className="flex flex-col items-center justify-center py-8">
      <div className={`relative ${sizeClass} mb-4`}>
        <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-orange-500 rounded-full animate-spin"></div>
      </div>
      <div className="text-lg font-medium text-gray-700">{message}</div>
    </div>
  );

  // Modern gradient loader
  const ModernTheme = () => (
    <div className="flex flex-col items-center justify-center py-8">
      <div className={`relative ${sizeClass} mb-4`}>
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 rounded-full animate-pulse"></div>
        <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
          <div className="w-4 h-4 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full animate-ping"></div>
        </div>
      </div>
      <div className="text-lg font-medium text-gray-700">{message}</div>
      <div className="flex space-x-1 mt-2">
        <div className="w-1 h-1 bg-orange-400 rounded-full animate-pulse"></div>
        <div className="w-1 h-1 bg-orange-400 rounded-full animate-pulse delay-100"></div>
        <div className="w-1 h-1 bg-orange-400 rounded-full animate-pulse delay-200"></div>
      </div>
    </div>
  );

  // Render based on type
  switch (type) {
    case 'simple':
      return <SimpleTheme />;
    case 'modern':
      return <ModernTheme />;
    case 'construction':
    default:
      return <ConstructionTheme />;
  }
};

export default ClearLoader;