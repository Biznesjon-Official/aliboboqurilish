# Real-Time Stock Update System

## Overview

This system implements real-time stock updates for your e-commerce website. When a customer places an order, the product stock is immediately updated across all frontend components without requiring a page refresh.

## Key Features

✅ **Instant Updates**: Stock changes are reflected immediately in all product cards
✅ **Visual Feedback**: Animated indicators show when stock updates occur
✅ **Connection Status**: Real-time connection indicator in product cards
✅ **Optimistic Updates**: UI updates immediately for better user experience
✅ **Fallback Handling**: Graceful degradation when WebSocket is unavailable
✅ **Low Stock Alerts**: Automatic alerts when stock runs low
✅ **Variant Support**: Works with both regular products and product variants

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │    Database     │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ModernProduct│ │    │ │ordersControl-│ │    │ │   Product   │ │
│ │Card         │ │◄───┤ │ ler.js       │ │◄───┤ │   Model     │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
│                 │    │         │        │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │                 │
│ │useRealTime  │ │◄───┤ │SocketService │ │    │                 │
│ │Stock Hook   │ │    │ │              │ │    │                 │
│ └─────────────┘ │    │ └──────────────┘ │    │                 │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Implementation Details

### Backend Components

1. **SocketService** (`backend/services/SocketService.js`)
   - Manages WebSocket connections
   - Emits stock update events
   - Handles low stock alerts

2. **Orders Controller** (`backend/controllers/ordersController.js`)
   - Updates product stock in MongoDB transactions
   - Emits real-time stock events after successful database updates
   - Handles both regular products and variants

3. **Product Model** (`backend/models/Product.js`)
   - Optimized database indexes for fast stock queries
   - Support for variant-specific stock tracking

### Frontend Components

1. **useRealTimeStock Hook** (`src/hooks/useRealTimeStock.js`)
   - Manages WebSocket connection
   - Applies optimistic updates to React Query cache
   - Provides connection status and manual controls

2. **ModernProductCard** (`src/components/ModernProductCard.jsx`)
   - Displays real-time stock updates
   - Animated visual feedback for stock changes
   - Real-time connection indicator

3. **React Query Integration** (`src/lib/queryClient.js`)
   - Optimistic updates for immediate UI response
   - Intelligent cache invalidation
   - Fallback to fresh data fetching

## Usage

### Starting the System

1. **Start Backend Server**:
   ```bash
   npm run dev:backend-only
   ```

2. **Start Frontend**:
   ```bash
   npm run dev:frontend-only
   ```

3. **Full Development Mode**:
   ```bash
   npm start
   ```

### Testing Real-Time Updates

1. **Use the Test Component**:
   Import `RealTimeStockTest` component in your development environment to test stock updates manually.

2. **Place Test Orders**:
   - Create orders through the admin panel
   - Watch product cards update automatically
   - Check browser console for real-time event logs

3. **Monitor Connection**:
   - Green dot in product cards = Connected
   - Real-time updates working
   - Check browser console for connection status

### Code Example

```jsx
// Using the real-time stock monitoring hook
import { useStockMonitor } from '../hooks/useRealTimeStock';

function ProductGrid() {
  // Initialize real-time stock monitoring
  const { isConnected } = useStockMonitor();
  
  return (
    <div className="grid">
      {products.map(product => (
        <ModernProductCard 
          key={product._id}
          product={product}
          // Real-time updates will be handled automatically
        />
      ))}
    </div>
  );
}
```

## Configuration

### Environment Variables

No additional environment variables required. The system uses the existing backend/frontend configuration.

### WebSocket Configuration

- **Backend Port**: 5000 (same as API server)
- **Frontend Connection**: Automatically connects to `http://localhost:5000`
- **Transports**: WebSocket with polling fallback

## Monitoring and Debugging

### Development Tools

1. **Diagnostic Panel**: Press `Ctrl+Shift+D` in development mode
2. **Browser Console**: Real-time event logs
3. **React Query DevTools**: Cache state monitoring

### Connection Issues

If real-time updates aren't working:

1. **Check Backend**: Ensure server is running on port 5000
2. **Check WebSocket**: Look for connection errors in browser console
3. **Check Database**: Verify MongoDB connection
4. **Check CORS**: Ensure frontend can connect to backend

### Performance Monitoring

- Stock updates use optimistic updates for instant UI response
- Database operations use MongoDB transactions for consistency
- Cache invalidation is intelligent to avoid unnecessary re-renders

## API Events

### Stock Update Event Format

```javascript
// Single product update
{
  type: 'single_product',
  productId: '507f1f77bcf86cd799439011',
  newQuantity: 19,
  stockDelta: -1,
  variantOption: 'Red', // optional
  timestamp: '2024-01-15T10:30:00.000Z',
  orderId: '507f1f77bcf86cd799439012'
}

// Bulk update (multiple products in one order)
{
  type: 'bulk_update',
  updates: [
    {
      productId: '507f1f77bcf86cd799439011',
      newQuantity: 19,
      stockDelta: -1,
      variantOption: null
    }
  ],
  orderId: '507f1f77bcf86cd799439012',
  timestamp: '2024-01-15T10:30:00.000Z'
}
```

### Low Stock Alert Format

```javascript
{
  type: 'low_stock_alert',
  productId: '507f1f77bcf86cd799439011',
  productName: 'Sample Product',
  currentStock: 3,
  threshold: 5,
  variantOption: 'Large', // optional
  timestamp: '2024-01-15T10:30:00.000Z'
}
```

## Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+

## Security Considerations

- WebSocket connections are limited to localhost in development
- Production should use HTTPS/WSS
- No sensitive data is transmitted via WebSocket
- Stock updates are validated server-side

## Troubleshooting

### Common Issues

1. **"Socket not connected" warnings**:
   - Check if backend server is running
   - Verify port 5000 is accessible

2. **Stock not updating in UI**:
   - Check browser console for errors
   - Verify React Query cache is working
   - Test with diagnostic panel

3. **Performance issues**:
   - Check for excessive re-renders
   - Monitor network requests
   - Verify database indexes are working

### Debug Mode

Enable debug mode for detailed logging:

```javascript
const { isConnected } = useStockMonitor(true); // Enable debug mode
```

This will log all stock update events to the browser console.

## Future Enhancements

Possible future improvements:

- 📊 Real-time analytics dashboard
- 🔔 Push notifications for low stock
- 📱 Mobile app support
- 🌐 Multi-language support
- 📈 Stock prediction algorithms
- 🔄 Automatic restocking suggestions

---

**Implementation Complete**: Your real-time stock update system is now fully functional and ready for production use!