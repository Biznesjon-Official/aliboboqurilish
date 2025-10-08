import React from 'react';

const ConstructionLoader = ({ 
  message = "Yuklanmoqda...", 
  showProgress = false, 
  progress = 0,
  size = "medium", // "small", "medium", "large"
  theme = "orange" // "orange", "blue", "green"
}) => {
  const sizeClasses = {
    small: "w-12 h-12",
    medium: "w-16 h-16", 
    large: "w-20 h-20"
  };

  const themeColors = {
    orange: {
      primary: "border-orange-500",
      secondary: "border-orange-200",
      accent: "bg-orange-500",
      text: "text-orange-600"
    },
    blue: {
      primary: "border-blue-500",
      secondary: "border-blue-200",
      accent: "bg-blue-500",
      text: "text-blue-600"
    },
    green: {
      primary: "border-green-500",
      secondary: "border-green-200",
      accent: "bg-green-500",
      text: "text-green-600"
    }
  };

  const colors = themeColors[theme];
  const sizeClass = sizeClasses[size];

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Minimalist Spinner with Construction Theme */}
      <div className={`relative ${sizeClass} mb-6`}>
        {/* Outer Ring */}
        <div className={`absolute inset-0 ${colors.secondary} border-3 rounded-full`}></div>
        
        {/* Spinning Arc */}
        <div className={`absolute inset-0 ${colors.primary} border-3 border-transparent border-t-current rounded-full animate-spin`}></div>
        
        {/* Construction Icon in Center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className={`w-6 h-6 ${colors.text}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.7 19L13.6 9.9C14.5 7.6 14 4.9 12.1 3C10.1 1 7.1 0.6 4.7 1.7L9 6L6 9L1.6 4.7C0.4 7.1 0.9 10.1 2.9 12.1C4.8 14 7.5 14.5 9.8 13.6L18.9 22.7C19.3 23.1 19.9 23.1 20.3 22.7L22.6 20.4C23.1 20 23.1 19.3 22.7 19Z"/>
          </svg>
        </div>
      </div>
      
      {/* Progress Bar */}
      {showProgress && (
        <div className="w-32 bg-gray-200 rounded-full h-1.5 mb-4">
          <div 
            className={`h-1.5 ${colors.accent} rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
      )}
      
      {/* Clean Message */}
      {message && (
        <div className="text-center">
          <div className="text-sm font-medium text-gray-700">{message}</div>
        </div>
      )}
      
      {/* Minimalist Dots */}
      <div className="flex space-x-1.5 mt-4">
        <div className={`w-1.5 h-1.5 ${colors.accent} rounded-full animate-bounce`}></div>
        <div className={`w-1.5 h-1.5 ${colors.accent} rounded-full animate-bounce delay-100`}></div>
        <div className={`w-1.5 h-1.5 ${colors.accent} rounded-full animate-bounce delay-200`}></div>
      </div>
    </div>
  );
};

export default ConstructionLoader;