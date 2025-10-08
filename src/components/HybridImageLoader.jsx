import React, { useState, useEffect } from 'react';

const HybridImageLoader = ({ product }) => {
  const [imageSource, setImageSource] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      // 1. Avval thumbnail base64 ni ko'rsat (tez)
      if (product.thumbnailBase64) {
        setImageSource(product.thumbnailBase64);
        setIsLoading(false);
      }

      // 2. Keyin to'liq rasm URL ni yuk (sifatli)
      if (product.imageUrl) {
        const img = new Image();
        img.onload = () => {
          setImageSource(product.imageUrl);
        };
        img.onerror = () => {
          // Agar URL ishlamasa, base64 da qol
          if (!product.thumbnailBase64 && product.fullBase64) {
            setImageSource(product.fullBase64);
          }
        };
        img.src = product.imageUrl;
      }
    };

    loadImage();
  }, [product]);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      
      <img
        src={imageSource || '/assets/default-product.svg'}
        alt={product.name}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
};

export default HybridImageLoader;