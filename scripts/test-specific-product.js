// Test specific product with base64 images
const https = require('https');
const http = require('http');

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function testSpecificProduct() {
    try {
        console.log('🔍 Testing specific product with base64 images...');

        // Test the product you mentioned: "Ruchka Plasmas Decor 314-003"
        const data = await makeRequest('http://localhost:5000/api/products?includeImages=true&search=Plasmas&limit=1');

        if (data.products && data.products.length > 0) {
            const product = data.products[0];
            console.log('\n📦 Product found:');
            console.log('   Name:', product.name);
            console.log('   ID:', product._id);
            console.log('   Main image:', product.image ? (product.image.startsWith('data:') ? 'BASE64 (' + Math.round(product.image.length / 1024) + 'KB)' : 'FILE_PATH') : 'null');
            console.log('   Images array:', product.images?.length || 0, 'items');

            if (product.images && product.images.length > 0) {
                product.images.forEach((img, index) => {
                    if (img && img.startsWith('data:')) {
                        console.log(`   Image ${index + 1}: BASE64 (${Math.round(img.length / 1024)}KB)`);
                    } else {
                        console.log(`   Image ${index + 1}: ${img || 'null'}`);
                    }
                });
            }

            // Test without includeImages parameter
            console.log('\n🔄 Testing same product WITHOUT includeImages parameter:');
            const data2 = await makeRequest('http://localhost:5000/api/products?search=Plasmas&limit=1');

            if (data2.products && data2.products.length > 0) {
                const product2 = data2.products[0];
                console.log('   Main image:', product2.image ? (product2.image.startsWith('data:') ? 'BASE64' : 'FILE_PATH') : 'null');
                console.log('   Images array:', product2.images?.length || 0, 'items');

                if (product2.images && product2.images.length > 0) {
                    product2.images.forEach((img, index) => {
                        if (img && img.startsWith('data:')) {
                            console.log(`   Image ${index + 1}: BASE64`);
                        } else {
                            console.log(`   Image ${index + 1}: ${img || 'null'}`);
                        }
                    });
                }
            }

        } else {
            console.log('❌ Product not found. Trying broader search...');

            // Try broader search
            const data3 = await makeRequest('http://localhost:5000/api/products?includeImages=true&limit=5');

            console.log(`\n📊 Found ${data3.products?.length || 0} products total`);

            if (data3.products && data3.products.length > 0) {
                data3.products.forEach((product, index) => {
                    const hasBase64 = product.images?.some(img => img?.startsWith('data:'));
                    console.log(`${index + 1}. ${product.name} - Images: ${product.images?.length || 0} ${hasBase64 ? '(HAS BASE64)' : ''}`);
                });
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testSpecificProduct();