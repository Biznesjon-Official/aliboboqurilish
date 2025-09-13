import React, { useState, useEffect } from 'react';

const AdaptiveLogo = ({ 
  className = "", 
  onClick, 
  onTouchStart, 
  title,
  style,
  size = "large" // "large", "medium", "small"
}) => {
  const [isDarkBackground, setIsDarkBackground] = useState(true);

  // Size configurations
  const sizeConfig = {
    large: {
      logoSize: "w-12 h-12",
      textSize: "h-14 w-36"
    },
    medium: {
      logoSize: "w-10 h-10", 
      textSize: "h-12 w-32"
    },
    small: {
      logoSize: "w-8 h-8",
      textSize: "h-8 w-24"
    }
  };

  const currentSize = sizeConfig[size] || sizeConfig.large;

  // Detect background color
  useEffect(() => {
    const detectBackgroundColor = () => {
      try {
        // Get the parent element's background color
        const element = document.querySelector('.bg-primary-dark') || 
                       document.querySelector('header') || 
                       document.body;
        
        const computedStyle = window.getComputedStyle(element);
        const backgroundColor = computedStyle.backgroundColor;
        
        // Parse RGB values
        const rgbMatch = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
          const [, r, g, b] = rgbMatch.map(Number);
          // Calculate luminance using standard formula
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          setIsDarkBackground(luminance < 0.5);
        } else {
          // Default to dark background if can't detect
          setIsDarkBackground(true);
        }
      } catch (error) {
        console.warn('Could not detect background color:', error);
        setIsDarkBackground(true);
      }
    };

    // Initial detection
    detectBackgroundColor();

    // Re-detect on theme changes or window resize
    const observer = new MutationObserver(detectBackgroundColor);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'style'],
      subtree: true
    });

    window.addEventListener('resize', detectBackgroundColor);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', detectBackgroundColor);
    };
  }, []);

  // Choose logo based on background
  const logoSrc = isDarkBackground ? '/logo.png' : '/white-mode-logo.png';
  const textLogoSrc = isDarkBackground ? '/alibobo.png' : '/alibobo-white.png';

  return (
    <div
      className={`flex items-center space-x-3 cursor-pointer select-none ${className}`}
      onClick={onClick}
      onTouchStart={onTouchStart}
      title={title}
      style={{ userSelect: 'none', ...style }}
    >
      {/* Main Logo */}
      <img
        src={logoSrc}
        alt="Alibobo Logo"
        loading="eager"
        decoding="async"
        fetchpriority="high"
        className={`${currentSize.logoSize} object-cover rounded-lg transition-all duration-300`}
        onError={(e) => {
          // Fallback to default logo if adaptive logo fails
          e.target.src = '/logo.png';
        }}
      />
      
      {/* Text Logo */}
      <img
        src={textLogoSrc}
        alt="Alibobo"
        loading="eager"
        decoding="async"
        fetchpriority="high"
        className={`${currentSize.textSize} object-cover transition-all duration-300`}
        onError={(e) => {
          // Fallback to default text logo if adaptive logo fails
          e.target.src = '/alibobo.png';
        }}
      />
    </div>
  );
};

export default AdaptiveLogo;