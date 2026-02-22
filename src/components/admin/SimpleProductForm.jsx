import React from 'react';
import ImageUploader from './ImageUploader';

const SimpleProductForm = ({
  price,
  oldPrice,
  stock,
  images,
  onPriceChange,
  onOldPriceChange,
  onStockChange,
  onImagesChange
}) => {
  return (
    <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Mahsulot ma'lumotlari</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Price */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Narx (so'm) *
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            placeholder="0"
            min="0"
            step="0.01"
            inputMode="decimal"
            autoComplete="off"
            onWheel={(e) => e.currentTarget.blur()}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
              if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
            }}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent ${
              !price ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            required
          />
          {!price && (
            <p className="text-xs text-red-600">Narx kiritilishi shart</p>
          )}
        </div>

        {/* Old Price */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Eski narx (so'm)
          </label>
          <input
            type="number"
            value={oldPrice}
            onChange={(e) => onOldPriceChange(e.target.value)}
            placeholder="0"
            min="0"
            step="0.01"
            inputMode="decimal"
            autoComplete="off"
            onWheel={(e) => e.currentTarget.blur()}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
              if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
          />
        </div>

        {/* Stock */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Zaxira *
          </label>
          <input
            type="number"
            value={stock}
            onChange={(e) => onStockChange(e.target.value)}
            placeholder="0"
            min="0"
            inputMode="numeric"
            autoComplete="off"
            onWheel={(e) => e.currentTarget.blur()}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
              if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
            }}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent ${
              stock === '' || stock === undefined ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            required
          />
          {(stock === '' || stock === undefined) && (
            <p className="text-xs text-red-600">Zaxira kiritilishi shart</p>
          )}
        </div>
      </div>

      {/* Images */}
      <div className="mt-4">
        <ImageUploader
          images={images}
          onImagesChange={onImagesChange}
          maxImages={999}
          title="Mahsulot rasmlari"
        />
      </div>
    </div>
  );
};

export default SimpleProductForm;

