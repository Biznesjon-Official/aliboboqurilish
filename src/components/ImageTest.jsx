import React, { useState, useEffect } from 'react';
import OptimizedImage, { OptimizedImageGallery, useImagePreloader } from './OptimizedImage';

const ImageTest = () => {
  const [testResults, setTestResults] = useState({});
  const [backendStatus, setBackendStatus] = useState('checking');
  const { preloadImage, isPreloaded } = useImagePreloader();

  // Test backend connectivity
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          setBackendStatus('online');
          console.log('✅ [TEST] Backend is online and responding');
        } else {
          setBackendStatus('error');
          console.log('❌ [TEST] Backend responded with error:', response.status);
        }
      } catch (error) {
        setBackendStatus('offline');
        console.log('❌ [TEST] Backend is offline:', error.message);
      }
    };
    checkBackend();
  }, []);

  // Test image preloading
  useEffect(() => {
    const testPreloading = async () => {
      console.log('🔄 [TEST] Testing image preloading...');
      try {
        await preloadImage('/uploads/products/test-valid-image.jpg');
        console.log('✅ [TEST] Image preloading successful');
        setTestResults(prev => ({ ...prev, preloading: 'success' }));
      } catch (error) {
        console.log('❌ [TEST] Image preloading failed:', error);
        setTestResults(prev => ({ ...prev, preloading: 'failed' }));
      }
    };
    testPreloading();
  }, [preloadImage]);

  const handleImageLoad = (testName) => {
    console.log(`✅ [TEST] ${testName}: Image loaded successfully`);
    setTestResults(prev => ({ ...prev, [testName]: 'loaded' }));
  };

  const handleImageError = (testName) => {
    console.log(`❌ [TEST] ${testName}: Image failed to load (expected for invalid images)`);
    setTestResults(prev => ({ ...prev, [testName]: 'error' }));
  };

  const testImages = [
    '/uploads/products/test-valid-image.jpg',
    '/uploads/products/test-sample-image.jpg',
    '/uploads/products/non-existent-image.jpg'
  ];

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🧪 OptimizedImage Component Comprehensive Test</h2>
      
      {/* Backend Status */}
      <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>🏥 Backend Status</h3>
        <p>Status: <span style={{ 
          color: backendStatus === 'online' ? 'green' : backendStatus === 'offline' ? 'red' : 'orange',
          fontWeight: 'bold'
        }}>
          {backendStatus === 'online' ? '✅ Online' : 
           backendStatus === 'offline' ? '❌ Offline' : 
           backendStatus === 'error' ? '⚠️ Error' : '🔄 Checking...'}
        </span></p>
      </div>

      {/* Test Results Summary */}
      <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '8px' }}>
        <h3>📊 Test Results Summary</h3>
        <ul>
          <li>Preloading: {testResults.preloading === 'success' ? '✅' : testResults.preloading === 'failed' ? '❌' : '🔄'}</li>
          <li>Valid Image: {testResults.validImage === 'loaded' ? '✅' : testResults.validImage === 'error' ? '❌' : '🔄'}</li>
          <li>Invalid Image: {testResults.invalidImage === 'error' ? '✅ (Expected)' : testResults.invalidImage === 'loaded' ? '❌ (Unexpected)' : '🔄'}</li>
          <li>Lazy Loading: {testResults.lazyLoading === 'loaded' ? '✅' : testResults.lazyLoading === 'error' ? '❌' : '🔄'}</li>
        </ul>
      </div>

      {/* Test 1: Valid image with priority loading */}
      <div style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h3>🖼️ Test 1: Valid Image (Priority Loading)</h3>
        <p>Should load immediately with enhanced debugging</p>
        <OptimizedImage
          src="/uploads/products/test-valid-image.jpg"
          alt="Test valid image"
          width={200}
          height={200}
          priority={true}
          placeholder="blur"
          onLoad={() => handleImageLoad('validImage')}
          onError={() => handleImageError('validImage')}
        />
        <p><small>Check console for detailed loading information</small></p>
      </div>

      {/* Test 2: Invalid image with fallback */}
      <div style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h3>❌ Test 2: Invalid Image (Fallback Testing)</h3>
        <p>Should show fallback image and trigger backend health check</p>
        <OptimizedImage
          src="/uploads/products/non-existent-image.jpg"
          alt="Test invalid image"
          width={200}
          height={200}
          priority={true}
          placeholder="skeleton"
          onLoad={() => handleImageLoad('invalidImage')}
          onError={() => handleImageError('invalidImage')}
        />
        <p><small>Should trigger backend health check in console</small></p>
      </div>

      {/* Test 3: Different placeholder types */}
      <div style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h3>🎨 Test 3: Placeholder Types</h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <h4>Blur Placeholder</h4>
            <OptimizedImage
              src="/uploads/products/test-sample-image.jpg"
              alt="Blur placeholder test"
              width={150}
              height={150}
              priority={false}
              placeholder="blur"
            />
          </div>
          <div>
            <h4>Skeleton Placeholder</h4>
            <OptimizedImage
              src="/uploads/products/test-sample-image.jpg"
              alt="Skeleton placeholder test"
              width={150}
              height={150}
              priority={false}
              placeholder="skeleton"
            />
          </div>
        </div>
      </div>

      {/* Test 4: Image Gallery */}
      <div style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h3>🖼️ Test 4: Image Gallery Component</h3>
        <OptimizedImageGallery
          images={testImages.slice(0, 2)} // Only valid images
          currentIndex={0}
          onIndexChange={(index) => console.log(`[TEST] Gallery index changed to: ${index}`)}
          className="max-w-md"
        />
      </div>

      {/* Test 5: Lazy loading (far down the page) */}
      <div style={{ marginTop: '1000px', marginBottom: '30px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h3>⏳ Test 5: Lazy Loading (Scroll to see this)</h3>
        <p>This image should only load when scrolled into view</p>
        <OptimizedImage
          src="/uploads/products/test-valid-image.jpg"
          alt="Test lazy loading"
          width={200}
          height={200}
          priority={false}
          placeholder="skeleton"
          onLoad={() => handleImageLoad('lazyLoading')}
          onError={() => handleImageError('lazyLoading')}
        />
        <p><small>Check console for lazy loading logs</small></p>
      </div>

      {/* Test 6: Performance monitoring */}
      <div style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h3>⚡ Test 6: Performance Monitoring</h3>
        <p>Multiple images to test loading performance</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px' }}>
          {[1, 2, 3, 4].map(i => (
            <OptimizedImage
              key={i}
              src="/uploads/products/test-valid-image.jpg"
              alt={`Performance test ${i}`}
              width={100}
              height={100}
              priority={i <= 2}
              placeholder="blur"
              onLoad={() => console.log(`[PERF] Image ${i} loaded`)}
            />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '50px' }}>
        <h3>📝 Testing Instructions</h3>
        <ol>
          <li>Open browser developer console to see detailed logs</li>
          <li>Check that valid images load successfully</li>
          <li>Verify that invalid images show fallback and trigger health checks</li>
          <li>Scroll down to test lazy loading functionality</li>
          <li>Observe different placeholder types during loading</li>
          <li>Test image gallery navigation</li>
          <li>Monitor performance logs for multiple images</li>
        </ol>
      </div>
    </div>
  );
};

export default ImageTest;