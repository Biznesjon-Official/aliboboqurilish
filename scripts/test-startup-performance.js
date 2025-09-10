#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Testing startup performance...\n');

const tests = [
  {
    name: 'Original npm start',
    command: 'npm',
    args: ['start'],
    timeout: 30000
  },
  {
    name: 'Fast startup (npm run start:fast)',
    command: 'npm',
    args: ['run', 'start:fast'],
    timeout: 15000
  },
  {
    name: 'Turbo startup (npm run start:turbo)',
    command: 'npm',
    args: ['run', 'start:turbo'],
    timeout: 10000
  }
];

async function testStartup(test) {
  return new Promise((resolve) => {
    console.log(`⏱️  Testing: ${test.name}`);
    const startTime = Date.now();
    
    const child = spawn(test.command, test.args, {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
      shell: true
    });
    
    let backendReady = false;
    let frontendReady = false;
    
    const checkComplete = () => {
      if (backendReady && frontendReady) {
        const duration = Date.now() - startTime;
        console.log(`✅ ${test.name}: ${duration}ms\n`);
        child.kill('SIGTERM');
        resolve(duration);
      }
    };
    
    child.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Backend ready on port') || output.includes('🚀 Backend ready')) {
        backendReady = true;
        checkComplete();
      }
      if (output.includes('webpack compiled') || output.includes('Local:')) {
        frontendReady = true;
        checkComplete();
      }
    });
    
    child.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Backend ready on port') || output.includes('🚀 Backend ready')) {
        backendReady = true;
        checkComplete();
      }
      if (output.includes('webpack compiled') || output.includes('Local:')) {
        frontendReady = true;
        checkComplete();
      }
    });
    
    // Timeout handler
    setTimeout(() => {
      if (!backendReady || !frontendReady) {
        console.log(`⏰ ${test.name}: Timeout after ${test.timeout}ms`);
        child.kill('SIGTERM');
        resolve(test.timeout);
      }
    }, test.timeout);
    
    child.on('error', (err) => {
      console.log(`❌ ${test.name}: Error - ${err.message}`);
      resolve(test.timeout);
    });
  });
}

async function runTests() {
  const results = [];
  
  for (const test of tests) {
    const duration = await testStartup(test);
    results.push({ name: test.name, duration });
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('📊 Performance Results:');
  console.log('========================');
  results.forEach(result => {
    const seconds = (result.duration / 1000).toFixed(1);
    console.log(`${result.name}: ${seconds}s`);
  });
  
  const fastest = results.reduce((min, current) => 
    current.duration < min.duration ? current : min
  );
  
  console.log(`\n🏆 Fastest: ${fastest.name} (${(fastest.duration / 1000).toFixed(1)}s)`);
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testStartup, runTests };