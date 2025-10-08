// Base64 rasmlarni URL formatiga o'tkazish
export const convertBase64ToUrl = async (base64String, productId, imageIndex = 0) => {
  try {
    // Base64 formatini tekshirish
    if (!base64String || !base64String.startsWith('data:image/')) {
      return base64String; // Agar base64 emas bo'lsa, o'zgartirishsiz qaytarish
    }

    // Base64 dan blob yaratish
    const response = await fetch(base64String);
    const blob = await response.blob();
    
    // FormData yaratish
    const formData = new FormData();
    formData.append('image', blob, `product_${productId}_${imageIndex}.jpg`);
    formData.append('productId', productId);
    formData.append('imageIndex', imageIndex);

    // Serverga yuborish
    const uploadResponse = await fetch('/api/upload/convert-base64', {
      method: 'POST',
      body: formData
    });

    if (uploadResponse.ok) {
      const result = await uploadResponse.json();
      return result.imageUrl; // Yangi URL ni qaytarish
    } else {
      console.error('Base64 konvertatsiya xatoligi:', uploadResponse.statusText);
      return base64String; // Xatolik bo'lsa, asl base64 ni qaytarish
    }
  } catch (error) {
    console.error('Base64 konvertatsiya xatoligi:', error);
    return base64String; // Xatolik bo'lsa, asl base64 ni qaytarish
  }
};

// Barcha mahsulot rasmlarini konvertatsiya qilish
export const convertAllProductImages = async () => {
  try {
    const response = await fetch('/api/products/convert-base64-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      throw new Error('Konvertatsiya xatoligi');
    }
  } catch (error) {
    console.error('Barcha rasmlarni konvertatsiya qilishda xatolik:', error);
    throw error;
  }
};

// Base64 rasmlarni aniqlash
export const detectBase64Images = async () => {
  try {
    const response = await fetch('/api/products/analyze-images');
    
    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      throw new Error('Tahlil xatoligi');
    }
  } catch (error) {
    console.error('Base64 rasmlarni aniqlashda xatolik:', error);
    throw error;
  }
};

// Rasm hajmini hisoblash
export const calculateImageSize = (base64String) => {
  if (!base64String || !base64String.startsWith('data:image/')) {
    return 0;
  }
  
  // Base64 string hajmini hisoblash (bytes)
  const base64Data = base64String.split(',')[1];
  const sizeInBytes = (base64Data.length * 3) / 4;
  
  return Math.round(sizeInBytes);
};

// Hajmni o'qiladigan formatga o'tkazish
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};