// Test product images from API
import React, { useState, useEffect } from 'react';
import OptimizedImage from './components/OptimizedImage';

const TestProductImages = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products?limit=10');
        const data = await response.json();
        setProducts(data.products || []);
        console.log('Fetched products:', data.products);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Product Images Test</h2>
      <p>Testing {products.length} products with converted images</p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
        gap: '20px',
        marginTop: '20px'
      }}>
        {products.map((product) => (
          <div key={product._id} style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '15px',
            backgroundColor: '#f9f9f9'
          }}>
            <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>
              {product.name}
            </h3>
            
            <div style={{ marginBottom: '10px' }}>
              <strong>Main Image:</strong>
              <OptimizedImage
                src={product.image}
                alt={product.name}
                width={200}
                height={150}
                fallbackSrc="/assets/default-product.svg"
                priority={true}
                style={{ marginTop: '5px', border: '1px solid #ccc' }}
              />
              <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Path: {product.image || 'No image'}
              </p>
            </div>

            {product.images && product.images.length > 0 && (
              <div>
                <strong>Gallery Images ({product.images.length}):</strong>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '5px', 
                  marginTop: '5px' 
                }}>
                  {product.images.slice(0, 3).map((image, index) => (
                    <OptimizedImage
                      key={index}
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      width={60}
                      height={60}
                      fallbackSrc="/assets/default-product.svg"
                      style={{ border: '1px solid #ccc' }}
                    />
                  ))}
                  {product.images.length > 3 && (
                    <div style={{ 
                      width: '60px', 
                      height: '60px', 
                      border: '1px solid #ccc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#eee',
                      fontSize: '12px'
                    }}>
                      +{product.images.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
              <div>Price: {product.price?.toLocaleString()} so'm</div>
              <div>Stock: {product.stock}</div>
              <div>Category: {product.category}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
        <h3>Debug Information</h3>
        <p>Open browser console (F12) to see detailed image loading logs.</p>
        <p>Debug mode is enabled via REACT_APP_DEBUG_MODE=true</p>
      </div>
    </div>
  );
};

export default TestProductImages;