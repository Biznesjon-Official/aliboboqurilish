import React, { useState } from 'react';
import VariantEditor from './VariantEditor';
import { PlusFAIcon, LayerGroupFAIcon } from '../FontAwesome';

const VariantManager = ({ variants = [], onVariantsChange }) => {
  const [expandedVariants, setExpandedVariants] = useState(new Set([0])); // First variant expanded by default

  // Add new variant
  const addVariant = () => {
    const newVariant = {
      name: '',
      options: []
    };
    const updatedVariants = [...variants, newVariant];
    onVariantsChange(updatedVariants);
    
    // Expand the new variant
    const newIndex = updatedVariants.length - 1;
    setExpandedVariants(prev => new Set([...prev, newIndex]));
  };

  // Update variant
  const updateVariant = (variantIndex, updatedVariant) => {
    const updatedVariants = variants.map((variant, index) => {
      if (index === variantIndex) {
        return updatedVariant;
      }
      return variant;
    });
    onVariantsChange(updatedVariants);
  };

  // Delete variant
  const deleteVariant = (variantIndex) => {
    const updatedVariants = variants.filter((_, index) => index !== variantIndex);
    onVariantsChange(updatedVariants);
    
    // Remove from expanded set
    setExpandedVariants(prev => {
      const newSet = new Set();
      prev.forEach(index => {
        if (index < variantIndex) {
          newSet.add(index);
        } else if (index > variantIndex) {
          newSet.add(index - 1);
        }
      });
      return newSet;
    });
  };

  // Toggle variant expansion
  const toggleVariantExpansion = (variantIndex) => {
    setExpandedVariants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(variantIndex)) {
        newSet.delete(variantIndex);
      } else {
        newSet.add(variantIndex);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Mahsulot variantlari</h3>
        <span className="text-sm text-gray-500">
          {variants.length} ta variant turi
        </span>
      </div>

      {/* Variants List */}
      {variants.map((variant, variantIndex) => (
        <VariantEditor
          key={variantIndex}
          variant={variant}
          variantIndex={variantIndex}
          onUpdate={(updatedVariant) => updateVariant(variantIndex, updatedVariant)}
          onDelete={() => deleteVariant(variantIndex)}
          isExpanded={expandedVariants.has(variantIndex)}
          onToggleExpand={() => toggleVariantExpansion(variantIndex)}
        />
      ))}

      {/* Add Variant Button */}
      <button
        type="button"
        onClick={addVariant}
        className="w-full py-4 px-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-orange hover:text-primary-orange transition-colors flex items-center justify-center space-x-2"
      >
        <PlusFAIcon />
        <span>Yangi variant turi qo'shish</span>
      </button>

      {/* Info */}
      {variants.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500">
            <LayerGroupFAIcon className="text-3xl mb-3" />
            <h4 className="text-lg font-medium mb-2">Variantlar qo'shilmagan</h4>
            <p className="text-sm text-gray-400 mb-4">
              Mahsulot uchun turli variantlar yarating (rang, o'lcham, xotira va h.k.)
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h5 className="font-medium text-blue-900 mb-2">Misol:</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Rang:</strong> Qizil, Ko'k, Qora</li>
                <li>• <strong>O'lcham:</strong> Kichik, O'rta, Katta</li>
                <li>• <strong>Xotira:</strong> 64GB, 128GB, 256GB</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Variant Summary */}
      {variants.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Variant xulosasi:</h4>
          <div className="text-sm text-blue-800 space-y-1">
            {variants.map((variant, index) => (
              <div key={index} className="flex items-center justify-between">
                <span>
                  <strong>{variant.name || `Variant ${index + 1}`}:</strong> {variant.options.length} ta variant
                </span>
                <span className="text-xs bg-blue-200 px-2 py-1 rounded">
                  {variant.options.reduce((total, option) => total + (parseInt(option.stock) || 0), 0)} zaxira
                </span>
              </div>
            ))}
            <div className="border-t border-blue-200 pt-2 mt-2 font-medium">
              Jami: {variants.reduce((total, variant) => 
                total * Math.max(1, variant.options.length), 1
              )} ta kombinatsiya
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VariantManager;