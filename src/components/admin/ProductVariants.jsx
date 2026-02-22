import React, { useState } from 'react';

const ProductVariants = ({ variants = [], onVariantsChange }) => {
  const [localVariants, setLocalVariants] = useState(variants);

  // Add new variant type (e.g., "Rang", "Xotira")
  const addVariantType = () => {
    const newVariant = {
      name: '',
      options: []
    };
    const updated = [...localVariants, newVariant];
    setLocalVariants(updated);
    onVariantsChange(updated);
  };

  // Remove variant type
  const removeVariantType = (variantIndex) => {
    const updated = localVariants.filter((_, index) => index !== variantIndex);
    setLocalVariants(updated);
    onVariantsChange(updated);
  };

  // Update variant name
  const updateVariantName = (variantIndex, name) => {
    const updated = localVariants.map((variant, index) => 
      index === variantIndex ? { ...variant, name } : variant
    );
    setLocalVariants(updated);
    onVariantsChange(updated);
  };

  // Add option to variant
  const addVariantOption = (variantIndex) => {
    const newOption = {
      value: '',
      price: 0,
      stock: 0,
      image: '',
      sku: ''
    };
    const updated = localVariants.map((variant, index) => 
      index === variantIndex 
        ? { ...variant, options: [...variant.options, newOption] }
        : variant
    );
    setLocalVariants(updated);
    onVariantsChange(updated);
  };

  // Remove option from variant
  const removeVariantOption = (variantIndex, optionIndex) => {
    const updated = localVariants.map((variant, index) => 
      index === variantIndex 
        ? { ...variant, options: variant.options.filter((_, oIndex) => oIndex !== optionIndex) }
        : variant
    );
    setLocalVariants(updated);
    onVariantsChange(updated);
  };

  // Update option
  const updateVariantOption = (variantIndex, optionIndex, field, value) => {
    const updated = localVariants.map((variant, vIndex) => 
      vIndex === variantIndex 
        ? {
            ...variant,
            options: variant.options.map((option, oIndex) => 
              oIndex === optionIndex 
                ? { ...option, [field]: value }
                : option
            )
          }
        : variant
    );
    setLocalVariants(updated);
    onVariantsChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Mahsulot Variantlari</h3>
        <button
          type="button"
          onClick={addVariantType}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Variant Qo'shish
        </button>
      </div>

      {localVariants.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Variant mavjud emas</h3>
          <p className="mt-1 text-sm text-gray-500">
            Mahsulot uchun rang, o'lcham yoki boshqa variantlar qo'shing
          </p>
        </div>
      )}

      {localVariants.map((variant, variantIndex) => (
        <div key={variantIndex} className="border border-gray-200 rounded-lg p-4 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 mr-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Variant Nomi (masalan: Rang, Xotira, O'lcham)
              </label>
              <input
                type="text"
                value={variant.name}
                onChange={(e) => updateVariantName(variantIndex, e.target.value)}
                placeholder="Variant nomini kiriting"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={() => removeVariantType(variantIndex)}
              className="text-red-600 hover:text-red-800 p-2"
              title="Variantni o'chirish"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Variant Qiymatlari</h4>
              <button
                type="button"
                onClick={() => addVariantOption(variantIndex)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                + Qiymat Qo'shish
              </button>
            </div>

            {variant.options.map((option, optionIndex) => (
              <div key={optionIndex} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 bg-gray-50 rounded-md">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Qiymat</label>
                  <input
                    type="text"
                    value={option.value}
                    onChange={(e) => updateVariantOption(variantIndex, optionIndex, 'value', e.target.value)}
                    placeholder="Qora, 128GB, L..."
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Narx (so'm)</label>
                  <input
                    type="number"
                    value={option.price}
                    onChange={(e) => updateVariantOption(variantIndex, optionIndex, 'price', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    inputMode="numeric"
                    autoComplete="off"
                    onWheel={(e) => e.currentTarget.blur()}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                      if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Zaxira</label>
                  <input
                    type="number"
                    value={option.stock}
                    onChange={(e) => updateVariantOption(variantIndex, optionIndex, 'stock', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    inputMode="numeric"
                    autoComplete="off"
                    onWheel={(e) => e.currentTarget.blur()}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                      if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rasm URL</label>
                  <input
                    type="text"
                    value={option.image}
                    onChange={(e) => updateVariantOption(variantIndex, optionIndex, 'image', e.target.value)}
                    placeholder="https://..."
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeVariantOption(variantIndex, optionIndex)}
                    className="w-full px-2 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50"
                  >
                    O'chirish
                  </button>
                </div>
              </div>
            ))}

            {variant.options.length === 0 && (
              <div className="text-center py-4 text-sm text-gray-500 bg-gray-50 rounded-md border-2 border-dashed border-gray-300">
                Bu variant uchun qiymatlar qo'shing
              </div>
            )}
          </div>
        </div>
      ))}

      {localVariants.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-blue-800">Variant Tizimi Haqida</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Har bir variant turi uchun nom kiriting (Rang, Xotira, O'lcham)</li>
                  <li>Har bir qiymat uchun to'liq narx belgilang (qo'shimcha emas)</li>
                  <li>Har bir variant uchun alohida zaxira miqdorini belgilang</li>
                  <li>Variant uchun maxsus rasm URL qo'shing (6ta rasmdan birini tanlang)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductVariants;

