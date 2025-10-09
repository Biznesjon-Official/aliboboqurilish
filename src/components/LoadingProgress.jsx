import React, { useState, useEffect } from 'react';

const LoadingProgress = ({ isVisible = true, onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      // When loading is complete, quickly finish to 100% and call onComplete
      setProgress(100);
      setTimeout(() => onComplete?.(), 200);
      return;
    }

    // Reset progress when loading starts
    setProgress(0);
    let currentProgress = 0;

    const interval = setInterval(() => {
      // Slower progress that doesn't reach 100% automatically
      currentProgress += Math.random() * 15 + 5; // 5-20% har safar (sekinroq)

      // Cap at 90% to wait for actual data loading
      const maxProgress = 90;
      if (currentProgress > maxProgress) {
        currentProgress = maxProgress;
        clearInterval(interval);
      }

      setProgress(Math.min(currentProgress, maxProgress));
    }, 150); // 150ms interval (sekinroq)

    return () => clearInterval(interval);
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Logo */}
        <div className="mb-8">
          <img
            src="/alibobo-logo.png"
            alt="Alibobo"
            className="h-32 w-64 mx-auto object-contain"
            style={{ aspectRatio: '144/56' }}
            onError={(e) => {
              // Fallback if logo doesn't load
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'block';
            }}
          />
          <div className="text-4xl font-bold text-orange-500" style={{ display: 'none' }}>
            ALI 3030
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Percentage */}
        <p className="text-gray-400 text-sm mt-2">
          {Math.round(progress)}%
        </p>

        {/* Animated dots */}
        <div className="flex justify-center mt-4 space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingProgress;
