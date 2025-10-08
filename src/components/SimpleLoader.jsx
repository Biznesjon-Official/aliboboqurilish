const SimpleLoader = ({ message = "", size = "medium", variant = "modern" }) => {
  // Size configurations
  const sizeConfig = {
    small: { container: "py-8", spinner: "w-6 h-6", dots: "w-1.5 h-1.5" },
    medium: { container: "py-12", spinner: "w-10 h-10", dots: "w-2 h-2" },
    large: { container: "py-16", spinner: "w-16 h-16", dots: "w-3 h-3" }
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  if (variant === "pulse") {
    return (
      <div className={`flex flex-col items-center justify-center ${config.container}`}>
        {/* Pulse loader */}
        <div className="relative">
          <div className={`${config.spinner} bg-gradient-to-r from-orange-400 to-orange-600 rounded-full animate-pulse`}></div>
          <div className={`absolute inset-0 ${config.spinner} bg-gradient-to-r from-orange-300 to-orange-500 rounded-full animate-ping opacity-75`}></div>
        </div>
        
        {message && (
          <p className="mt-4 text-gray-600 text-sm font-medium animate-pulse">
            {message}
          </p>
        )}
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={`flex flex-col items-center justify-center ${config.container}`}>
        {/* Bouncing dots loader */}
        <div className="flex space-x-2">
          <div className={`${config.dots} bg-orange-500 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
          <div className={`${config.dots} bg-orange-500 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
          <div className={`${config.dots} bg-orange-500 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
          <div className={`${config.dots} bg-orange-500 rounded-full animate-bounce`} style={{ animationDelay: '450ms' }}></div>
        </div>
        
        {message && (
          <p className="mt-4 text-gray-600 text-sm font-medium">
            {message}
          </p>
        )}
      </div>
    );
  }

  if (variant === "bars") {
    return (
      <div className={`flex flex-col items-center justify-center ${config.container}`}>
        {/* Animated bars loader */}
        <div className="flex space-x-1">
          <div className="w-1 h-8 bg-orange-500 animate-pulse" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1 h-6 bg-orange-400 animate-pulse" style={{ animationDelay: '100ms' }}></div>
          <div className="w-1 h-10 bg-orange-600 animate-pulse" style={{ animationDelay: '200ms' }}></div>
          <div className="w-1 h-4 bg-orange-300 animate-pulse" style={{ animationDelay: '300ms' }}></div>
          <div className="w-1 h-8 bg-orange-500 animate-pulse" style={{ animationDelay: '400ms' }}></div>
        </div>
        
        {message && (
          <p className="mt-4 text-gray-600 text-sm font-medium">
            {message}
          </p>
        )}
      </div>
    );
  }

  // Modern variant (default)
  return (
    <div className={`flex flex-col items-center justify-center ${config.container}`}>
      {/* Modern gradient spinner */}
      <div className="relative">
        {/* Outer ring */}
        <div className={`${config.spinner} border-4 border-gray-100 rounded-full`}></div>
        {/* Animated gradient ring */}
        <div className={`absolute inset-0 ${config.spinner} border-4 border-transparent border-t-orange-500 border-r-orange-400 rounded-full animate-spin`}></div>
        {/* Inner glow */}
        <div className={`absolute inset-2 bg-gradient-to-br from-orange-50 to-orange-100 rounded-full opacity-50`}></div>
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      {message && (
        <p className="mt-4 text-gray-600 text-sm font-medium">
          {message}
        </p>
      )}
      
      {/* Subtle animated dots */}
      <div className="flex space-x-1 mt-3">
        <div className="w-1 h-1 bg-orange-300 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
        <div className="w-1 h-1 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
        <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
      </div>
    </div>
  );
};

export default SimpleLoader;