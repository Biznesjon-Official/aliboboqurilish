import React from 'react';

const ProductVariantSelector = ({ product, onVariantChange, selectedVariants = {} }) => {
  // Compute outcome for a given selection
  const computeOutcome = (selection) => {
    let finalPrice = product.price;
    let minStock = (typeof product.stock === 'number' ? product.stock : (typeof product.quantity === 'number' ? product.quantity : 0));
    let variantImage = product.image;
    let variantImages = product.images || (product.image ? [product.image] : []);
    let variantOldPrice = (typeof product.oldPrice === 'number' ? product.oldPrice : null);

    if (Array.isArray(product.variants) && product.variants.length > 0) {
      product.variants.forEach(variant => {
        const selectedOption = selection[variant.name];
        if (selectedOption) {
          const option = (variant.options || []).find(opt => opt.value === selectedOption);
          if (option) {
            if (option.price && option.price > 0) finalPrice = option.price;
            if (typeof option.oldPrice === 'number') variantOldPrice = option.oldPrice;
            if (typeof option.stock === 'number') {
              minStock = Math.min(minStock, option.stock);
            }
            if (Array.isArray(option.images) && option.images.length > 0) {
              variantImages = option.images;
              variantImage = option.images[0];
            } else if (option.image) {
              variantImages = [option.image];
              variantImage = option.image;
            }
          }
        }
      });
    }

    return { price: finalPrice, oldPrice: variantOldPrice, stock: minStock, image: variantImage, images: variantImages };
  };

  const handleVariantSelect = (variantName, optionValue) => {
    const updated = { ...selectedVariants, [variantName]: optionValue };
    if (onVariantChange) {
      const outcome = computeOutcome(updated);
      onVariantChange({ selectedVariants: updated, ...outcome });
    }
  };

  if (!product.hasVariants || !product.variants || product.variants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {product.variants.map((variant, variantIndex) => (
        <div key={variantIndex} className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-800">{variant.name}</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {(variant.options || []).map((option, optionIndex) => {
              const isSelected = selectedVariants[variant.name] === option.value;
              const isOutOfStock = option.stock === 0;
              return (
                <button
                  key={optionIndex}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => handleVariantSelect(variant.name, option.value)}
                  className={`
                    relative px-3 py-2 text-sm font-medium rounded-lg border transition-colors
                    ${isSelected
                      ? 'bg-primary-orange text-white border-primary-orange'
                      : isOutOfStock
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50 hover:border-primary-orange'}
                  `}
                >
                  <span>{option.value}</span>
                  {isOutOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-red-400 transform rotate-12"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductVariantSelector;