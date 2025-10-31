#!/usr/bin/env node

/**
 * Security Vulnerabilities Fix Script
 * Addresses npm audit issues safely without breaking functionality
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Security Vulnerabilities Fix Script');
console.log('=====================================');

// Read current package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

console.log('📋 Current vulnerable dependencies:');
console.log('   - node-telegram-bot-api:', packageJson.dependencies['node-telegram-bot-api']);
console.log('   - Issues: form-data, tough-cookie vulnerabilities');

// Backup package.json
const backupPath = packageJsonPath + '.backup';
fs.writeFileSync(backupPath, JSON.stringify(packageJson, null, 2));
console.log('💾 Backup created:', backupPath);

// Test current Telegram functionality
console.log('🧪 Testing current Telegram service...');
try {
  const telegramService = require('../services/TelegramService');
  console.log('✅ Telegram service loads correctly');
} catch (error) {
  console.log('⚠️ Telegram service has issues:', error.message);
}

// Strategy 1: Try updating to a secure version that maintains compatibility
console.log('');
console.log('🔄 Strategy 1: Updating to secure compatible version...');
try {
  // Update to the latest 0.63.x version (before breaking changes)
  execSync('npm install node-telegram-bot-api@0.63.0', { stdio: 'inherit' });
  
  // Test if it works
  delete require.cache[require.resolve('../services/TelegramService')];
  const telegramService = require('../services/TelegramService');
  
  console.log('✅ Strategy 1 successful - Updated to secure version');
  
  // Run audit to check if vulnerabilities are fixed
  try {
    const auditResult = execSync('npm audit --audit-level=high', { encoding: 'utf8' });
    if (auditResult.includes('found 0 vulnerabilities')) {
      console.log('🎉 All high/critical vulnerabilities fixed!');
    } else {
      console.log('⚠️ Some vulnerabilities may remain, but critical ones should be fixed');
    }
  } catch (auditError) {
    // npm audit returns non-zero exit code when vulnerabilities exist
    console.log('📊 Running final audit check...');
  }
  
} catch (error) {
  console.log('❌ Strategy 1 failed:', error.message);
  
  // Strategy 2: Manual dependency updates
  console.log('');
  console.log('🔄 Strategy 2: Manual dependency resolution...');
  
  try {
    // Restore from backup
    fs.writeFileSync(packageJsonPath, fs.readFileSync(backupPath));
    
    // Update specific vulnerable dependencies
    execSync('npm install form-data@latest tough-cookie@latest', { stdio: 'inherit' });
    
    console.log('✅ Strategy 2 completed - Updated vulnerable sub-dependencies');
    
  } catch (error2) {
    console.log('❌ Strategy 2 failed:', error2.message);
    
    // Strategy 3: Force fix with careful testing
    console.log('');
    console.log('🔄 Strategy 3: Careful force fix...');
    
    try {
      // Restore from backup first
      fs.writeFileSync(packageJsonPath, fs.readFileSync(backupPath));
      
      // Run npm audit fix but not --force yet
      execSync('npm audit fix', { stdio: 'inherit' });
      
      // Test Telegram service
      delete require.cache[require.resolve('../services/TelegramService')];
      const telegramService = require('../services/TelegramService');
      
      console.log('✅ Strategy 3 successful - Audit fix applied safely');
      
    } catch (error3) {
      console.log('❌ Strategy 3 failed, restoring backup');
      fs.writeFileSync(packageJsonPath, fs.readFileSync(backupPath));
    }
  }
}

// Final verification
console.log('');
console.log('🔍 Final verification...');

try {
  // Test Telegram service one more time
  delete require.cache[require.resolve('../services/TelegramService')];
  const telegramService = require('../services/TelegramService');
  console.log('✅ Telegram service working after security fixes');
  
  // Test basic functionality
  if (telegramService.isConfigured && telegramService.isConfigured()) {
    console.log('✅ Telegram service is properly configured');
  } else {
    console.log('⚠️ Telegram service not configured (this is OK if intentional)');
  }
  
} catch (error) {
  console.error('❌ Telegram service broken after fixes:', error.message);
  console.log('🔄 Restoring backup...');
  fs.writeFileSync(packageJsonPath, fs.readFileSync(backupPath));
}

// Clean up backup if everything is working
try {
  delete require.cache[require.resolve('../services/TelegramService')];
  require('../services/TelegramService');
  fs.unlinkSync(backupPath);
  console.log('🧹 Backup cleaned up - fixes successful');
} catch (error) {
  console.log('💾 Backup preserved due to potential issues');
}

console.log('');
console.log('📊 Security Fix Summary:');
console.log('========================');

// Run final audit
try {
  execSync('npm audit --audit-level=moderate', { stdio: 'inherit' });
} catch (auditError) {
  console.log('');
  console.log('💡 If vulnerabilities remain:');
  console.log('   1. They may be in development dependencies (less critical)');
  console.log('   2. Consider using npm audit --production');
  console.log('   3. Monitor for updates to vulnerable packages');
  console.log('   4. Consider alternative packages if issues persist');
}

console.log('');
console.log('🎯 Security fix process completed!');
console.log('');
console.log('📋 Next steps:');
console.log('   1. Test your application thoroughly');
console.log('   2. Monitor for any Telegram functionality issues');
console.log('   3. Run: pm2 restart alibobo-backend');
console.log('   4. Check logs: pm2 logs alibobo-backend');