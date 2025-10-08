const ModernLoader = ({ 
  size = "medium", 
  variant = "gradient", 
  message = "", 
  className = "",
  color = "orange" 
}) => {
  // Size configurations
  const sizeConfig = {
    small: { 
      container: "py-4", 
      spinner: "w-6 h-6", 
      dots: "w-1 h-1",
      text: "text-xs"
    },
    medium: { 
      container: "py-8", 
      spinner: "w-10 h-10", 
      dots: "w-1.5 h-1.5",
      text: "text-sm"
    },
    large: { 
      container: "py-12", 
      spinner: "w-16 h-16", 
      dots: "w-2 h-2",
      text: "text-base"
    }
  };

  // Color configurations
  const colorConfig = {
    orange: {
      primary: "orange-500",
      secondary: "orange-400", 
      tertiary: "orange-300",
      light: "orange-50",
      lighter: "orange-100"
    },
    blue: {
      primary: "blue-500",
      secondary: "blue-400",
      tertiary: "blue-300", 
      light: "blue-50",
      lighter: "blue-100"
    },
    green: {
      primary: "green-500",
      secondary: "green-400",
      tertiary: "green-300",
      light: "green-50", 
      lighter: "green-100"
    }
  };

  const config = sizeConfig[size] || sizeConfig.medium;
  const colors = colorConfig[color] || colorConfig.orange;

  // Gradient spinner (default)
  if (variant === "gradient") {
    return (
      <div className={`flex flex-col items-center justify-center ${config.container} ${className}`}>
        {/* Modern gradient spinner */}
        <div className="relative">
          {/* Outer ring */}
          <div className={`${config.spinner} border-4 border-gray-100 rounded-full`}></div>
          {/* Animated gradient ring */}
          <div className={`absolute inset-0 ${config.spinner} border-4 border-transparent border-t-${colors.primary} border-r-${colors.secondary} rounded-full animate-spin`}></div>
          {/* Inner glow */}
          <div className={`absolute inset-2 bg-gradient-to-br from-${colors.light} to-${colors.lighter} rounded-full opacity-50`}></div>
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-2 h-2 bg-${colors.primary} rounded-full animate-pulse`}></div>
          </div>
        </div>
        
        {message && (
          <p className={`mt-4 text-gray-600 ${config.text} font-medium`}>
            {message}
          </p>
        )}
        
        {/* Subtle animated dots */}
        <div className="flex space-x-1 mt-3">
          <div className={`${config.dots} bg-${colors.tertiary} rounded-full animate-pulse`} style={{ animationDelay: '0ms' }}></div>
          <div className={`${config.dots} bg-${colors.secondary} rounded-full animate-pulse`} style={{ animationDelay: '200ms' }}></div>
          <div className={`${config.dots} bg-${colors.primary} rounded-full animate-pulse`} style={{ animationDelay: '400ms' }}></div>
        </div>
      </div>
    );
  }

  // Pulse variant
  if (variant === "pulse") {
    return (
      <div className={`flex flex-col items-center justify-center ${config.container} ${className}`}>
        {/* Pulse loader */}
        <div className="relative">
          <div className={`${config.spinner} bg-gradient-to-r from-${colors.secondary} to-${colors.primary} rounded-full animate-pulse`}></div>
          <div className={`absolute inset-0 ${config.spinner} bg-gradient-to-r from-${colors.tertiary} to-${colors.secondary} rounded-full animate-ping opacity-75`}></div>
        </div>
        
        {message && (
          <p className={`mt-4 text-gray-600 ${config.text} font-medium animate-pulse`}>
            {message}
          </p>
        )}
      </div>
    );
  }

  // Dots variant
  if (variant === "dots") {
    return (
      <div className={`flex flex-col items-center justify-center ${config.container} ${className}`}>
        {/* Bouncing dots loader */}
        <div className="flex space-x-2">
          <div className={`${config.dots} bg-${colors.primary} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
          <div className={`${config.dots} bg-${colors.secondary} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
          <div className={`${config.dots} bg-${colors.tertiary} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
          <div className={`${config.dots} bg-${colors.secondary} rounded-full animate-bounce`} style={{ animationDelay: '450ms' }}></div>
          <div className={`${config.dots} bg-${colors.primary} rounded-full animate-bounce`} style={{ animationDelay: '600ms' }}></div>
        </div>
        
        {message && (
          <p className={`mt-4 text-gray-600 ${config.text} font-medium`}>
            {message}
          </p>
        )}
      </div>
    );
  }

  // Bars variant
  if (variant === "bars") {
    return (
      <div className={`flex flex-col items-center justify-center ${config.container} ${className}`}>
        {/* Animated bars loader */}
        <div className="flex items-end space-x-1">
          <div className={`w-1 h-8 bg-${colors.primary} animate-pulse`} style={{ animationDelay: '0ms' }}></div>
          <div className={`w-1 h-6 bg-${colors.secondary} animate-pulse`} style={{ animationDelay: '100ms' }}></div>
          <div className={`w-1 h-10 bg-${colors.primary} animate-pulse`} style={{ animationDelay: '200ms' }}></div>
          <div className={`w-1 h-4 bg-${colors.tertiary} animate-pulse`} style={{ animationDelay: '300ms' }}></div>
          <div className={`w-1 h-8 bg-${colors.secondary} animate-pulse`} style={{ animationDelay: '400ms' }}></div>
          <div className={`w-1 h-6 bg-${colors.primary} animate-pulse`} style={{ animationDelay: '500ms' }}></div>
        </div>
        
        {message && (
          <p className={`mt-4 text-gray-600 ${config.text} font-medium`}>
            {message}
          </p>
        )}
      </div>
    );
  }

  // Ripple variant
  if (variant === "ripple") {
    return (
      <div className={`flex flex-col items-center justify-center ${config.container} ${className}`}>
        {/* Ripple effect loader */}
        <div className="relative">
          <div className={`${config.spinner} border-4 border-${colors.primary} rounded-full animate-ping opacity-75`}></div>
          <div className={`absolute inset-2 border-4 border-${colors.secondary} rounded-full animate-ping opacity-50`} style={{ animationDelay: '200ms' }}></div>
          <div className={`absolute inset-4 border-4 border-${colors.tertiary} rounded-full animate-ping opacity-25`} style={{ animationDelay: '400ms' }}></div>
        </div>
        
        {message && (
          <p className={`mt-4 text-gray-600 ${config.text} font-medium`}>
            {message}
          </p>
        )}
      </div>
    );
  }

  // Minimal variant
  if (variant === "minimal") {
    return (
      <div className={`flex items-center justify-center ${config.container} ${className}`}>
        <div className={`${config.spinner} border-2 border-gray-200 border-t-${colors.primary} rounded-full animate-spin`}></div>
        {message && (
          <span className={`ml-3 text-gray-600 ${config.text} font-medium`}>
            {message}
          </span>
        )}
      </div>
    );
  }

  // Default gradient variant
  return (
    <div className={`flex flex-col items-center justify-center ${config.container} ${className}`}>
      {/* Modern gradient spinner */}
      <div className="relative">
        {/* Outer ring */}
        <div className={`${config.spinner} border-4 border-gray-100 rounded-full`}></div>
        {/* Animated gradient ring */}
        <div className={`absolute inset-0 ${config.spinner} border-4 border-transparent border-t-${colors.primary} border-r-${colors.secondary} rounded-full animate-spin`}></div>
        {/* Inner glow */}
        <div className={`absolute inset-2 bg-gradient-to-br from-${colors.light} to-${colors.lighter} rounded-full opacity-50`}></div>
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-2 h-2 bg-${colors.primary} rounded-full animate-pulse`}></div>
        </div>
      </div>
      
      {message && (
        <p className={`mt-4 text-gray-600 ${config.text} font-medium`}>
          {message}
        </p>
      )}
      
      {/* Subtle animated dots */}
      <div className="flex space-x-1 mt-3">
        <div className={`w-1 h-1 bg-${colors.tertiary} rounded-full animate-pulse`} style={{ animationDelay: '0ms' }}></div>
        <div className={`w-1 h-1 bg-${colors.secondary} rounded-full animate-pulse`} style={{ animationDelay: '200ms' }}></div>
        <div className={`w-1 h-1 bg-${colors.primary} rounded-full animate-pulse`} style={{ animationDelay: '400ms' }}></div>
      </div>
    </div>
  );
};