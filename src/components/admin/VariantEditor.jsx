import React, { useState } from 'react';
import ImageUploader from './ImageUploader';
import { TrashFAIcon, ChevronUpFAIcon, ChevronDownFAIcon, ChevronRightFAIcon, TimesFAIcon, PlusFAIcon, InfoCircleFAIcon } from '../FontAwesome';

const VariantEditor = ({ 
  variant, 
  onUpdate, 
  onDelete, 
  variantIndex,
  isExpanded = false,
  onToggleExpand
}) => {
  const [localVariant, setLocalVariant] = useState(variant || {
    name: '',
    options: []
  });
  const [errors, setErrors] = useState({});

  // Validate variant
  const validateVariant = (variantToValidate) => {
    const newErrors = {};
    
    if (!variantToValidate.name.trim()) {
      newErrors.name = 'Variant nomi kiritilishi shart';
    }
    
    variantToValidate.options.forEach((option, index) => {
      const optionErrors = {};
      
      if (!option.value.trim()) {
        optionErrors.value = 'Variant qiymati kiritilishi shart';
      }
      
      if (!option.price || parseFloat(option.price) <= 0) {
        optionErrors.price = 'Narx 0 dan katta bo\'lishi kerak';
      }
      
      if (!option.stock || parseInt(option.stock) < 0) {
        optionErrors.stock = 'Zaxira 0 yoki undan katta bo\'lishi kerak';
      }
      
      if (Object.keys(optionErrors).length > 0) {
        newErrors[`option_${index}`] = optionErrors;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update variant name
  const updateVariantName = (name) => {
    const updated = { ...localVariant, name };
    setLocalVariant(updated);
    validateVariant(updated);
    onUpdate(updated);
  };

  // Add new option
  const addOption = () => {
    const newOption = {
      value: '',
      price: '',
      oldPrice: '',
      stock: '',
      images: []
    };
    const updated = {
      ...localVariant,
      options: [...localVariant.options, newOption]
    };
    setLocalVariant(updated);
    onUpdate(updated);
  };

  // Update option
  const updateOption = (optionIndex, field, value) => {
    const updatedOptions = localVariant.options.map((option, index) => {
      if (index === optionIndex) {
        return { ...option, [field]: value };
      }
      return option;
    });
    const updated = { ...localVariant, options: updatedOptions };
    setLocalVariant(updated);
    validateVariant(updated);
    onUpdate(updated);
  };

  // Delete option
  const deleteOption = (optionIndex) => {
    const updatedOptions = localVariant.options.filter((_, index) => index !== optionIndex);
    const updated = { ...localVariant, options: updatedOptions };
    setLocalVariant(updated);
    onUpdate(updated);
  };

  // Move option up
  const moveOptionUp = (optionIndex) => {
    if (optionIndex === 0) return;
    const updatedOptions = [...localVariant.options];
    [updatedOptions[optionIndex - 1], updatedOptions[optionIndex]] = 
    [updatedOptions[optionIndex], updatedOptions[optionIndex - 1]];
    const updated = { ...localVariant, options: updatedOptions };
    setLocalVariant(updated);
    onUpdate(updated);
  };

  // Move option down
  const moveOptionDown = (optionIndex) => {
    if (optionIndex === localVariant.options.length - 1) return;
    const updatedOptions = [...localVariant.options];
    [updatedOptions[optionIndex], updatedOptions[optionIndex + 1]] = 
    [updatedOptions[optionIndex + 1], updatedOptions[optionIndex]];
    const updated = { ...localVariant, options: updatedOptions };
    setLocalVariant(updated);
    onUpdate(updated);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Variant Header */}
      <div className="bg-gray-50 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <button
              type="button"
              onClick={onToggleExpand}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              {isExpanded ? (
                <ChevronDownFAIcon className="text-sm" />
              ) : (
                <ChevronRightFAIcon className="text-sm" />
              )}
            </button>
            
            <div className="flex-1">
              <div className="flex-1">
                <input
                  type="text"
                  value={localVariant.name || ''}
                  onChange={(e) => updateVariantName(e.target.value)}
                  placeholder="Variant nomi (masalan: Rang, O'lcham, Xotira)"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {localVariant.options.length} ta variant
              </span>
              <button
                type="button"
                onClick={onDelete}
                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                title="Variantni o'chirish"
              >
                <TrashFAIcon className="text-sm" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Variant Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Options List */}
          {localVariant.options.map((option, optionIndex) => (
            <div key={optionIndex} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-700">
                  Variant #{optionIndex + 1}
                </h4>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => moveOptionUp(optionIndex)}
                    disabled={optionIndex === 0}
                    className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Yuqoriga ko'chirish"
                  >
                    <ChevronUpFAIcon className="text-sm" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveOptionDown(optionIndex)}
                    disabled={optionIndex === localVariant.options.length - 1}
                    className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Pastga ko'chirish"
                  >
                    <ChevronDownFAIcon className="text-sm" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteOption(optionIndex)}
                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                    title="Variantni o'chirish"
                  >
                    <TimesFAIcon className="text-sm" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Option Value */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Qiymat *
                  </label>
                  <input
                    type="text"
                    value={option.value || ''}
                    onChange={(e) => updateOption(optionIndex, 'value', e.target.value)}
                    placeholder="Masalan: Qizil, Katta, 64GB"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent ${
                      errors[`option_${optionIndex}`]?.value ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors[`option_${optionIndex}`]?.value && (
                    <p className="text-xs text-red-600">{errors[`option_${optionIndex}`].value}</p>
                  )}
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Narx (so'm) *
                  </label>
                  <input
                    type="number"
                    value={option.price || ''}
                    onChange={(e) => updateOption(optionIndex, 'price', e.target.value)}
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
                      errors[`option_${optionIndex}`]?.price ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    required
                  />

                  {errors[`option_${optionIndex}`]?.price && (
                    <p className="text-xs text-red-600">{errors[`option_${optionIndex}`].price}</p>
                  )}
                </div>

                {/* Old Price */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Eski narx (so'm)
                  </label>
                  <input
                    type="number"
                    value={option.oldPrice || ''}
                    onChange={(e) => updateOption(optionIndex, 'oldPrice', e.target.value)}
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
                    value={option.stock || ''}
                    onChange={(e) => updateOption(optionIndex, 'stock', e.target.value)}
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
                      errors[`option_${optionIndex}`]?.stock ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    required
                  />

                  {errors[`option_${optionIndex}`]?.stock && (
                    <p className="text-xs text-red-600">{errors[`option_${optionIndex}`].stock}</p>
                  )}
                </div>
              </div>
 
              {/* Option Images */}
              <div className="mt-3">
                <ImageUploader
                  images={option.images || []}
                  onImagesChange={(images) => updateOption(optionIndex, 'images', images)}
                  maxImages={999}
                  title={`${option.value || 'Variant'} rasmlari`}
                  className="bg-gray-50 p-2 rounded-lg"
                />
              </div>
            </div>
          ))}

          {/* Add Option Button */}
          <button
            type="button"
            onClick={addOption}
            className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-orange hover:text-primary-orange transition-colors flex items-center justify-center space-x-2"
          >
            <PlusFAIcon />
            <span>Yangi variant qo'shish</span>
          </button>

          {/* Variant Info */}
          {localVariant.options.length === 0 && (
            <div className="text-center py-6">
              <div className="text-gray-500">
                <InfoCircleFAIcon className="text-2xl mb-2" />
                <p className="text-sm">
                  Bu variant uchun hali variantlar qo'shilmagan
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Yuqoridagi tugma orqali yangi variant qo'shing
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VariantEditor;