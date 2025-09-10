const fs = require('fs').promises;
const path = require('path');

// MIME type detection
const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml'
  };
  return mimeTypes[ext] || 'image/jpeg';
};

// Convert file to base64
const convertFileToBase64 = async (filePath) => {
  try {
    // Remove leading slash and construct full path
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const fullPath = path.join(__dirname, '..', cleanPath);
    
    console.log(`Reading file: ${fullPath}`);
    
    // Check if file exists
    await fs.access(fullPath);
    
    // Read file buffer
    const fileBuffer = await fs.readFile(fullPath);
    const mimeType = getMimeType(fullPath);
    const base64String = fileBuffer.toString('base64');
    
    console.log(`✅ File converted: ${Math.round(fileBuffer.length / 1024)}KB -> ${Math.round(base64String.length / 1024)}KB base64`);
    
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    console.log(`❌ File error: ${error.message}`);
    return null;
  }
};

// Test conversion
async function testConversion() {
  console.log('🧪 Testing Base64 Conversion...');
  
  // Test with a sample image
  const testImagePath = '/uploads/products/68b17a5b8329a2817ce0545f_main_1756994201197.jpeg';
  
  console.log(`\n📸 Testing conversion of: ${testImagePath}`);
  const base64Result = await convertFileToBase64(testImagePath);
  
  if (base64Result) {
    console.log(`\n✅ Conversion successful!`);
    console.log(`📏 Base64 length: ${base64Result.length} characters`);
    console.log(`🔍 Preview: ${base64Result.substring(0, 100)}...`);
    
    // Verify it's valid base64
    const isValidBase64 = base64Result.startsWith('data:image/');
    console.log(`✔️ Valid format: ${isValidBase64}`);
  } else {
    console.log(`\n❌ Conversion failed!`);
  }
}

testConversion().catch(console.error);