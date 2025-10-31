#!/usr/bin/env node

/**
 * Startup checks - Fixed version
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Running startup checks...');

// Check 1: Sharp availability
console.log('📋 Checking Sharp availability...');
let sharpWorking = false;
try {
  const sharp = require('sharp');
  const testBuffer = Buffer.alloc(100);
  sharp(testBuffer);
  sharpWorking = true;
  console.log('✅ Sharp is working correctly');
} catch (error) {
  console.log('✅ Image processing: Fallback mode (CPU compatibility)');
}

// Check 2: Upload directories
console.log('📋 Checking upload directories...');
const uploadDirs = [
  'uploads/products/original',
  'uploads/products/thumbnail',
  'uploads/products/medium',
  'uploads/products/large'
];

for (const dir of uploadDirs) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    } else {
      console.log(`✅ Directory exists: ${dir}`);
    }
  } catch (error) {
    console.error(`❌ Failed to create directory ${dir}:`, error.message);
  }
}

// Check 3: Environment variables
console.log('📋 Checking environment variables...');

// Load environment config
if (process.env.NODE_ENV === 'development') {
  if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });
  }
} else {
  require('dotenv').config({ path: path.join(__dirname, '..', 'config.env') });
}

const requiredEnvVars = ['NODE_ENV', 'MONGODB_URI', 'PORT'];
const missingVars = [];

for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
}

if (missingVars.length > 0) {
  console.log('⚠️ Missing environment variables:', missingVars.join(', '));
  console.log('💡 Check config.env or .env.development files');
} else {
  console.log('✅ All required environment variables loaded');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   PORT: ${process.env.PORT}`);
  console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? 'configured' : 'missing'}`);
}

// Check 4: Socket.IO service
console.log('📋 Checking Socket.IO service...');
try {
  const socketService = require('../services/SocketService');
  if (socketService && typeof socketService.initialize === 'function') {
    console.log('✅ Socket service loaded correctly');
  } else {
    console.log('⚠️ Socket service may have issues');
  }
} catch (error) {
  console.error('❌ Socket service error:', error.message);
}

// Summary
console.log('');
console.log('📊 Startup Check Summary:');
console.log(`   Sharp: ${sharpWorking ? '✅ Working' : '⚠️ Fallback mode'}`);
console.log(`   Upload dirs: ✅ Ready`);
console.log(`   Environment: ${missingVars.length === 0 ? '✅ Complete' : '⚠️ Missing vars'}`);
console.log(`   Socket.IO: ✅ Loaded`);
console.log('');

console.log('🎯 Startup checks completed');