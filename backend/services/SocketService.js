const { Server } = require('socket.io');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedClients = new Map();
    this.isInitialized = false;
  }

  initialize(httpServer) {
    if (this.isInitialized) {
      console.log('🔗 Socket.IO already initialized');
      return this.io;
    }

    try {
      // Initialize Socket.IO server with optimized configuration for network latency
      this.io = new Server(httpServer, {
        cors: {
          origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
          methods: ['GET', 'POST'],
          credentials: true,
        },
        transports: ['polling', 'websocket'],
        allowEIO3: true, // Support older clients
        pingTimeout: 120000, // Increased from 60s to 120s for high latency
        pingInterval: 30000, // Increased from 25s to 30s
        upgradeTimeout: 30000, // Increased from 10s to 30s for slow networks
        maxHttpBufferSize: 1e6, // 1MB
        connectTimeout: 60000, // 60 second connection timeout
        serveClient: false, // Don't serve client files
        httpCompression: true, // Enable compression for better performance
        compression: true,
      });

      this.setupEventHandlers();
      this.isInitialized = true;
      
      if (process.env.DEBUG === 'true') {
        console.log('✅ Socket.IO server initialized successfully');
      }
      return this.io;
    } catch (error) {
      console.error('❌ Failed to initialize Socket.IO server:', error);
      throw error;
    }
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      if (process.env.DEBUG === 'true') {
        console.log(`🔗 Client connected: ${socket.id}`);
      }
      
      // Store client connection info
      this.connectedClients.set(socket.id, {
        id: socket.id,
        connectedAt: new Date(),
        userAgent: socket.handshake.headers['user-agent'],
        address: socket.handshake.address,
      });

      // Handle client events
      socket.on('join_admin', () => {
        socket.join('admin');
        if (process.env.DEBUG === 'true') {
          console.log(`👤 Client ${socket.id} joined admin room`);
        }
      });

      socket.on('leave_admin', () => {
        socket.leave('admin');
        if (process.env.DEBUG === 'true') {
          console.log(`👤 Client ${socket.id} left admin room`);
        }
      });

      socket.on('ping', (callback) => {
        if (callback) {
          callback('pong');
          if (process.env.DEBUG === 'true') {
            console.log(`🏓 Ping received from ${socket.id}`);
          }
        }
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        if (process.env.DEBUG === 'true') {
          console.log(`❌ Client disconnected: ${socket.id} (${reason})`);
        }
        this.connectedClients.delete(socket.id);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`❌ Socket error for ${socket.id}:`, error);
      });
    });

    // Connection error handling with detailed logging
    this.io.engine.on('connection_error', (err) => {
      console.error('❌ Socket.IO connection error:', {
        message: err.message,
        type: err.type || 'unknown',
        description: err.description || 'No description',
        context: err.context || 'No context'
      });
    });

    // Monitor connection health
    setInterval(() => {
      const stats = this.getConnectionStats();
      if (process.env.DEBUG === 'true' && stats.connectedClients > 0) {
        console.log(`📊 Socket.IO Status: ${stats.connectedClients} clients connected, ${stats.adminClients} admin clients`);
      }
    }, 60000); // Log every 60 seconds

    if (process.env.DEBUG === 'true') {
      console.log('📡 Socket.IO event handlers configured');
    }
  }

  // Emit stock update to all connected clients
  emitStockUpdate(productId, stockDelta, newQuantity, orderId = null, variantOption = null) {
    if (!this.io) {
      console.warn('⚠️ Socket.IO not initialized, cannot emit stock update');
      return;
    }

    const payload = {
      productId,
      stockDelta, // Positive for increase, negative for decrease
      newQuantity,
      orderId,
      variantOption, // For variant products
      timestamp: new Date().toISOString(),
      type: 'single_product'
    };

    this.io.emit('stockUpdate', payload);
    if (process.env.DEBUG === 'true') {
      console.log('📦 Stock update emitted:', payload);
    }
  }

  // Emit bulk stock updates for multiple products (e.g., when order contains multiple items)
  emitBulkStockUpdate(updates, orderId = null) {
    if (!this.io) {
      console.warn('⚠️ Socket.IO not initialized, cannot emit bulk stock update');
      return;
    }

    const payload = {
      updates, // Array of { productId, stockDelta, newQuantity, variantOption }
      orderId,
      timestamp: new Date().toISOString(),
      type: 'bulk_update'
    };

    this.io.emit('stockUpdate', payload);
    if (process.env.DEBUG === 'true') {
      console.log('📦 Bulk stock update emitted:', payload);
    }
  }

  // Emit new order notification to admin
  emitNewOrder(orderData) {
    if (!this.io) {
      console.warn('⚠️ Socket.IO not initialized, cannot emit new order');
      return;
    }

    const payload = {
      ...orderData,
      timestamp: new Date().toISOString(),
    };

    this.io.to('admin').emit('newOrder', payload);
    if (process.env.DEBUG === 'true') {
      console.log('🛒 New order emitted to admin:', payload);
    }
  }

  // Emit order status update
  emitOrderStatusUpdate(data) {
    if (!this.io) {
      console.warn('⚠️ Socket.IO not initialized, cannot emit order status update');
      return;
    }

    const payload = {
      ...data,
      timestamp: new Date().toISOString(),
    };

    this.io.emit('orderStatusUpdate', payload);
    if (process.env.DEBUG === 'true') {
      console.log('📋 Order status update emitted:', payload);
    }
  }

  // Emit order update events (creation, status change, etc.)
  emitOrderUpdate(orderId, status, timestamp = null) {
    if (!this.io) {
      console.warn('⚠️ Socket.IO not initialized, cannot emit order update');
      return;
    }

    const payload = {
      orderId,
      status,
      timestamp: timestamp || new Date().toISOString(),
      type: 'order_update'
    };

    this.io.emit('orderUpdate', payload);
    this.io.to('admin').emit('orderUpdate', payload); // Also send to admin room
    if (process.env.DEBUG === 'true') {
      console.log('📋 Order update emitted:', payload);
    }
  }

  // Emit product update (for non-stock changes like price, name, etc.)
  emitProductUpdate(data) {
    if (!this.io) {
      console.warn('⚠️ Socket.IO not initialized, cannot emit product update');
      return;
    }

    const payload = {
      ...data,
      timestamp: new Date().toISOString(),
    };

    this.io.emit('productUpdate', payload);
    if (process.env.DEBUG === 'true') {
      console.log('📦 Product update emitted:', payload);
    }
  }

  // Emit low stock alerts for admin
  emitLowStockAlert(productId, productName, currentStock, threshold = 5, variantOption = null) {
    if (!this.io) {
      console.warn('⚠️ Socket.IO not initialized, cannot emit low stock alert');
      return;
    }

    const payload = {
      productId,
      productName,
      currentStock,
      threshold,
      variantOption,
      timestamp: new Date().toISOString(),
      type: 'low_stock_alert'
    };

    this.io.to('admin').emit('lowStockAlert', payload);
    if (process.env.DEBUG === 'true') {
      console.log('⚠️ Low stock alert emitted to admin:', payload);
    }
  }

  // Emit notification to specific user or all
  emitNotification(notification, userId = null) {
    if (!this.io) {
      console.warn('⚠️ Socket.IO not initialized, cannot emit notification');
      return;
    }

    const payload = {
      ...notification,
      timestamp: new Date().toISOString(),
    };

    if (userId) {
      // Send to specific user (if you implement user-specific rooms)
      this.io.to(`user_${userId}`).emit('notification', payload);
    } else {
      // Send to all connected clients
      this.io.emit('notification', payload);
    }

    if (process.env.DEBUG === 'true') {
      console.log('🔔 Notification emitted:', payload);
    }
  }

  // Get connection statistics
  getConnectionStats() {
    if (!this.io) {
      return {
        isInitialized: false,
        connectedClients: 0,
        adminClients: 0,
      };
    }

    const adminSockets = this.io.sockets.adapter.rooms.get('admin');
    
    return {
      isInitialized: this.isInitialized,
      connectedClients: this.connectedClients.size,
      adminClients: adminSockets ? adminSockets.size : 0,
      clients: Array.from(this.connectedClients.values()),
    };
  }

  // Broadcast to all clients
  broadcast(event, data) {
    if (!this.io) {
      console.warn(`⚠️ Socket.IO not initialized, cannot broadcast ${event}`);
      return;
    }

    const payload = {
      ...data,
      timestamp: new Date().toISOString(),
    };

    this.io.emit(event, payload);
    if (process.env.DEBUG === 'true') {
      console.log(`📡 Broadcasted ${event}:`, payload);
    }
  }

  // Send to admin only
  sendToAdmin(event, data) {
    if (!this.io) {
      console.warn(`⚠️ Socket.IO not initialized, cannot send ${event} to admin`);
      return;
    }

    const payload = {
      ...data,
      timestamp: new Date().toISOString(),
    };

    this.io.to('admin').emit(event, payload);
    if (process.env.DEBUG === 'true') {
      console.log(`📡 Sent ${event} to admin:`, payload);
    }
  }

  // Cleanup and close connections
  close() {
    if (this.io) {
      this.io.close();
      this.io = null;
      this.connectedClients.clear();
      this.isInitialized = false;
      console.log('🔗 Socket.IO server closed');
    }
  }
}

// Export singleton instance
const socketService = new SocketService();
module.exports = socketService;