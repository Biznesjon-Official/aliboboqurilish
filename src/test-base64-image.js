// Test base64 image handling
import React from 'react';
import OptimizedImage from './components/OptimizedImage';

// Test data similar to your MongoDB data
const testProduct = {
  "_id": "68b1886bd08c1f564b6c2c4b",
  "name": "Manetti potal 500",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZ", // Incomplete base64
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSk", // Incomplete base64
    "data:image/jpeg;base64,/9j/4AAQSk"  // Incomplete base64
  ]
};

// Valid base64 image for testing (1x1 pixel red image)
const validBase64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

const TestBase64Images = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Base64 Image Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Incomplete Base64 Image (from MongoDB):</h3>
        <OptimizedImage
          src={testProduct.image}
          alt="Test incomplete base64"
          width={200}
          height={200}
          fallbackSrc="/assets/default-product.svg"
        />
        <p>Source: {testProduct.image}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Valid Base64 Image:</h3>
        <OptimizedImage
          src={validBase64Image}
          alt="Test valid base64"
          width={200}
          height={200}
          fallbackSrc="/assets/default-product.svg"
        />
        <p>Source: {validBase64Image.substring(0, 50)}...</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>File Path Image (should work):</h3>
        <OptimizedImage
          src="/uploads/products/test-valid-image.jpg"
          alt="Test file path"
          width={200}
          height={200}
          fallbackSrc="/assets/default-product.svg"
        />
        <p>Source: /uploads/products/test-valid-image.jpg</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Non-existent Image (should show fallback):</h3>
        <OptimizedImage
          src="/uploads/products/non-existent.jpg"
          alt="Test non-existent"
          width={200}
          height={200}
          fallbackSrc="/assets/default-product.svg"
        />
        <p>Source: /uploads/products/non-existent.jpg</p>
      </div>
    </div>
  );
};

export default TestBase64Images;