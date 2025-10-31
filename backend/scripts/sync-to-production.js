#!/usr/bin/env node

/**
 * Sync to Production - Deploy middleware and fixes to VPS
 */

console.log('🚀 Production Sync Script');
console.log('========================');

console.log('📋 Steps to sync localhost fixes to production:');
console.log('');

console.log('1️⃣ Upload middleware to VPS:');
console.log('   scp backend/middleware/imageServing.js root@vps:/opt/alibobo/backend/middleware/');
console.log('');

console.log('2️⃣ Upload startup script:');
console.log('   scp backend/scripts/startup-checks-fixed.js root@vps:/opt/alibobo/backend/scripts/');
console.log('');

console.log('3️⃣ Update package.json on VPS:');
console.log('   - Change startup-checks.js to startup-checks-fixed.js');
console.log('');

console.log('4️⃣ Restart backend on VPS:');
console.log('   pm2 restart alibobo-backend');
console.log('');

console.log('5️⃣ Check nginx config:');
console.log('   - Ensure /uploads/ requests go to backend');
console.log('   - Not served as static files');
console.log('');

console.log('💡 Alternative: Git push and pull on VPS');
console.log('   git add .');
console.log('   git commit -m "Fix image serving"');
console.log('   git push');
console.log('   # Then on VPS:');
console.log('   git pull');
console.log('   pm2 restart alibobo-backend');
console.log('');

console.log('🎯 After sync, production should work like localhost!');