async function testAPI() {
  try {
    console.log('🔍 Testing craftsmen endpoint...');
    const craftsmenResponse = await fetch('http://localhost:5001/api/craftsmen?limit=20&status=active');
    console.log('Craftsmen status:', craftsmenResponse.status);
    const craftsmenData = await craftsmenResponse.json();
    console.log('Craftsmen data:', JSON.stringify(craftsmenData, null, 2));
    
    console.log('\n🔍 Testing products endpoint...');
    const productsResponse = await fetch('http://localhost:5001/api/products?limit=40&page=1&sortBy=updatedAt&sortOrder=desc&includeImages=true');
    console.log('Products status:', productsResponse.status);
    const productsData = await productsResponse.json();
    console.log('Products data:', JSON.stringify(productsData, null, 2));
  } catch (error) {
    console.error('❌ API test error:', error.message);
  }
}

testAPI();