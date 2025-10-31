#!/usr/bin/env node

// Image display diagnostics script
const https = require('https');
const http = require('http');

console.log('🔍 Diagnosing image display issues...\n');

// Test URLs
const testUrls = [
    'https://aliboboqurilish.uz/api/health',
    'https://aliboboqurilish.uz/uploads/products/original/1735649088000-product-1.jpg',
    'https://aliboboqurilish.uz/api/products?limit=1'
];

async function testUrl(url) {
    return new Promise((resolve) => {
        const client = url.startsWith('https') ? https : http;

        const req = client.request(url, { method: 'HEAD' }, (res) => {
            resolve({
                url,
                status: res.statusCode,
                headers: {
                    'content-type': res.headers['content-type'],
                    'access-control-allow-origin': res.headers['access-control-allow-origin'],
                    'cache-control': res.headers['cache-control']
                }
            });
        });

        req.on('error', (err) => {
            resolve({
                url,
                error: err.message
            });
        });

        req.setTimeout(5000, () => {
            req.destroy();
            resolve({
                url,
                error: 'Timeout'
            });
        });

        req.end();
    });
}

async function runDiagnostics() {
    console.log('Testing URLs...\n');

    for (const url of testUrls) {
        const result = await testUrl(url);

        if (result.error) {
            console.log(`❌ ${url}`);
            console.log(`   Error: ${result.error}\n`);
        } else {
            const statusEmoji = result.status >= 200 && result.status < 300 ? '✅' : '❌';
            console.log(`${statusEmoji} ${url}`);
            console.log(`   Status: ${result.status}`);
            console.log(`   Content-Type: ${result.headers['content-type'] || 'N/A'}`);
            console.log(`   CORS: ${result.headers['access-control-allow-origin'] || 'N/A'}`);
            console.log(`   Cache: ${result.headers['cache-control'] || 'N/A'}\n`);
        }
    }

    console.log('🔧 Recommendations:');
    console.log('1. If API health check fails: Backend server is down');
    console.log('2. If image returns 404: Check if file exists on server');
    console.log('3. If image returns 403: Check nginx configuration');
    console.log('4. If CORS is missing: Check backend CORS settings');
    console.log('5. If all tests pass but images don\'t show: Check frontend URL generation');
}

runDiagnostics().catch(console.error);