import React, { useState } from 'react';
import { SpinnerFAIcon } from '../FontAwesome';

// Direct API calls without React Query for faster, more reliable updates
const DirectProductForm = ({ product, onSuccess, onError, onCancel }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || '',
    description: product?.description || '',
    price: product?.price || '',
    oldPrice: product?.oldPrice || '',
    stock: product?.stock || '',
    unit: product?.unit || 'dona',
    images: product?.images || [],
    badge: product?.badge || '',
    hasVariants: product?.hasVariants || false,
    variants: product?.variants || []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name.trim() || !formData.category) {
        throw new Error('Mahsulot nomi va kategoriya kiritilishi shart');
      }

      if (!formData.hasVariants && (!formData.price || !formData.stock)) {
        throw new Error('Narx va zaxira kiritilishi shart');
      }

      // Prepare product data
      const productData = {
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim(),
        unit: formData.unit,
        badge: formData.badge,
        hasVariants: formData.hasVariants,
        variants: formData.variants || [],
        status: 'active'
      };

      // Add price, stock, and images
      if (formData.hasVariants) {
        const firstVariantOption = formData.variants[0]?.options[0];
        productData.price = firstVariantOption?.price ? parseFloat(firstVariantOption.price) : 0;
        productData.oldPrice = firstVariantOption?.oldPrice ? parseFloat(firstVariantOption.oldPrice) : null;
        productData.stock = formData.variants.reduce((total, variant) => 
          total + variant.options.reduce((sum, option) => sum + (parseInt(option.stock) || 0), 0), 0
        );
        productData.image = firstVariantOption?.images?.[0] || '';
        productData.images = firstVariantOption?.images || [];
      } else {
        productData.price = parseFloat(formData.price);
        productData.oldPrice = formData.oldPrice ? parseFloat(formData.oldPrice) : null;
        productData.stock = parseInt(formData.stock);
        productData.image = formData.images[0] || '';
        productData.images = formData.images;
      }

      console.log('🔄 Sending product data:', productData);

      // Direct API call
      const url = product?._id 
        ? `http://localhost:5000/api/products/${product._id}`
        : 'http://localhost:5000/api/products';
      
      const method = product?._id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          // Ignore JSON parse error
        }
        
        const errorMessage = errorData.message || errorData.error || errorText || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Success:', result);

      // Call success callback
      if (onSuccess) {
        onSuccess(result, product?._id ? 'updated' : 'created');
      }

    } catch (err) {
      console.error('❌ Form submission error:', err);
      setError(err.message);
      
      if (onError) {
        onError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Product Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mahsulot nomi *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
          placeholder="Mahsulot nomini kiriting"
          required
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kategoriya *
        </label>
        <select
          value={formData.category}
          onChange={(e) => handleInputChange('category', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
          required
        >
          <option value="">Kategoriya tanlang</option>
          <option value="Xoz-Mag">Xoz-Mag</option>
          <option value="Yevro-Remont">Yevro-Remont</option>
          <option value="Elektrika">Elektrika</option>
          <option value="Dekorativ-mahsulotlar">Dekorativ-mahsulotlar</option>
          <option value="Santexnika">Santexnika</option>
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tavsif
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
          rows="3"
          placeholder="Mahsulot tavsifini kiriting"
        />
      </div>

      {/* Price and Stock (for non-variant products) */}
      {!formData.hasVariants && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Narx (so'm) *
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
              placeholder="0"
              min="0"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zaxira *
            </label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => handleInputChange('stock', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
              placeholder="0"
              min="0"
              required
            />
          </div>
        </div>
      )}

      {/* Old Price */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Eski narx (so'm)
        </label>
        <input
          type="number"
          value={formData.oldPrice}
          onChange={(e) => handleInputChange('oldPrice', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
          placeholder="0"
          min="0"
        />
      </div>

      {/* Unit */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          O'lchov birligi
        </label>
        <select
          value={formData.unit}
          onChange={(e) => handleInputChange('unit', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
        >
          <option value="dona">Dona</option>
          <option value="kg">Kilogramm</option>
          <option value="m">Metr</option>
          <option value="m2">Kvadrat metr</option>
          <option value="m3">Kub metr</option>
          <option value="litr">Litr</option>
          <option value="paket">Paket</option>
          <option value="rulon">Rulon</option>
        </select>
      </div>

      {/* Badge */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Badge
        </label>
        <select
          value={formData.badge}
          onChange={(e) => handleInputChange('badge', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
        >
          <option value="">Badge yo'q</option>
          <option value="Mashhur">Mashhur</option>
          <option value="Yangi">Yangi</option>
        </select>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Bekor qilish
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-primary-orange text-white rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          {isSubmitting && <SpinnerFAIcon className="animate-spin" />}
          <span>{isSubmitting ? 'Saqlanmoqda...' : (product?._id ? 'Yangilash' : 'Saqlash')}</span>
        </button>
      </div>
    </form>
  );
};

export default DirectProductForm;