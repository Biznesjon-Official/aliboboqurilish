import React, { useState, useEffect } from 'react';
import { useStockMonitor } from '../hooks/useRealTimeStock';

const StockDebugPanel = ({ productId, visible = false }) => {
  const [stockHistory, setStockHistory] = useState([]);
  const [currentStock, setCurrentStock] = useState(null);
  const { isConnected } = useStockMonitor();

  useEffect(() => {
    if (!productId) return;

    const handleStockUpdate = (event) => {
      if (event.detail?.productId === productId) {
        const update = {
          timestamp: new Date().toLocaleTimeString(),
          oldStock: currentStock,
          newStock: event.detail.newQuantity,
          source: 'WebSocket'
        };
        setStockHistory(prev => [...prev.slice(-4), update]); // Keep last 5 updates
        setCurrentStock(event.detail.newQuantity);
      }
    };

    const handleStorageUpdate = () => {
      const stored = localStorage.getItem(`stock_${productId}`);
      if (stored) {
        const stockValue = parseInt(stored);
        if (stockValue !== currentStock) {
          const update = {
            timestamp: new Date().toLocaleTimeString(),
            oldStock: currentStock,
            newStock: stockValue,
            source: 'Storage'
          };
          setStockHistory(prev => [...prev.slice(-4), update]);
          setCurrentStock(stockValue);
        }
      }
    };

    // Initial stock check
    const initialStock = localStorage.getItem(`stock_${productId}`);
    if (initialStock) {
      setCurrentStock(parseInt(initialStock));
    }

    window.addEventListener('stockUpdate', handleStockUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    // Check storage every second
    const interval = setInterval(handleStorageUpdate, 1000);

    return () => {
      window.removeEventListener('stockUpdate', handleStockUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
      clearInterval(interval);
    };
  }, [productId, currentStock]);

  if (!visible || !productId) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-sm max-w-sm z-50">
      <div className="font-bold mb-2">
        📦 Stock Debug: {productId.slice(-8)}
      </div>
      <div className="mb-2">
        🔗 WebSocket: {isConnected ? '✅ Connected' : '❌ Disconnected'}
      </div>
      <div className="mb-2">
        📊 Current: {currentStock ?? 'Unknown'}
      </div>
      <div>
        📈 History:
        {stockHistory.length === 0 ? (
          <div className="text-gray-400 text-xs">No updates yet</div>
        ) : (
          stockHistory.map((update, index) => (
            <div key={index} className="text-xs">
              {update.timestamp}: {update.oldStock} → {update.newStock} ({update.source})
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StockDebugPanel;