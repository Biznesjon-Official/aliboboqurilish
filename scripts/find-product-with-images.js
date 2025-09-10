async function findProductWithImages() {
  try {
    console.log('🔍 Finding product with base64 images...\n');

    // Test with includeImages parameter
    const response = await fetch('http://localhost:5000/api/products?includeImages=true&limit=50');
    const data = await response.json();
    
    console.log(`📊 Found ${data.products.length} products`);
    
    // Find product with images
    const productWithImages = data.products.find(p => 
      (p.image && p.image.startsWith('data:image/')) || 
      (p.images && p.images.length > 0 && p.images.some(img => img && img.startsWith('data:image/')))
    );
    
    if (productWithImages) {
      console.log(`\n✅ Found product with images:`);
      console.log(`   Name: ${productWithImages.name}`);
      console.log(`   ID: ${productWithImages._id}`);
      
      if (productWithImages.image) {
        const isBase64 = productWithImages.image.startsWith('data:image/');
        console.log(`   Main image: ${isBase64 ? `BASE64 (${Math.round(productWithImages.image.length/1024)}KB)` : 'FILE_PATH'}`);
      }
      
      if (productWithImages.images && productWithImages.images.length > 0) {
        console.log(`   Images array: ${productWithImages.images.length} items`);
        productWithImages.images.forEach((img, idx) => {
          if (img) {
            const isBase64 = img.startsWith('data:image/');
            console.log(`     [${idx}]: ${isBase64 ? `BASE64 (${Math.round(img.length/1024)}KB)` : 'FILE_PATH'}`);
          }
        });
      }
    } else {
      console.log('\n❌ No products with base64 images found in API response');
      
      // Show first few products for debugging
      console.log('\n📋 First 3 products:');
      data.products.slice(0, 3).forEach((p, idx) => {
        console.log(`   ${idx + 1}. ${p.name}`);
        console.log(`      Main image: ${p.image || 'null'}`);
        console.log(`      Images array: ${p.images?.length || 0} items`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

findProductWithImages();