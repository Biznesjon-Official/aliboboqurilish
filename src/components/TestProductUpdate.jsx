import React, { useState, useEffect } from 'react';
import DirectProductForm from './admin/DirectProductForm';

const TestProductUpdate = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/products?limit=10');
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        setMessage({ type: 'error', text: 'Mahsulotlarni yuklashda xatolik' });
      }
    } catch (error) {
      console.error('Load products error:', error);
      setMessage({ type: 'error', text: 'Server bilan bog\'lanishda xatolik' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductSuccess = (result, action) => {
    setMessage({ 
      type: 'success', 
      text: `Mahsulot ${action === 'updated' ? 'yangilandi' : 'yaratildi'}: ${result.name || result.product?.name}` 
    });
    setSelectedProduct(null);
    loadProducts(); // Reload products list
  };

  const handleProductError = (error) => {
    setMessage({ type: 'error', text: error });
  };

  const handleCancel = () => {
    setSelectedProduct(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Mahsulot Yangilash Testi</h1>

      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
          <button 
            onClick={() => setMessage(null)}
            className="ml-2 text-sm underline"
          >
            Yopish
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products List */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Mavjud Mahsulotlar</h2>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-orange mx-auto"></div>
              <p className="mt-2 text-gray-600">Yuklanmoqda...</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {products.map((product) => (
                <div 
                  key={product._id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <h3 className="font-medium">{product.name}</h3>
                  <p className="text-sm text-gray-600">
                    {product.category} • {product.price?.toLocaleString()} so'm
                  </p>
                  <p className="text-xs text-gray-500">
                    Zaxira: {product.stock} {product.unit}
                  </p>
                </div>
              ))}
              
              {products.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  Mahsulotlar topilmadi
                </p>
              )}
            </div>
          )}

          {/* Add New Product Button */}
          <button
            onClick={() => setSelectedProduct({})}
            className="mt-4 w-full px-4 py-2 bg-primary-orange text-white rounded-md hover:bg-opacity-90 transition-colors"
          >
            Yangi Mahsulot Qo'shish
          </button>
        </div>

        {/* Product Form */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {selectedProduct?._id ? 'Mahsulotni Tahrirlash' : selectedProduct ? 'Yangi Mahsulot' : 'Mahsulot Tanlang'}
          </h2>
          
          {selectedProduct ? (
            <div className="border border-gray-200 rounded-lg p-4">
              <DirectProductForm
                product={selectedProduct}
                onSuccess={handleProductSuccess}
                onError={handleProductError}
                onCancel={handleCancel}
              />
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
              Tahrirlash uchun mahsulotni tanlang yoki yangi mahsulot qo'shing
            </div>
          )}
        </div>
      </div>

      {/* API Test Buttons */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">API Testlari</h3>
        <div className="flex space-x-4">
          <button
            onClick={loadProducts}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Mahsulotlarni Qayta Yuklash
          </button>
          
          <button
            onClick={async () => {
              try {
                const response = await fetch('http://localhost:5000/api/upload/test');
                const data = await response.json();
                setMessage({ type: 'success', text: `Upload API: ${data.message}` });
              } catch (error) {
                setMessage({ type: 'error', text: `Upload API xatoligi: ${error.message}` });
              }
            }}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            Upload API Testi
          </button>
          
          <button
            onClick={async () => {
              try {
                const response = await fetch('http://localhost:5000/api/health');
                const data = await response.json();
                setMessage({ type: 'success', text: `Backend: ${JSON.stringify(data)}` });
              } catch (error) {
                setMessage({ type: 'error', text: `Backend xatoligi: ${error.message}` });
              }
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
          >
            Backend Testi
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestProductUpdate;