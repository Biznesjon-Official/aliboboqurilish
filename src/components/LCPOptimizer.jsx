import React, { useEffect } from 'react';

// LCP Optimizer component to preload critical resources
const LCPOptimizer = () => {
  useEffect(() => {
    // Preload critical images that are likely to be LCP elements
    const criticalImages = [
      '/alibobo.png',
      '/logo.png', 
      '/assets/default-product.svg'
    ];

    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      link.fetchPriority = 'high';
      document.head.appendChild(link);
    });

    // Preload critical API endpoints
    const API_BASE = process.env.REACT_APP_API_BASE || 
      (process.env.NODE_ENV === 'production' ? 'https://aliboboqurilish.uz/api' : 'http://localhost:5000/api');
    
    const criticalEndpoints = [
      `${API_BASE}/products/fast?limit=8&page=1`,
      `${API_BASE}/craftsmen?limit=8&status=active`
    ];

    // Prefetch critical API data
    criticalEndpoints.forEach(url => {
      fetch(url, { 
        method: 'GET',
        priority: 'high',
        cache: 'force-cache'
      }).catch(() => {
        // Silently handle errors for prefetch
      });
    });

    // Note: custom font preload removed to avoid 404 if the file doesn't exist

  }, []);

  return null; // This component doesn't render anything
};

export default LCPOptimizer;
