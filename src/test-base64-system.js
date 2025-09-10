// Test script for base64 image system
import { validateBase64Image, getBase64ImageInfo } from './components/Base64Image';

// Test data - sample base64 images
const testImages = {
  valid: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAqwCrAAD/2wBDAAQDAwQDAwQEAwQFBAQFBgoHBgYGBg0JCggKDw0QEA8NDwwRGxQTDhQWFRgVGBcYFhcXGhcaHBgdGhsaGhcXFhcX/9sAQwEEBQUGBQYKBgYKFhcVFxYXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcX/8AAEQgAEAAQAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBkQgUobHB0fAjM+HxFRMkUmJygjNzorLCQ1RjwuIkVaKy0jNUZHSDs8Lj4gVmNTVGRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/APf6KKK',
  invalid: 'not-base64-data',
  tooShort: 'data:image/jpeg;base64,abc',
  wrongFormat: 'data:text/plain;base64,SGVsbG8gV29ybGQ=',
  noData: '',
  null: null,
  undefined: undefined
};

// Test validation function
function testValidation() {
  console.log('🧪 Testing Base64 Image Validation...\n');
  
  Object.entries(testImages).forEach(([name, src]) => {
    const result = validateBase64Image(src);
    console.log(`Test "${name}":`, {
      input: src ? (src.length > 50 ? src.substring(0, 50) + '...' : src) : src,
      isValid: result.isValid,
      reason: result.reason
    });
  });
}

// Test image info function
function testImageInfo() {
  console.log('\n📊 Testing Base64 Image Info...\n');
  
  Object.entries(testImages).forEach(([name, src]) => {
    if (name === 'valid') { // Only test with valid image
      const info = getBase64ImageInfo(src);
      console.log(`Info for "${name}":`, {
        isValid: info.isValid,
        type: info.type,
        sizeKB: info.sizeKB,
        dataLength: info.dataLength
      });
    }
  });
}

// Test component rendering (mock)
function testComponentRendering() {
  console.log('\n🎨 Testing Component Rendering Logic...\n');
  
  // Mock component state
  const mockComponentTest = (src) => {
    const validation = validateBase64Image(src);
    
    if (!validation.isValid) {
      return {
        shouldRenderFallback: true,
        shouldShowError: false,
        shouldShowImage: false,
        reason: validation.reason
      };
    }
    
    return {
      shouldRenderFallback: false,
      shouldShowError: false,
      shouldShowImage: true,
      reason: null
    };
  };
  
  Object.entries(testImages).forEach(([name, src]) => {
    const result = mockComponentTest(src);
    console.log(`Component test "${name}":`, result);
  });
}

// Performance test
function testPerformance() {
  console.log('\n⚡ Testing Performance...\n');
  
  const iterations = 1000;
  const validImage = testImages.valid;
  
  // Test validation performance
  const startTime = performance.now();
  for (let i = 0; i < iterations; i++) {
    validateBase64Image(validImage);
  }
  const endTime = performance.now();
  
  console.log(`Validation performance: ${iterations} iterations in ${(endTime - startTime).toFixed(2)}ms`);
  console.log(`Average per validation: ${((endTime - startTime) / iterations).toFixed(4)}ms`);
}

// Memory usage test
function testMemoryUsage() {
  console.log('\n💾 Testing Memory Usage...\n');
  
  const largeBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(100000); // Large base64 string
  
  console.log('Testing with large base64 string...');
  const validation = validateBase64Image(largeBase64);
  const info = getBase64ImageInfo(largeBase64);
  
  console.log('Large image test:', {
    isValid: validation.isValid,
    sizeKB: info.sizeKB,
    memoryFootprint: `~${Math.round(largeBase64.length * 2 / 1024)}KB` // Rough estimate
  });
}

// Cross-browser compatibility test
function testCrossBrowserCompatibility() {
  console.log('\n🌐 Testing Cross-Browser Compatibility...\n');
  
  // Test features used in components
  const features = {
    'String.startsWith': typeof String.prototype.startsWith === 'function',
    'Array.from': typeof Array.from === 'function',
    'Promise': typeof Promise !== 'undefined',
    'performance.now': typeof performance !== 'undefined' && typeof performance.now === 'function',
    'IntersectionObserver': typeof IntersectionObserver !== 'undefined',
    'requestAnimationFrame': typeof requestAnimationFrame === 'function'
  };
  
  console.log('Browser feature support:');
  Object.entries(features).forEach(([feature, supported]) => {
    console.log(`  ${feature}: ${supported ? '✅' : '❌'}`);
  });
}

// Run all tests
function runAllTests() {
  console.log('🚀 Starting Base64 Image System Tests...\n');
  
  try {
    testValidation();
    testImageInfo();
    testComponentRendering();
    testPerformance();
    testMemoryUsage();
    testCrossBrowserCompatibility();
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Export for use in browser console or testing framework
if (typeof window !== 'undefined') {
  window.testBase64System = {
    runAllTests,
    testValidation,
    testImageInfo,
    testComponentRendering,
    testPerformance,
    testMemoryUsage,
    testCrossBrowserCompatibility
  };
}

// Auto-run if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  runAllTests();
}

export {
  runAllTests,
  testValidation,
  testImageInfo,
  testComponentRendering,
  testPerformance,
  testMemoryUsage,
  testCrossBrowserCompatibility
};