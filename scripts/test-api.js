#!/usr/bin/env node

/**
 * Test API and image serving
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

async function testAPI() {
  try {
    console.log('🔍 Testing API and images...');
    
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const health = await makeRequest('/api/health');
    console.log('✅ Health:', health.status);
    
    // Test products endpoint
    console.log('\n2. Testing products endpoint...');
    const products = await makeRequest('/api/products?limit=3');
    
    if (products && products.products) {
      console.log(`✅ Found ${products.products.length} products`);
      
      products.products.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name}`);
        console.log(`   ID: ${product._id}`);
        console.log(`   Main image: ${product.image || 'null'}`);
        console.log(`   Images array: ${product.images ? product.images.length : 0} items`);
        
        if (product.images && product.images.length > 0) {
          product.images.forEach((img, i) => {
            if (img) {
              console.log(`     [${i}]: ${img.substring(0, 80)}${img.length > 80 ? '...' : ''}`);
            } else {
              console.log(`     [${i}]: null`);
            }
          });
        }
      });
    }
    
    // Test image serving
    console.log('\n3. Testing image serving...');
    const firstProduct = products.products[0];
    if (firstProduct && firstProduct.image) {
      console.log(`Testing image: ${firstProduct.image}`);
      
      // Test if image file exists
      try {
        const imageResponse = await makeRequest(firstProduct.image);
        console.log('✅ Image endpoint responded');
      } catch (error) {
        console.log('❌ Image endpoint failed:', error.message);
      }
    } else {
      console.log('❌ No image to test');
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Backend is not running. Start it with: npm run dev:backend-only');
    }
  }
}

testAPI();