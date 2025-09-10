#!/usr/bin/env node

/**
 * Check a single product in the database
 */

const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function checkSingleProduct() {
  try {
    console.log('🔍 Checking single product...');
    
    const productId = '68b993d78f75eac835b708ce'; // Lucem Bulb 12w 6500K
    const product = await makeRequest(`/api/products/${productId}`);
    
    if (product && product.product) {
      const p = product.product;
      console.log(`\n📦 Product: ${p.name}`);
      console.log(`   ID: ${p._id}`);
      console.log(`   Main image: ${p.image || 'null'}`);
      console.log(`   Images array: ${p.images ? p.images.length : 0} items`);
      
      if (p.images && p.images.length > 0) {
        p.images.forEach((img, i) => {
          if (img) {
            const isBase64 = img.startsWith('data:image/');
            const preview = isBase64 ? 'BASE64 DATA' : img;
            console.log(`     [${i}]: ${preview}`);
          } else {
            console.log(`     [${i}]: null`);
          }
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSingleProduct();