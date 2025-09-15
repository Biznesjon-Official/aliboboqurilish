// Test image display
const API_BASE = process.env.REACT_APP_API_BASE || 
  (process.env.NODE_ENV === 'production' ? 'https://aliboboqurilish.uz/api' : 'http://localhost:5000/api');

console.log('🔧 API_BASE:', API_BASE);

// Test image path processing
const testImagePath = '/uploads/products/original/68b17ac18329a2817ce0546a/68b17ac18329a2817ce0546a_0_1757703881813_baa27917.jpg';

const baseNoApi = API_BASE.replace(/\/api$/, '');
const fullImageUrl = `${baseNoApi}${testImagePath}`;

console.log('🖼️ Test image path:', testImagePath);
console.log('🌐 Full image URL:', fullImageUrl);

// Test if image is accessible
fetch(fullImageUrl)
  .then(response => {
    console.log('📡 Image fetch response:', response.status, response.statusText);
    if (response.ok) {
      console.log('✅ Image is accessible');
    } else {
      console.log('❌ Image is not accessible');
    }
  })
  .catch(error => {
    console.log('❌ Image fetch error:', error);
  });