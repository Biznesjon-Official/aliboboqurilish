#!/usr/bin/env node

/**
 * Script to check the current state of images in the database
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

async function checkImages() {
  try {
    console.log('🔍 Checking image status in database...');
    
    const result = await makeRequest('/api/products?limit=5');
    
    if (result && result.products) {
      console.log(`📊 Found ${result.products.length} products`);
      
      result.products.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name}`);
        console.log(`   Main image: ${product.image || 'null'}`);
        console.log(`   Images array: ${product.images ? product.images.length : 0} items`);
        if (product.images && product.images.length > 0) {
          product.images.forEach((img, i) => {
            const preview = img ? (img.length > 50 ? img.substring(0, 50) + '...' : img) : 'null';
            console.log(`     [${i}]: ${preview}`);
          });
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking images:', error.message);
    process.exit(1);
  }
}

checkImages();