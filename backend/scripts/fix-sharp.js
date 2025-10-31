#!/usr/bin/env node

/**
 * Script to fix Sharp installation issues on different CPU architectures
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Sharp Installation Fix Script');
console.log('================================');

// Test current Sharp installation
console.log('📋 Testing current Sharp installation...');
try {
  const sharp = require('sharp');
  const testBuffer = Buffer.alloc(100);
  sharp(testBuffer);
  console.log('✅ Sharp is working correctly!');
  console.log('📊 Sharp version:', sharp.versions);
  process.exit(0);
} catch (error) {
  console.log('❌ Sharp installation issue detected:', error.message);
}

// Detect system architecture
console.log('🔍 Detecting system architecture...');
const arch = process.arch;
const platform = process.platform;
console.log(`📋 Platform: ${platform}, Architecture: ${arch}`);

// Remove existing Sharp installation
console.log('🗑️ Removing existing Sharp installation...');
try {
  execSync('npm uninstall sharp', { stdio: 'inherit' });
  console.log('✅ Sharp uninstalled');
} catch (error) {
  console.log('⚠️ Could not uninstall Sharp:', error.message);
}

// Clear npm cache
console.log('🧹 Clearing npm cache...');
try {
  execSync('npm cache clean --force', { stdio: 'inherit' });
  console.log('✅ Cache cleared');
} catch (error) {
  console.log('⚠️ Could not clear cache:', error.message);
}

// Install Sharp with specific options
console.log('📦 Installing Sharp with compatibility options...');
const installCommands = [
  // Try standard installation first
  'npm install sharp@latest',
  // Try with optional dependencies
  'npm install --include=optional sharp@latest',
  // Try platform-specific installation
  `npm install --os=${platform} --cpu=${arch} sharp@latest`,
  // Try with rebuild
  'npm install sharp@latest && npm rebuild sharp'
];

let installed = false;
for (const command of installCommands) {
  if (installed) break;
  
  console.log(`🔄 Trying: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
    
    // Test the installation
    try {
      delete require.cache[require.resolve('sharp')];
      const sharp = require('sharp');
      const testBuffer = Buffer.alloc(100);
      sharp(testBuffer);
      console.log('✅ Sharp installed and working!');
      installed = true;
    } catch (testError) {
      console.log('❌ Installation succeeded but Sharp still not working');
    }
  } catch (error) {
    console.log(`❌ Command failed: ${error.message}`);
  }
}

if (!installed) {
  console.log('');
  console.log('⚠️ Could not install working Sharp version');
  console.log('🔄 The application will use fallback image handling');
  console.log('');
  console.log('💡 Manual solutions:');
  console.log('1. Update your system to support newer CPU instructions');
  console.log('2. Use Docker with a compatible base image');
  console.log('3. Install Sharp from source: npm install --build-from-source sharp');
  console.log('4. Use a different server with compatible CPU architecture');
  console.log('');
  console.log('📚 More info: https://sharp.pixelplumbing.com/install');
} else {
  console.log('');
  console.log('🎉 Sharp installation completed successfully!');
}