const https = require('https');
const fs = require('fs');

console.log('🔍 Testing Alibobo SEO Performance...\n');

const tests = [
  {
    name: 'Homepage Response',
    url: 'https://www.aliboboqurilish.uz/',
    checkFor: ['<title>', 'meta name="description"', 'og:title']
  },
  {
    name: 'Robots.txt',
    url: 'https://www.aliboboqurilish.uz/robots.txt',
    checkFor: ['User-agent', 'Sitemap', 'Allow']
  },
  {
    name: 'Sitemap.xml',
    url: 'https://www.aliboboqurilish.uz/sitemap.xml',
    checkFor: ['<urlset', '<url>', '<loc>']
  },
  {
    name: 'Manifest.json',
    url: 'https://www.aliboboqurilish.uz/manifest.json',
    checkFor: ['short_name', 'icons', 'theme_color']
  },
  {
    name: 'API Products (for SEO)',
    url: 'https://aliboboqurilish.uz/api/products/fast?limit=3',
    checkFor: ['products', 'image', 'name']
  }
];

async function testURL(test) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    https.get(test.url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const results = {
          name: test.name,
          url: test.url,
          status: res.statusCode,
          duration: duration,
          size: data.length,
          checks: {}
        };
        
        // Check for required content
        test.checkFor.forEach(item => {
          results.checks[item] = data.includes(item);
        });
        
        resolve(results);
      });
    }).on('error', (err) => {
      resolve({
        name: test.name,
        url: test.url,
        error: err.message,
        status: 'ERROR'
      });
    });
  });
}

async function runAllTests() {
  console.log('🚀 Starting SEO tests...\n');
  
  for (const test of tests) {
    const result = await testURL(test);
    
    console.log(`📊 ${result.name}`);
    console.log(`   URL: ${result.url}`);
    
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    } else {
      const statusIcon = result.status === 200 ? '✅' : '❌';
      console.log(`   ${statusIcon} Status: ${result.status}`);
      console.log(`   ⏱️  Duration: ${result.duration}ms`);
      console.log(`   📏 Size: ${result.size} bytes`);
      
      if (result.checks) {
        console.log('   🔍 Content Checks:');
        Object.entries(result.checks).forEach(([check, passed]) => {
          const icon = passed ? '✅' : '❌';
          console.log(`      ${icon} ${check}`);
        });
      }
    }
    console.log('');
  }
  
  // Generate SEO report
  const report = {
    timestamp: new Date().toISOString(),
    tests: tests.length,
    results: await Promise.all(tests.map(testURL))
  };
  
  fs.writeFileSync('seo-test-report.json', JSON.stringify(report, null, 2));
  console.log('📄 SEO test report saved to: seo-test-report.json');
  
  // Summary
  const passed = report.results.filter(r => r.status === 200).length;
  const failed = report.results.length - passed;
  
  console.log('\n📊 SEO Test Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / report.results.length) * 100)}%`);
  
  if (passed === report.results.length) {
    console.log('\n🎉 All SEO tests passed! Alibobo is ready for Google!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the issues above.');
  }
}

runAllTests().catch(console.error);