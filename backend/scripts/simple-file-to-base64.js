const fs = require('fs');
const path = require('path');

// Simple file to base64 converter without MongoDB dependency
const convertFileToBase64 = (filePath) => {
  try {
    const fullPath = path.join(__dirname, '..', filePath.replace('/uploads/', 'uploads/'));
    
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ File not found: ${fullPath}`);
      return null;
    }
    
    const fileBuffer = fs.readFileSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    
    const mimeType = mimeTypes[ext] || 'image/jpeg';
    const base64String = fileBuffer.toString('base64');
    
    console.log(`✅ Converted: ${Math.round(fileBuffer.length / 1024)}KB -> ${Math.round(base64String.length / 1024)}KB base64`);
    
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
};

// Test with sample files
console.log('🧪 Testing File to Base64 Conversion...\n');

const testFiles = [
  '/uploads/products/68b17a5b8329a2817ce0545f_main_1756994201197.jpeg',
  '/uploads/products/68b17ac18329a2817ce0546a_main_1756994201501.jpeg',
  '/uploads/products/68b17b388329a2817ce0547d_main_1756994201769.jpeg'
];

testFiles.forEach((filePath, index) => {
  console.log(`\n📸 Test ${index + 1}: ${filePath}`);
  const base64Result = convertFileToBase64(filePath);
  
  if (base64Result) {
    console.log(`✅ Success! Base64 length: ${base64Result.length} characters`);
    console.log(`🔍 Preview: ${base64Result.substring(0, 100)}...`);
  } else {
    console.log(`❌ Failed to convert`);
  }
});

console.log('\n🎉 Test completed!');