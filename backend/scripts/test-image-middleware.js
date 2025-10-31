#!/usr/bin/env node

/**
 * Test Image Middleware - Check if it's working
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Image Middleware');
console.log('===========================');

// Test 1: Check if original directory exists and has files
const originalDir = path.join(__dirname, '..', 'uploads', 'products', 'original');
console.log('📁 Original directory:', originalDir);

if (fs.existsSync(originalDir)) {
    const files = fs.readdirSync(originalDir);
    console.log(`✅ Original directory exists with ${files.length} files`);
    
    // Show first few files
    console.log('📋 Sample files:');
    files.slice(0, 5).forEach(file => {
        console.log(`   - ${file}`);
    });
} else {
    console.log('❌ Original directory not found!');
}

// Test 2: Test ID extraction
console.log('');
console.log('🔍 Testing ID extraction:');

const testFilenames = [
    'converted-68b841a3ee6316e5011dcc67-main-1759888992302.jpg',
    'converted-68b1a41bd536f138d0985c0e-main-1759888934612.jpg',
    'converted-68b833f7ee6316e5011dcab6-main-1759888985060.jpg'
];

testFilenames.forEach(filename => {
    const convertedMatch = filename.match(/converted-([a-f0-9]+)/);
    if (convertedMatch) {
        const originalId = convertedMatch[1];
        console.log(`✅ ${filename} -> ID: ${originalId}`);
        
        // Check if we have a matching file
        if (fs.existsSync(originalDir)) {
            const originalFiles = fs.readdirSync(originalDir);
            const matchingFile = originalFiles.find(file => file.includes(originalId));
            
            if (matchingFile) {
                console.log(`   ✅ Found match: ${matchingFile}`);
            } else {
                console.log(`   ❌ No match found for ID: ${originalId}`);
            }
        }
    } else {
        console.log(`❌ Could not extract ID from: ${filename}`);
    }
});

console.log('');
console.log('🎯 Test completed!');