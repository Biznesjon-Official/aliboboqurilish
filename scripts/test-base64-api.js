async function testBase64API() {
  try {
    console.log('🔍 Testing Base64 API endpoints...\n');

    // Test 1: Regular products endpoint (should have null images)
    console.log('1. Testing regular /api/products endpoint:');
    const regularResponse = await fetch('http://localhost:5000/api/products?limit=2');
    const regularData = await regularResponse.json();
    const regularProduct = regularData.products[0];
    console.log(`   Product: ${regularProduct.name}`);
    console.log(`   Main image: ${regularProduct.image || 'null'}`);
    console.log(`   Images array: ${regularProduct.images?.length || 0} items`);
    console.log(`   First image: ${regularProduct.images?.[0] ? (regularProduct.images[0].startsWith('data:') ? 'BASE64' : 'FILE_PATH') : 'none'}\n`);

    // Test 2: Products with includeImages parameter (should have base64 images)
    console.log('2. Testing /api/products?includeImages=true endpoint:');
    try {
      const base64Response = await fetch('http://localhost:5000/api/products?includeImages=true&limit=2');
      const base64Data = await base64Response.json();
      const base64Product = base64Data.products[0];
      console.log(`   Product: ${base64Product.name}`);
      console.log(`   Main image: ${base64Product.image ? (base64Product.image.startsWith('data:') ? `BASE64 (${Math.round(base64Product.image.length/1024)}KB)` : 'FILE_PATH') : 'null'}`);
      console.log(`   Images array: ${base64Product.images?.length || 0} items`);
      if (base64Product.images?.[0]) {
        const firstImg = base64Product.images[0];
        console.log(`   First image: ${firstImg.startsWith('data:') ? `BASE64 (${Math.round(firstImg.length/1024)}KB)` : 'FILE_PATH'}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    console.log('\n✅ API test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBase64API();