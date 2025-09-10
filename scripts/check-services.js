#!/usr/bin/env node

const http = require('http');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkService(name, host, port, path = '/') {
  return new Promise((resolve) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        log('green', `✅ ${name} is running on ${host}:${port}`);
        resolve(true);
      } else {
        log('red', `❌ ${name} responded with status ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      log('red', `❌ ${name} is not responding: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      log('yellow', `⏱️  ${name} request timed out`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function checkAllServices() {
  log('blue', '🔍 Checking service availability...\n');

  const services = [
    { name: 'Backend API', host: 'localhost', port: 5000, path: '/api/health' },
    { name: 'Frontend Dev Server', host: 'localhost', port: 3000, path: '/' },
    { name: 'API Proxy', host: 'localhost', port: 3000, path: '/health' },
    { name: 'Image Serving', host: 'localhost', port: 5000, path: '/uploads/products/test-sample-image.jpg' }
  ];

  const results = await Promise.all(
    services.map(service => 
      checkService(service.name, service.host, service.port, service.path)
    )
  );

  const allRunning = results.every(result => result);

  console.log('\n' + '='.repeat(50));
  
  if (allRunning) {
    log('green', '🎉 All services are running successfully!');
    log('blue', '🌐 Frontend: http://localhost:3000');
    log('blue', '🔧 Backend API: http://localhost:5000');
    log('blue', '🖼️  Images: http://localhost:5000/uploads/');
    process.exit(0);
  } else {
    log('red', '⚠️  Some services are not running properly.');
    log('yellow', '💡 Troubleshooting tips:');
    
    if (!results[0]) {
      log('yellow', '   - Backend: Check if MongoDB is running and backend started');
    }
    if (!results[1]) {
      log('yellow', '   - Frontend: Check if React dev server started on port 3000');
    }
    if (!results[2] && results[1]) {
      log('yellow', '   - API Proxy: Check src/setupProxy.js configuration');
    }
    if (!results[3] && results[0]) {
      log('yellow', '   - Images: Check backend static file serving configuration');
    }
    
    log('yellow', '💡 Run "npm start" from the root directory to start all services.');
    process.exit(1);
  }
}

// Watch mode for continuous monitoring
const isWatchMode = process.argv.includes('--watch');

if (isWatchMode) {
  log('blue', '👀 Starting health check in watch mode...\n');
  
  const runCheck = async () => {
    try {
      await checkAllServices();
    } catch (error) {
      log('red', `❌ Health check failed: ${error.message}`);
    }
  };
  
  // Initial check
  runCheck();
  
  // Check every 30 seconds
  setInterval(runCheck, 30000);
} else {
  // Run the check once
  checkAllServices().catch(err => {
    log('red', `❌ Error checking services: ${err.message}`);
    process.exit(1);
  });
}