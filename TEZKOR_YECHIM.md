# Aksiyalarni tahrirlash va rasm o'zgartirish - Tezkor Yechim

## Muammo
- Aksiyalarni tahrirlashda ma'lumotlar saqlanmayapti
- Rasmni o'zgartiryapman, lekin saqlanmayapti

## Tezkor Yechim

### 1. AdminProducts komponentida to'g'ridan-to'g'ri API call

Mavjud `example/AdminProducts.jsx` faylida `handleSubmit` funksiyasini quyidagicha o'zgartiring:

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validation
  if (!formData.name.trim() || !formData.category) {
    safeNotifyError('Xatolik', 'Mahsulot nomi va kategoriya kiritilishi shart');
    return;
  }

  if (!formData.hasVariants && (!formData.price || !formData.stock)) {
    safeNotifyError('Xatolik', 'Narx va zaxira kiritilishi shart');
    return;
  }

  setIsSubmitting(true);

  try {
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

    // DIRECT API CALL - bypass React Query
    const url = selectedProduct?._id 
      ? `http://localhost:5000/api/products/${selectedProduct._id}`
      : 'http://localhost:5000/api/products';
    
    const method = selectedProduct?._id ? 'PUT' : 'POST';

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

    // Success handling
    const action = selectedProduct?._id ? 'yangilandi' : 'qo\'shildi';
    safeNotifySuccess('Muvaffaqiyat', `Mahsulot ${action}: ${productData.name}`);
    
    // Close modal and refresh
    closeModal();
    
    // Force refresh products list
    setTimeout(() => {
      window.location.reload();
    }, 1000);

  } catch (error) {
    console.error('❌ Form submission error:', error);
    safeNotifyError('Xatolik', error.message);
  } finally {
    setIsSubmitting(false);
  }
};
```

### 2. ImageUploader da to'g'ridan-to'g'ri backend URL

`src/components/admin/ImageUploader.jsx` faylida:

```jsx
// Upload to server - direct backend URL
const response = await fetch('http://localhost:5000/api/upload/image', {
  method: 'POST',
  body: formData,
});
```

### 3. Test qilish

1. Admin panelga kiring
2. Mahsulotlar bo'limiga o'ting
3. Biror mahsulotni tahrirlang
4. Ma'lumotlarni o'zgartiring
5. Saqlash tugmasini bosing
6. Console da loglarni kuzating

### 4. Agar muammo davom etsa

1. Browser Developer Tools > Network tabini oching
2. API so'rovlarini kuzating
3. Console da xatoliklarni tekshiring
4. Backend logs ni kuzating

Bu yechim React Query murakkabligini chetlab o'tib, to'g'ridan-to'g'ri API bilan ishlaydi.