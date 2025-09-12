#!/usr/bin/env node

/**
 * Performance Test Script
 * Tests the optimized product loading performance
 */

// Using built-in fetch instead of axios

const API_BASE = 'http://localhost:5001/api';
const TEST_ENDPOINTS = [
  '/products/fast?limit=20&page=1',
  '/products/fast?limit=20&page=1&sortBy=updatedAt&sortOrder=desc',
  '/products/fast?limit=20&page=2',
  '/products/fast?category=electronics&limit=20',
  '/craftsmen?limit=20&status=active'
];

async function testEndpoint(endpoint) {
  const startTime = Date.now();
  
  try {
    console.log(`\n🧪 Testing: ${endpoint}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    const duration = Date.now() - startTime;
    const dataSize = JSON.stringify(data).length;
    
    console.log(`✅ Success: ${duration}ms`);
    console.log(`📊 Response size: ${(dataSize / 1024).toFixed(2)} KB`);
    console.log(`📦 Products returned: ${data.products?.length || 'N/A'}`);
    
    if (data.performance) {
      console.log(`⚡ Server query time: ${data.performance.queryTime}ms`);
      console.log(`🔄 Cached: ${data.performance.cached ? 'Yes' : 'No'}`);
    }
    
    // Performance evaluation
    if (duration < 1000) {
      console.log(`🚀 EXCELLENT: Under 1 second!`);
    } else if (duration < 3000) {
      console.log(`✅ GOOD: Under 3 seconds`);
    } else if (duration < 10000) {
      console.log(`⚠️  SLOW: ${duration}ms - needs optimization`);
    } else {
      console.log(`❌ VERY SLOW: ${duration}ms - critical issue`);
    }
    
    return { endpoint, duration, success: true, dataSize };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ Failed: ${duration}ms`);
    console.log(`💥 Error: ${error.message}`);
    
    return { endpoint, duration, success: false, error: error.message };
  }
}

async function runPerformanceTests() {
  console.log('🚀 Starting Performance Tests...');
  console.log('Target: <1 second for product loading');
  console.log('Previous performance: 35-78 seconds');
  
  const results = [];
  
  for (const endpoint of TEST_ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 PERFORMANCE SUMMARY');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (successful.length > 0) {
    const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
    const maxDuration = Math.max(...successful.map(r => r.duration));
    const minDuration = Math.min(...successful.map(r => r.duration));
    
    console.log(`✅ Successful tests: ${successful.length}/${results.length}`);
    console.log(`⚡ Average response time: ${avgDuration.toFixed(0)}ms`);
    console.log(`🏃 Fastest response: ${minDuration}ms`);
    console.log(`🐌 Slowest response: ${maxDuration}ms`);
    
    // Performance grade
    if (avgDuration < 1000) {
      console.log(`🏆 GRADE: A+ (Excellent performance!)`);
    } else if (avgDuration < 3000) {
      console.log(`🥇 GRADE: A (Good performance)`);
    } else if (avgDuration < 5000) {
      console.log(`🥈 GRADE: B (Acceptable performance)`);
    } else {
      console.log(`🥉 GRADE: C (Needs improvement)`);
    }
  }
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed tests: ${failed.length}`);
    failed.forEach(f => {
      console.log(`  - ${f.endpoint}: ${f.error}`);
    });
  }
  
  console.log('\n💡 Optimization Tips:');
  console.log('1. Run: node backend/scripts/create-performance-indexes.js');
  console.log('2. Restart the server to clear any memory issues');
  console.log('3. Check MongoDB connection and network latency');
  console.log('4. Monitor server resources (CPU, Memory)');
  
  return results;
}

// Run tests if called directly
if (require.main === module) {
  runPerformanceTests()
    .then(results => {
      const allSuccessful = results.every(r => r.success);
      const avgTime = results.filter(r => r.success).reduce((sum, r) => sum + r.duration, 0) / results.filter(r => r.success).length;
      
      if (allSuccessful && avgTime < 3000) {
        console.log('\n🎉 Performance optimization SUCCESS!');
        process.exit(0);
      } else {
        console.log('\n⚠️  Performance needs more work');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runPerformanceTests };