import React, { useState, useRef, useEffect, useCallback } from 'react';

// Validate and process base64 images
const processImageSrc = (baseSrc, fallbackSrc) => {
  if (!baseSrc) return fallbackSrc || null;

  // Handle base64 images - SKIP LARGE BASE64 FOR PERFORMANCE
  if (baseSrc.startsWith('data:')) {
    // Check if base64 data is complete
    if (baseSrc.length < 50) {
      if (process.env.REACT_APP_DEBUG_MODE === 'true') {
        console.warn('[OptimizedImage] Base64 image data is too short, likely incomplete:', baseSrc.substring(0, 50) + '...');
      }
      return fallbackSrc;
    }

    // PERFORMANCE: Skip very large base64 images (>100KB estimated)
    if (baseSrc.length > 150000) {
      if (process.env.REACT_APP_DEBUG_MODE === 'true') {
        console.warn('[OptimizedImage] Base64 image too large for performance, using fallback:', Math.round(baseSrc.length / 1024) + 'KB');
      }
      return fallbackSrc;
    }

    // Validate base64 format (relaxed: allow svg+xml and extra parameters)
    const looksLikeImageBase64 = baseSrc.startsWith('data:image/') && baseSrc.includes(';base64,');
    if (!looksLikeImageBase64) {
      if (process.env.REACT_APP_DEBUG_MODE === 'true') {
        console.warn('[OptimizedImage] Invalid base64 image format:', baseSrc.substring(0, 50) + '...');
      }
      return fallbackSrc;
    }

    return baseSrc;
  }

  // PERFORMANCE: Block external domains that might be slow
  const blockedDomains = ['uzum.uz', 'ozon.ru', 'wildberries.ru', 'aliexpress.com'];
  if (baseSrc.startsWith('http') && blockedDomains.some(domain => baseSrc.includes(domain))) {
    if (process.env.REACT_APP_DEBUG_MODE === 'true') {
      console.warn('[OptimizedImage] Blocked external domain for performance:', baseSrc);
    }
    return fallbackSrc;
  }

  // Normalize any uploads path from absolute URLs or backslashes
  const normalizeUploadsPath = (p) => {
    if (!p || typeof p !== 'string') return p;
    // Replace Windows backslashes with forward slashes
    let s = p.replace(/\\/g, '/');
    // If string contains 'uploads/', extract from that point
    const idx = s.indexOf('/uploads/') >= 0 ? s.indexOf('/uploads/') : s.indexOf('uploads/');
    if (idx >= 0) {
      s = s.substring(idx);
      if (!s.startsWith('/')) s = '/' + s;
    }
    return s;
  };

  const normalized = normalizeUploadsPath(baseSrc);

  // Handle file paths - convert to full backend base URL with size optimization
  if (normalized && normalized.startsWith('/uploads/')) {
    // Auto-detect and use appropriate image size based on context
    let optimizedPath = normalized;

    // If it's a product image, try to use medium size for better performance
    if (normalized.includes('/uploads/products/') && !normalized.includes('/original/') &&
      !normalized.includes('/medium/') && !normalized.includes('/large/') &&
      !normalized.includes('/thumbnail/')) {

      // Extract filename from path like /uploads/products/converted-xxx.jpg
      const filename = normalized.split('/').pop();

      // Try medium size first (best balance of quality and performance)
      optimizedPath = `/uploads/products/medium/${filename}`;

      if (process.env.REACT_APP_DEBUG_MODE === 'true') {
        console.log(`[OptimizedImage] Auto-optimized path: ${normalized} -> ${optimizedPath}`);
      }
    }

    // Production: Use relative URLs (nginx handles routing)
    // Development: Use full localhost URL
    if (process.env.NODE_ENV === 'production') {
      if (process.env.REACT_APP_DEBUG_MODE === 'true') {
        console.log(`[OptimizedImage] Production URL: ${optimizedPath}`);
      }
      return optimizedPath; // Return relative URL like /uploads/products/medium/...
    } else {
      const fullUrl = `http://localhost:5000${optimizedPath}`;
      if (process.env.REACT_APP_DEBUG_MODE === 'true') {
        console.log(`[OptimizedImage] Development URL: ${fullUrl}`);
      }
      return fullUrl;
    }
  }

  // Handle regular URLs
  return normalized;
};

// Optimized image component with lazy loading, error handling, and performance features
const OptimizedImage = ({
  src,
  alt,
  className = '',
  width,
  height,
  sizes,
  priority = false,
  loading = 'lazy',
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  fallbackSrc = null,
  aspectRatio,
  objectFit = 'cover',
  quality = 80,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(() => processImageSrc(src, fallbackSrc) || fallbackSrc);
  const [isInView, setIsInView] = useState(priority || loading === 'eager');
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const observerRef = useRef(null);
  const triedFallbackRef = useRef(false);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '200px', // Increased from 100px to 200px for even earlier loading
        threshold: 0.01 // Reduced from 0.05 to 0.01 for ultra-fast triggering
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
      observerRef.current = observer;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [priority, isInView]);

  // Load image when in view or when src changes
  useEffect(() => {
    if (!isInView) return;
    triedFallbackRef.current = false;
    const processedSrc = processImageSrc(src, fallbackSrc) || fallbackSrc;

    // Skip loading if no valid source
    if (!processedSrc) {
      setHasError(true);
      return;
    }

    setCurrentSrc(processedSrc);
    setIsLoaded(false);
    setHasError(false);

    // Add timeout for slow loading images
    const img = new Image();
    const timeoutId = setTimeout(() => {
      if (process.env.REACT_APP_DEBUG_MODE === 'true') {
        console.warn('[OptimizedImage] Image loading timeout:', processedSrc);
      }
      setHasError(true);
    }, 10000); // 10 second timeout

    img.onload = () => {
      clearTimeout(timeoutId);
      setIsLoaded(true);
    };
    img.onerror = () => {
      clearTimeout(timeoutId);
      setHasError(true);
    };
    img.src = processedSrc;

    return () => clearTimeout(timeoutId);
  }, [isInView, src, fallbackSrc]);

  // Handle image load
  const handleLoad = useCallback((e) => {
    // Development-specific success logging (only if debug enabled)
    if (process.env.REACT_APP_DEBUG_MODE === 'true' && src && src.startsWith('/uploads/')) {
      console.log(`[OptimizedImage] Successfully loaded image: ${src}`);
    }

    setIsLoaded(true);
    if (onLoad) onLoad(e);
  }, [onLoad, src]);

  // Handle image error with smart fallback
  const handleError = useCallback((e) => {
    // Development-specific error logging (only if debug enabled)
    if (process.env.REACT_APP_DEBUG_MODE === 'true') {
      console.warn(`[OptimizedImage] Failed to load image: ${src}`);
      console.warn(`[OptimizedImage] Error details:`, {
        originalSrc: src,
        resolvedSrc: currentSrc,
        fallbackSrc: fallbackSrc,
        error: e.type,
        target: e.target?.src,
        isBase64: src?.startsWith('data:'),
        isIncompleteBase64: src?.startsWith('data:') && src.length < 100
      });

      // Special handling for base64 images
      if (src && src.startsWith('data:')) {
        if (src.length < 100) {
          console.warn('[OptimizedImage] Base64 image data appears to be incomplete or truncated');
        } else {
          console.warn('[OptimizedImage] Base64 image failed to load - data may be corrupted');
        }
      }
    }

    // Smart fallback for product images: medium -> original -> fallback
    if (currentSrc && currentSrc.includes('/uploads/products/') && !triedFallbackRef.current) {
      triedFallbackRef.current = true;
      setHasError(false);
      setIsLoaded(false);

      // If we tried medium and it failed, try original
      if (currentSrc.includes('/medium/')) {
        const originalPath = currentSrc.replace('/medium/', '/original/');
        if (process.env.REACT_APP_DEBUG_MODE === 'true') {
          console.log(`[OptimizedImage] Fallback: medium failed, trying original: ${originalPath}`);
        }
        setCurrentSrc(originalPath);
        return;
      }

      // If original also failed, try the raw path (without size folder)
      if (currentSrc.includes('/original/')) {
        const filename = currentSrc.split('/').pop();
        const rawPath = `/uploads/products/${filename}`;
        if (process.env.REACT_APP_DEBUG_MODE === 'true') {
          console.log(`[OptimizedImage] Fallback: original failed, trying raw path: ${rawPath}`);
        }
        setCurrentSrc(rawPath);
        return;
      }

      // Final fallback
      if (fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        return;
      }
    }

    // Try regular fallback once if not already
    if (currentSrc !== fallbackSrc && fallbackSrc && !triedFallbackRef.current) {
      triedFallbackRef.current = true;
      setHasError(false);
      setIsLoaded(false);
      setCurrentSrc(fallbackSrc);
      return;
    }

    setHasError(true);
    if (onError) onError(e);
  }, [onError, fallbackSrc, src, currentSrc]);

  // Generate WebP URLs for better compression
  const generateWebPUrl = useCallback((baseSrc) => {
    if (!baseSrc || baseSrc.startsWith('data:')) return baseSrc;

    // Check if browser supports WebP
    const supportsWebP = (() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    })();

    if (!supportsWebP) return baseSrc;

    // Convert to WebP if it's a regular image URL
    if (baseSrc.includes('/uploads/') && !baseSrc.includes('.webp')) {
      // Add WebP conversion parameter (if your backend supports it)
      return baseSrc.includes('?') ? `${baseSrc}&format=webp` : `${baseSrc}?format=webp`;
    }

    return baseSrc;
  }, []);

  // Generate srcSet for responsive images with WebP support
  const generateSrcSet = useCallback((baseSrc) => {
    if (!baseSrc || baseSrc.startsWith('data:')) return undefined;

    const breakpoints = [320, 480, 640, 768, 1024, 1280, 1536];
    const webpSrc = generateWebPUrl(baseSrc);

    return breakpoints
      .map(bp => {
        const url = webpSrc.includes('?')
          ? `${webpSrc}&w=${bp}&q=${quality}`
          : `${webpSrc}?w=${bp}&q=${quality}`;
        return `${url} ${bp}w`;
      })
      .join(', ');
  }, [quality, generateWebPUrl]);

  // Create blur placeholder
  const createBlurPlaceholder = useCallback(() => {
    if (blurDataURL) return blurDataURL;

    // Generate a simple blur placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');

    // Create a simple gradient placeholder
    const gradient = ctx.createLinearGradient(0, 0, 40, 40);
    gradient.addColorStop(0, '#f3f4f6');
    gradient.addColorStop(1, '#e5e7eb');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 40, 40);

    return canvas.toDataURL();
  }, [blurDataURL]);

  // Container styles
  const containerStyles = {
    position: 'relative',
    overflow: 'hidden',
    ...(aspectRatio && {
      aspectRatio: aspectRatio,
      width: '100%'
    }),
    ...(width && height && {
      width: width,
      height: height
    })
  };

  // Remove unused imageStyles variable

  // Placeholder styles
  const placeholderStyles = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isLoaded ? 0 : 1,
    transition: 'opacity 0.3s ease-in-out'
  };

  // Disable WebP and srcSet for production - use original URLs
  const finalSrc = currentSrc || fallbackSrc;
  const finalSrcSet = undefined;

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={containerStyles}
      {...props}
    >
      {/* Blur placeholder */}
      {placeholder === 'blur' && !isLoaded && (
        <div style={placeholderStyles}>
          <img
            src={createBlurPlaceholder()}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'blur(10px)',
              transform: 'scale(1.1)' // Prevent blur edges
            }}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Loading skeleton */}
      {placeholder === 'skeleton' && !isLoaded && (
        <div style={placeholderStyles}>
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

      <img
        ref={imgRef}
        src={finalSrc}
        srcSet={finalSrcSet}
        alt={alt}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        width={width}
        height={height}
        sizes={sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
        onLoad={handleLoad}
        onError={handleError}
        loading={loading === 'eager' ? 'eager' : priority ? 'eager' : loading}
        decoding={priority ? 'sync' : 'async'}
        fetchpriority={priority ? 'high' : 'auto'}
        style={{
          // Ensure image does not get stretched
          width: '100%',
          height: '100%',
          objectFit: objectFit,
          objectPosition: 'center',
          backgroundColor: hasError ? '#f3f4f6' : 'transparent',
          ...(blurDataURL && !isLoaded && !hasError ? {
            backgroundImage: `url(${blurDataURL})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : {})
        }}
      />

      {/* Error state */}
      {hasError && (
        <div style={placeholderStyles}>
          <div className="text-center text-gray-500">
            <svg
              className="w-8 h-8 mx-auto mb-2"
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
            <span className="text-xs">Image not available</span>
          </div>
        </div>
      )}

      {/* Loading indicator for priority images */}
      {priority && !isLoaded && !hasError && (
        <div style={placeholderStyles}>
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent"></div>
        </div>
      )}
    </div>
  );
};

// Higher-order component for image optimization
export const withImageOptimization = (WrappedComponent) => {
  return React.forwardRef((props, ref) => {
    const optimizedProps = {
      ...props,
      loading: props.loading || 'lazy',
      decoding: props.decoding || 'async',
    };

    return <WrappedComponent ref={ref} {...optimizedProps} />;
  });
};

// Hook for image preloading
export const useImagePreloader = () => {
  const preloadedImages = useRef(new Set());

  const preloadImage = useCallback((src) => {
    if (preloadedImages.current.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        preloadedImages.current.add(src);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const preloadImages = useCallback((srcArray) => {
    return Promise.allSettled(srcArray.map(preloadImage));
  }, [preloadImage]);

  const isPreloaded = useCallback((src) => {
    return preloadedImages.current.has(src);
  }, []);

  return { preloadImage, preloadImages, isPreloaded };
};

// Image gallery component with optimized loading
export const OptimizedImageGallery = ({
  images,
  currentIndex = 0,
  onIndexChange,
  className = '',
  thumbnailSize = 60,
  showThumbnails = true
}) => {
  const { preloadImage } = useImagePreloader();
  const [loadedImages, setLoadedImages] = useState(new Set([currentIndex]));

  // Preload adjacent images
  useEffect(() => {
    const preloadAdjacent = async () => {
      const toPreload = [];

      // Preload previous and next images
      if (currentIndex > 0) toPreload.push(images[currentIndex - 1]);
      if (currentIndex < images.length - 1) toPreload.push(images[currentIndex + 1]);

      // Preload current image if not loaded
      if (!loadedImages.has(currentIndex)) {
        toPreload.push(images[currentIndex]);
      }

      for (const img of toPreload) {
        try {
          await preloadImage(img);
          setLoadedImages(prev => new Set([...prev, images.indexOf(img)]));
        } catch (error) {
          console.warn('Failed to preload image:', img);
        }
      }
    };

    preloadAdjacent();
  }, [currentIndex, images, preloadImage, loadedImages]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main image */}
      <OptimizedImage
        src={images[currentIndex]}
        alt={`Image ${currentIndex + 1}`}
        className="w-full aspect-square"
        priority={true}
        placeholder="blur"
        objectFit="contain"
      />

      {/* Thumbnails */}
      {showThumbnails && images.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => onIndexChange?.(index)}
              className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${index === currentIndex
                  ? 'border-orange-500 ring-2 ring-orange-200'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
              style={{ width: thumbnailSize, height: thumbnailSize }}
            >
              <OptimizedImage
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full"
                priority={Math.abs(index - currentIndex) <= 1}
                placeholder="skeleton"
                objectFit="cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;