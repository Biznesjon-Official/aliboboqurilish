import React, { useState, useEffect } from 'react';
import { TimesFAIcon, ThLargeFAIcon, TagFAIcon, InboxFAIcon } from './FontAwesome';

const Catalog = ({ onCategorySelect, onClose, selectedCategory }) => {
  // Static categories from admin panel - Main categories first, matching CategoryNavigation.jsx format and order
  const categories = [
    { name: "Santexnika", value: "santexnika" },
    { name: "Yevro-Remont", value: "yevro-remont" },
    { name: "Elektrika", value: "elektrika" },
    { name: "Xoz-Mag", value: "xoz-mag" },
    { name: "Dekorativ-Mahsulotlar", value: "dekorativ-mahsulotlar" },
    { name: "G'isht va bloklar", value: "g'isht-va-bloklar" },
    { name: "Asbob-uskunalar", value: "asbob-uskunalar" },
    { name: "Bo'yoq va lak", value: "bo'yoq-va-lak" },
    { name: "Elektr mollalari", value: "elektr-mollalari" },
    { name: "Dekor va bezatish", value: "dekor-va-bezatish" },
    { name: "Issiqlik va konditsioner", value: "issiqlik-va-konditsioner" },
    { name: "Metall va armatura", value: "metall-va-armatura" },
    { name: "Yog'och va mebel", value: "yog'och-va-mebel" },
    { name: "Tom materiallar", value: "tom-materiallar" },
    { name: "Temir-beton", value: "temir-beton" },
    { name: "Gips va shpaklovka", value: "gips-va-shpaklovka" },
    { name: "Boshqalar", value: "boshqalar" }
  ];

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = '0px';
    
    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.paddingRight = '0px';
    };
  }, []);

  const handleCategoryClick = (categoryValue) => {
    onCategorySelect(categoryValue);
    onClose();
  };

  const handleAllProductsClick = () => {
    onCategorySelect('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 pb-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Katalog</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition duration-300"
          >
            <TimesFAIcon className="text-xl" />
          </button>
        </div>

        {/* Categories List */}
        <div className="overflow-y-auto max-h-[60vh]">
          {/* Mobile: Horizontal scrollable layout */}
          <div className="block sm:hidden p-4">
            {/* All Products Option */}
            <div className="mb-4">
              <button
                onClick={handleAllProductsClick}
                className={`w-full text-center p-3 rounded-lg transition duration-300 flex items-center justify-center space-x-2 ${
                  selectedCategory === '' 
                    ? 'bg-primary-orange text-white' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <ThLargeFAIcon className="text-lg" />
                <span className="font-medium">Barcha mahsulotlar</span>
              </button>
            </div>

            {/* Horizontal scrollable categories */}
            <div className="overflow-x-auto">
              <div className="flex space-x-3 pb-2" style={{ minWidth: 'max-content' }}>
                {categories.slice(0, 5).map((category, index) => (
                  <button
                    key={index}
                    onClick={() => handleCategoryClick(category.value)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg transition duration-300 whitespace-nowrap ${
                      selectedCategory === category.value 
                        ? 'bg-primary-orange text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="font-medium text-sm">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Show remaining categories if any */}
            {categories.length > 5 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600 font-medium">Boshqa kategoriyalar:</p>
                <div className="grid grid-cols-1 gap-2">
                  {categories.slice(5).map((category, index) => (
                    <button
                      key={index + 5}
                      onClick={() => handleCategoryClick(category.value)}
                      className={`w-full text-left p-3 rounded-lg transition duration-300 flex items-center space-x-3 ${
                        selectedCategory === category.value 
                          ? 'bg-primary-orange text-white' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <TagFAIcon className="text-lg" />
                      <span className="font-medium">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Desktop: Vertical layout */}
          <div className="hidden sm:block p-4 space-y-2">
            {/* All Products Option */}
            <button
              onClick={handleAllProductsClick}
              className={`w-full text-left p-3 rounded-lg transition duration-300 flex items-center space-x-3 ${
                selectedCategory === '' 
                  ? 'bg-primary-orange text-white' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <ThLargeFAIcon className="text-lg" />
              <span className="font-medium">Barcha mahsulotlar</span>
            </button>

            {/* Category Options */}
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => handleCategoryClick(category.value)}
                className={`w-full text-left p-3 rounded-lg transition duration-300 flex items-center space-x-3 ${
                  selectedCategory === category.value 
                    ? 'bg-primary-orange text-white' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <TagFAIcon className="text-lg" />
                <span className="font-medium">{category.name}</span>
              </button>
            ))}

            {categories.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <InboxFAIcon className="text-3xl mb-3" />
                <p>Hech qanday kategoriya topilmadi</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            Jami {categories.length} ta kategoriya
          </p>
        </div>
      </div>
    </div>
  );
};

export default Catalog;
