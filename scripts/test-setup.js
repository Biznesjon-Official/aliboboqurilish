#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log('green', `✅ ${description}: ${filePath}`);
  } else {
    log('red', `❌ Missing ${description}: ${filePath}`);
  }
  return exists;
}

function checkPackageScript(scriptName, description) {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const hasScript = packageJson.scripts && packageJson.scripts[scriptName];
    if (hasScript) {
      log('green', `✅ ${description}: ${packageJson.scripts[scriptName]}`);
    } else {
      log('red', `❌ Missing ${description} script`);
    }
    return hasScript;
  } catch (error) {
    log('red', `❌ Error reading package.json: ${error.message}`);
    return false;
  }
}

function checkDependency(depName, description) {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const hasDep = (packageJson.dependencies && packageJson.dependencies[depName]) ||
                   (packageJson.devDependencies && packageJson.devDependencies[depName]);
    if (hasDep) {
      log('green', `✅ ${description} installed`);
    } else {
      log('red', `❌ Missing ${description}`);
    }
    return hasDep;
  } catch (error) {
    log('red', `❌ Error checking dependencies: ${error.message}`);
    return false;
  }
}

async function testProxyConfiguration() {
  log('blue', '\n🔧 Testing proxy configuration...');
  
  // Check if setupProxy.js exists and has correct content
  const proxyFile = 'src/setupProxy.js';
  if (checkFileExists(proxyFile, 'Proxy configuration')) {
    try {
      const content = fs.readFileSync(proxyFile, 'utf8');
      const hasApiProxy = content.includes('/api') && content.includes('5000');
      const hasUploadsProxy = content.includes('/uploads') && content.includes('5000');
      
      if (hasApiProxy) {
        log('green', '✅ API proxy configuration found');
      } else {
        log('red', '❌ API proxy configuration missing or incorrect');
      }
      
      if (hasUploadsProxy) {
        log('green', '✅ Uploads proxy configuration found');
      } else {
        log('red', '❌ Uploads proxy configuration missing or incorrect');
      }
      
      return hasApiProxy && hasUploadsProxy;
    } catch (error) {
      log('red', `❌ Error reading proxy file: ${error.message}`);
      return false;
    }
  }
  return false;
}

function testEnvironmentConfiguration() {
  log('blue', '\n🌍 Testing environment configuration...');
  
  const frontendEnv = checkFileExists('.env.development', 'Frontend environment config');
  const backendEnv = checkFileExists('backend/.env.development', 'Backend environment config');
  
  // Check if default image exists
  const defaultImage = checkFileExists('public/assets/default-product.svg', 'Default product image');
  
  return frontendEnv && backendEnv && defaultImage;
}

function testScriptConfiguration() {
  log('blue', '\n📜 Testing script configuration...');
  
  const scripts = [
    { name: 'start', desc: 'Unified start script' },
    { name: 'start:frontend', desc: 'Frontend start script' },
    { name: 'start:backend', desc: 'Backend start script' },
    { name: 'dev:safe', desc: 'Safe development script' },
    { name: 'health', desc: 'Health check script' }
  ];
  
  return scripts.every(script => 
    checkPackageScript(script.name, script.desc)
  );
}

function testDependencies() {
  log('blue', '\n📦 Testing dependencies...');
  
  const deps = [
    { name: 'concurrently', desc: 'Concurrently package' },
    { name: 'http-proxy-middleware', desc: 'Proxy middleware' },
    { name: 'cross-env', desc: 'Cross-platform environment variables' }
  ];
  
  return deps.every(dep => 
    checkDependency(dep.name, dep.desc)
  );
}

async function testImageFallback() {
  log('blue', '\n🖼️  Testing image fallback configuration...');
  
  // Check OptimizedImage component
  const optimizedImageFile = 'src/components/OptimizedImage.jsx';
  if (checkFileExists(optimizedImageFile, 'OptimizedImage component')) {
    try {
      const content = fs.readFileSync(optimizedImageFile, 'utf8');
      const hasDevLogging = content.includes('NODE_ENV === \'development\'') && 
                           content.includes('console.warn');
      const hasFallback = content.includes('default-product.svg');
      
      if (hasDevLogging) {
        log('green', '✅ Development logging found in OptimizedImage');
      } else {
        log('yellow', '⚠️  Development logging not found in OptimizedImage');
      }
      
      if (hasFallback) {
        log('green', '✅ Fallback image configuration found');
      } else {
        log('red', '❌ Fallback image configuration missing');
      }
      
      return hasFallback;
    } catch (error) {
      log('red', `❌ Error reading OptimizedImage: ${error.message}`);
      return false;
    }
  }
  return false;
}

async function runAllTests() {
  log('cyan', '🧪 Running Unified Development Environment Tests\n');
  log('cyan', '='.repeat(60));
  
  const results = {
    dependencies: testDependencies(),
    scripts: testScriptConfiguration(),
    environment: testEnvironmentConfiguration(),
    proxy: await testProxyConfiguration(),
    images: await testImageFallback()
  };
  
  log('cyan', '\n' + '='.repeat(60));
  log('blue', '📊 Test Results Summary:');
  
  let allPassed = true;
  Object.entries(results).forEach(([test, passed]) => {
    if (passed) {
      log('green', `✅ ${test.charAt(0).toUpperCase() + test.slice(1)} tests: PASSED`);
    } else {
      log('red', `❌ ${test.charAt(0).toUpperCase() + test.slice(1)} tests: FAILED`);
      allPassed = false;
    }
  });
  
  console.log('\n' + '='.repeat(60));
  
  if (allPassed) {
    log('green', '🎉 All tests passed! Your unified development environment is ready.');
    log('blue', '\n📋 Next steps:');
    log('blue', '   1. Run "npm start" to start both services');
    log('blue', '   2. Wait for both services to be ready');
    log('blue', '   3. Run "npm run health" to verify services are running');
    log('blue', '   4. Open http://localhost:3000 in your browser');
    log('blue', '   5. Check that product images load correctly');
  } else {
    log('red', '⚠️  Some tests failed. Please fix the issues above before proceeding.');
    log('yellow', '\n💡 Common fixes:');
    log('yellow', '   - Run "npm install" to ensure all dependencies are installed');
    log('yellow', '   - Check that all configuration files exist');
    log('yellow', '   - Verify script configurations in package.json');
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Run all tests
runAllTests().catch(error => {
  log('red', `❌ Test runner error: ${error.message}`);
  process.exit(1);
});