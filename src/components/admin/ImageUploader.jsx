import { useState, useRef } from 'react';
import { PlusFAIcon, ChevronUpFAIcon, ChevronDownFAIcon, TimesFAIcon, ExclamationTriangleFAIcon, UploadFAIcon } from '../FontAwesome';
import OptimizedImage from '../OptimizedImage';

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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // ImageUploader component initialized




  // File upload handler
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} rasm fayli emas`);
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} juda katta (5MB dan oshmasin)`);
        }

        // Clean filename - remove special characters and spaces
        const cleanFileName = file.name
          .replace(/[^\w\s.-]/g, '') // Remove special characters except word chars, spaces, dots, hyphens
          .replace(/\s+/g, '_') // Replace spaces with underscores
          .replace(/_{2,}/g, '_'); // Replace multiple underscores with single

        // Create new file with clean name
        const cleanFile = new File([file], cleanFileName, { type: file.type });

        // Create FormData
        const formData = new FormData();
        formData.append('image', cleanFile);

        // Upload to server - use API config
        const { buildApiUrl } = await import('../../utils/apiConfig');
        const uploadUrl = buildApiUrl('/api/upload/image');
        
        console.log('🔗 Upload URL:', uploadUrl);
        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `${file.name} yuklanmadi`);
        }

        const result = await response.json();
        return result.imageUrl; // Server qaytargan URL
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // Add to existing images
      const updated = [...images, ...uploadedUrls];
      onImagesChange(updated);

    } catch (err) {
      setError(err.message);
      if (onError) onError(err.message);
    } finally {
      setIsUploading(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
    <div className={`space-y-3 ${className}`}>
      {/* Title */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {title}
        </label>
        <span className="text-sm text-gray-500">
          {images.length} ta rasm
        </span>
      </div>

      {/* File Upload Section - Compact */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-primary-orange transition-colors"
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add('border-primary-orange', 'bg-orange-50');
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('border-primary-orange', 'bg-orange-50');
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('border-primary-orange', 'bg-orange-50');
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            handleFileUpload(files);
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
        />

        <div className="flex items-center justify-center gap-3">
          <div className="text-lg text-gray-400">
            <UploadFAIcon />
          </div>

          <div className="flex-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-primary-orange text-white px-3 py-1.5 rounded-md hover:bg-opacity-90 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <UploadFAIcon className="text-xs" />
              {isUploading ? 'Yuklanmoqda...' : 'Rasm tanlang'}
            </button>
          </div>

          <p className="text-xs text-gray-400 flex-shrink-0">
            JPG, PNG, WebP (5MB)
          </p>
        </div>
      </div>

      {/* Images Grid - Compact */}
      {images.length > 0 && (
        <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {images.map((image, index) => {
            // Rasmni to'g'ri URL ga aylantirish
            const imageUrl = (() => {
              if (!image) return '';

              // Agar base64 bo'lsa, to'g'ridan-to'g'ri qaytarish
              if (image.startsWith('data:')) return image;

              // Agar to'liq URL bo'lsa, to'g'ridan-to'g'ri qaytarish
              if (image.startsWith('http')) return image;

              // Agar uploads/ bilan boshlansa, to'g'ri URL yaratish
              if (image.startsWith('/uploads/') || image.startsWith('uploads/')) {
                const cleanPath = image.startsWith('/') ? image : '/' + image;
                return `http://localhost:5000${cleanPath}`;
              }

              // Boshqa hollarda to'g'ridan-to'g'ri qaytarish
              return image;
            })();

            return (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-md overflow-hidden border border-gray-200 hover:border-primary-orange transition-colors">
                  <OptimizedImage
                    src={imageUrl}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full"
                    objectFit="cover"
                    placeholder="skeleton"
                    fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA4VjE2TTggMTJIMTYiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+"
                  />
                </div>

                {/* Image Controls Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-md flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
                    {/* Move Up */}
                    {allowReorder && (
                      <button
                        type="button"
                        onClick={() => moveImageUp(index)}
                        disabled={index === 0}
                        className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Yuqoriga"
                      >
                        <ChevronUpFAIcon className="text-xs" />
                      </button>
                    )}

                    {/* Move Down */}
                    {allowReorder && (
                      <button
                        type="button"
                        onClick={() => moveImageDown(index)}
                        disabled={index === images.length - 1}
                        className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Pastga"
                      >
                        <ChevronDownFAIcon className="text-xs" />
                      </button>
                    )}

                    {/* Delete */}
                    {allowDelete && (
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        title="O'chirish"
                      >
                        <TimesFAIcon className="text-xs" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Image Number Badge */}
                <div className="absolute -top-1 -left-1 bg-primary-orange text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
              </div>
            );
          })}
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