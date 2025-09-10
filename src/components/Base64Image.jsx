import React, { useState, useCallback, useMemo } from 'react';

/**
 * Specialized component for displaying base64 images with performance optimizations
 * and error handling specifically designed for base64 data
 */
const Base64Image = ({ 
  src, 
  alt, 
  className = '', 
  fallbackSrc = '/assets/default-product.svg',
  onLoad,
  onError,
  style = {},
  ...props 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Memoize base64 validation to avoid re-computation
  const imageValidation = useMemo(() => {
    if (!src) {
      return { isValid: false, reason: 'No source provided', isBase64: false };
    }
    
    // If not base64, treat as valid URL/path and render directly
    if (!src.startsWith('data:image/')) {
      return { isValid: true, reason: null, isBase64: false };
    }
    
    // Base64-specific validations
    if (src.length < 100) {
      return { isValid: false, reason: 'Base64 data too short', isBase64: true };
    }
    
    const base64Pattern = /^data:image\/(jpeg|jpg|png|gif|webp|bmp);base64,([A-Za-z0-9+/=]+)$/;
    if (!base64Pattern.test(src)) {
      return { isValid: false, reason: 'Invalid base64 format', isBase64: true };
    }
    
    return { isValid: true, reason: null, isBase64: true };
  }, [src]);
  
  const handleLoad = useCallback((e) => {
    setLoading(false);
    setError(false);
    
    if (process.env.REACT_APP_DEBUG_MODE === 'true') {
      console.log('[Base64Image] Successfully loaded base64 image');
    }
    
    if (onLoad) onLoad(e);
  }, [onLoad]);
  
  const handleError = useCallback((e) => {
    setLoading(false);
    setError(true);
    
    if (process.env.REACT_APP_DEBUG_MODE === 'true') {
      console.warn('[Base64Image] Failed to load base64 image:', {
        srcLength: src?.length,
        validation: imageValidation,
        error: e.type
      });
    }
    
    if (onError) onError(e);
  }, [onError, src, imageValidation]);
  
  // Show nothing if no source provided
  if (!src) {
    return null;
  }
  
  // Show fallback only for invalid base64 cases
  if (imageValidation.isBase64 && !imageValidation.isValid && imageValidation.reason !== 'No source provided') {
    if (process.env.REACT_APP_DEBUG_MODE === 'true') {
      console.warn('[Base64Image] Invalid base64 image:', imageValidation.reason);
    }
    
    return (
      <div className={`base64-image-error ${className}`} style={style} {...props}>
        <img
          src={fallbackSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }
  
  return (
    <div className={`base64-image-container ${className}`} style={{ position: 'relative', ...style }} {...props}>
      {/* Loading skeleton */}
      {loading && (
        <div 
          className="base64-image-skeleton"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1
          }}
        >
          <div className="animate-pulse bg-gray-200 w-full h-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-gray-400" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div 
          className="base64-image-error"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#f9fafb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            zIndex: 1
          }}
        >
          <svg 
            className="w-8 h-8 text-gray-400 mb-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <span className="text-xs text-gray-500">Image Error</span>
        </div>
      )}
      
      {/* Main base64 image */}
      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'contain',
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out'
        }}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
};

/**
 * Hook for managing base64 image state and validation
 */
export const useBase64Image = (src) => {
  const [state, setState] = useState({
    loading: true,
    error: false,
    valid: false
  });
  
  const validation = useMemo(() => {
    if (!src || !src.startsWith('data:image/')) {
      return { isValid: false, reason: 'Invalid format' };
    }
    
    if (src.length < 100) {
      return { isValid: false, reason: 'Data too short' };
    }
    
    const base64Pattern = /^data:image\/(jpeg|jpg|png|gif|webp|bmp);base64,([A-Za-z0-9+/=]+)$/;
    if (!base64Pattern.test(src)) {
      return { isValid: false, reason: 'Invalid base64 pattern' };
    }
    
    return { isValid: true, reason: null };
  }, [src]);
  
  const handleLoad = useCallback(() => {
    setState({ loading: false, error: false, valid: true });
  }, []);
  
  const handleError = useCallback(() => {
    setState({ loading: false, error: true, valid: false });
  }, []);
  
  return {
    ...state,
    validation,
    handlers: { onLoad: handleLoad, onError: handleError }
  };
};

/**
 * Utility function to validate base64 image data
 */
export const validateBase64Image = (src) => {
  if (!src || typeof src !== 'string') {
    return { isValid: false, reason: 'Invalid input' };
  }
  
  if (!src.startsWith('data:image/')) {
    return { isValid: false, reason: 'Not a base64 image' };
  }
  
  if (src.length < 100) {
    return { isValid: false, reason: 'Data too short' };
  }
  
  const base64Pattern = /^data:image\/(jpeg|jpg|png|gif|webp|bmp);base64,([A-Za-z0-9+/=]+)$/;
  if (!base64Pattern.test(src)) {
    return { isValid: false, reason: 'Invalid base64 format' };
  }
  
  return { isValid: true, reason: null };
};

/**
 * Utility function to get base64 image info
 */
export const getBase64ImageInfo = (src) => {
  const validation = validateBase64Image(src);
  
  if (!validation.isValid) {
    return { ...validation, size: 0, type: null };
  }
  
  const matches = src.match(/^data:image\/([^;]+);base64,(.+)$/);
  if (!matches) {
    return { isValid: false, reason: 'Parse error', size: 0, type: null };
  }
  
  const [, type, data] = matches;
  const size = Math.round((data.length * 3) / 4); // Approximate size in bytes
  
  return {
    isValid: true,
    reason: null,
    type,
    size,
    sizeKB: Math.round(size / 1024),
    dataLength: data.length
  };
};

export default Base64Image;