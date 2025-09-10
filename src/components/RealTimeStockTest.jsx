import React, { useState } from 'react';
import { useStockMonitor } from '../hooks/useRealTimeStock';

/**
 * Test component for verifying real-time stock updates
 * This component provides a simple interface to test stock update functionality
 */
const RealTimeStockTest = ({ productId = null }) => {
  const [testProductId, setTestProductId] = useState(productId || '');
  const [testStock, setTestStock] = useState(10);
  const [testVariant, setTestVariant] = useState('');
  const [logs, setLogs] = useState([]);

  // Initialize stock monitoring with debug enabled
  const { isConnected, connectionStatus } = useStockMonitor(true);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]); // Keep last 20 logs
  };

  // Simulate a stock update (this would normally come from backend)
  const simulateStockUpdate = () => {
    if (!testProductId) {
      addLog('❌ Please enter a product ID first');
      return;
    }

    // Simulate receiving a stock update via WebSocket
    // In real scenario, this would come from backend when an order is placed
    const mockStockUpdate = {
      type: 'single_product',
      productId: testProductId,
      newQuantity: testStock,
      stockDelta: -1, // Simulate decrease by 1
      variantOption: testVariant || null,
      timestamp: new Date().toISOString(),
      orderId: 'test_order_' + Date.now()
    };

    addLog(`📦 Simulating stock update for product ${testProductId}: ${testStock} items`);
    
    // This simulates what would happen when backend emits stock update
    window.dispatchEvent(new CustomEvent('test-stock-update', { 
      detail: mockStockUpdate 
    }));
  };

  const simulateOrderPlacement = () => {
    if (!testProductId) {
      addLog('❌ Please enter a product ID first');
      return;
    }

    const newStock = Math.max(0, testStock - 1);
    setTestStock(newStock);

    const mockStockUpdate = {
      type: 'single_product',
      productId: testProductId,
      newQuantity: newStock,
      stockDelta: -1,
      variantOption: testVariant || null,
      timestamp: new Date().toISOString(),
      orderId: 'test_order_' + Date.now()
    };

    addLog(`🛒 Simulating order placement - stock decreased to ${newStock}`);
    
    // Simulate the real-time update that would come from backend
    window.dispatchEvent(new CustomEvent('test-stock-update', { 
      detail: mockStockUpdate 
    }));
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        🧪 Real-Time Stock Update Test
      </h2>
      
      {/* Connection Status */}
      <div className="mb-4 p-3 rounded-lg bg-gray-50">
        <h3 className="font-semibold text-sm mb-2">Connection Status</h3>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {connectionStatus?.socketId && (
            <span className="text-xs text-gray-500 ml-2">
              Socket ID: {connectionStatus.socketId.slice(0, 8)}...
            </span>
          )}
        </div>
      </div>

      {/* Test Controls */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product ID (from your database)
          </label>
          <input
            type="text"
            value={testProductId}
            onChange={(e) => setTestProductId(e.target.value)}
            placeholder="Enter product ID to test..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Quantity
            </label>
            <input
              type="number"
              value={testStock}
              onChange={(e) => setTestStock(Number(e.target.value))}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variant (optional)
            </label>
            <input
              type="text"
              value={testVariant}
              onChange={(e) => setTestVariant(e.target.value)}
              placeholder="e.g., Red, Large..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={simulateStockUpdate}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            disabled={!isConnected}
          >
            📦 Simulate Stock Update
          </button>
          
          <button
            onClick={simulateOrderPlacement}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            disabled={!isConnected}
          >
            🛒 Simulate Order Placement
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-sm text-blue-800 mb-2">How to test:</h3>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Make sure the backend server is running on port 5000</li>
          <li>2. Enter a real product ID from your database</li>
          <li>3. Click "Simulate Order Placement" to see real-time stock updates</li>
          <li>4. Watch the ModernProductCard components update automatically</li>
          <li>5. Check the logs below to see the update flow</li>
        </ol>
      </div>

      {/* Logs */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm text-gray-700">Test Logs</h3>
          <button
            onClick={clearLogs}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        </div>
        <div className="bg-gray-900 text-green-400 p-3 rounded-md h-48 overflow-y-auto font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet. Try simulating a stock update...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Real-time status indicator */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Real-time stock monitoring is {isConnected ? '✅ active' : '❌ inactive'}
        {isConnected && ' - Stock updates will be applied automatically to all product cards'}
      </div>
    </div>
  );
};

export default RealTimeStockTest;