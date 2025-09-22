import React, { useState } from 'react';
import { PlusFAIcon, ChevronUpFAIcon, ChevronDownFAIcon, TimesFAIcon, ExclamationTriangleFAIcon } from '../FontAwesome';

const ImageUploader = ({ 
  images = [], 
  onImagesChange, 
  maxImages = 5,
  title = "Rasmlar",
  allowReorder = true,
  allowDelete = true,
  className = "",
  onError = null
}) => {
  const [error, setError] = useState(null);
  const [urlInput, setUrlInput] = useState('');

  // URL validation helper
  const isValidUrl = (val) => {
    try {
      const s = String(val || '').trim();
      if (!s) return false;
      // Allow absolute http(s)
      if (/^https?:\/\//i.test(s)) return true;
      // Allow site-relative paths like /uploads/... or /assets/...
      if (s.startsWith('/uploads/') || s.startsWith('/assets/')) return true;
      // Allow legacy paths like uploads/... (we'll normalize to /uploads/...)
      if (s.startsWith('uploads/')) return true;
      return false;
    } catch (_) {
      return false;
    }
  };

  const normalizeUrl = (val) => {
    let s = String(val || '').trim();
    // Fix backslashes
    s = s.replace(/\\/g, '/');
    // Normalize legacy uploads path
    if (s.startsWith('uploads/')) s = '/' + s;
    return s;
  };

  const handleAddUrls = () => {
    setError(null);
    // Split by newline, comma, or whitespace
    const parts = urlInput
      .split(/\s|,|\n|\r/g)
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length === 0) return;

    const invalid = parts.filter((p) => !isValidUrl(p));
    if (invalid.length > 0) {
      const msg = `Quyidagi URL manzillar noto'g'ri:\n${invalid.join('\n')}`;
      setError(msg);
      if (onError) onError(msg);
      // Continue with only valid ones
    }

    const valid = parts.filter((p) => isValidUrl(p)).map(normalizeUrl);
    if (valid.length === 0) return;

    // Remove duplicates (including already existing)
    const existingSet = new Set(images);
    const toAdd = valid.filter((u) => !existingSet.has(u));

    if (toAdd.length === 0) {
      setUrlInput('');
      return;
    }

    const updated = [...images, ...toAdd];
    onImagesChange(updated);
    setUrlInput('');
  };

  // Remove image
  const removeImage = (index) => {
    if (!allowDelete) return;
    const updatedImages = images.filter((_, i) => i !== index);
    onImagesChange(updatedImages);
  };

  // Move image up
  const moveImageUp = (index) => {
    if (!allowReorder || index === 0) return;
    const updatedImages = [...images];
    [updatedImages[index - 1], updatedImages[index]] = [updatedImages[index], updatedImages[index - 1]];
    onImagesChange(updatedImages);
  };

  // Move image down
  const moveImageDown = (index) => {
    if (!allowReorder || index === images.length - 1) return;
    const updatedImages = [...images];
    [updatedImages[index], updatedImages[index + 1]] = [updatedImages[index + 1], updatedImages[index]];
    onImagesChange(updatedImages);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Title */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {title}
        </label>
        <span className="text-sm text-gray-500">
          {images.length} ta rasm
        </span>
      </div>

      {/* URL Input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddUrls(); } }}
            placeholder="Rasm URL manzili yoki bir nechta URL (bo'sh joy/newline bilan ajrating): https://..., /uploads/..., /assets/..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
          />
          <button
            type="button"
            onClick={handleAddUrls}
            className="bg-primary-orange text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-2"
            title="URL qo'shish"
          >
            <PlusFAIcon />
            Qo'shish
          </button>
        </div>
        <span className="text-xs text-gray-500">Misollar: https://domain.com/image.jpg yoki /uploads/mahsulotlar/rasm.jpg</span>
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-md overflow-hidden border border-gray-200 hover:border-primary-orange transition-colors">
                <img
                  src={image}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Image Controls Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
                  {/* Move Up */}
                  {allowReorder && (
                    <button
                      type="button"
                      onClick={() => moveImageUp(index)}
                      disabled={index === 0}
                      className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Yuqoriga"
                    >
                      <ChevronUpFAIcon />
                    </button>
                  )}
                  
                  {/* Move Down */}
                  {allowReorder && (
                    <button
                      type="button"
                      onClick={() => moveImageDown(index)}
                      disabled={index === images.length - 1}
                      className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Pastga"
                    >
                      <ChevronDownFAIcon />
                    </button>
                  )}
                  
                  {/* Delete */}
                  {allowDelete && (
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      title="O'chirish"
                    >
                      <TimesFAIcon />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Image Number Badge */}
              <div className="absolute -top-1 -left-1 bg-primary-orange text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Text */}
      {images.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">Hali rasmlar qo'shilmagan. URL kiritib "Qo'shish" tugmasini bosing.</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start">
            <ExclamationTriangleFAIcon className="text-red-600 mr-2 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800 whitespace-pre-line">{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-xs text-red-600 hover:text-red-800 mt-1"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;