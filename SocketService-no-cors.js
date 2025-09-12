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
        // Removed CORS configuration since we're handling it at the Nginx level
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
      this.isInitialized = false;
      return null;
    }
  }

  setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      // Track connected clients
      this.connectedClients.set(socket.id, {
        connectedAt: new Date().toISOString(),
        ip: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent']
      });

      if (process.env.DEBUG === 'true') {
        console.log(`🔌 Client connected: ${socket.id} (${this.connectedClients.size} total)`);
      }

      // Handle admin connections
      socket.on('joinAdmin', () => {
        socket.join('admin');
        if (process.env.DEBUG === 'true') {
          console.log(`🔐 Admin client joined: ${socket.id}`);
        }
      });

      // Handle client disconnections
      socket.on('disconnect', (reason) => {
        this.connectedClients.delete(socket.id);
        if (process.env.DEBUG === 'true') {
          console.log(`🔌 Client disconnected: ${socket.id} (${this.connectedClients.size} remaining) - Reason: ${reason}`);
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`❌ Socket error for client ${socket.id}:`, error);
      });
    });

    if (process.env.DEBUG === 'true') {
      console.log('✅ Socket.IO event handlers set up');
    }
  }

  // Emit stock update events
  emitStockUpdate(data) {
    if (!this.io) {
      console.warn('⚠️ Socket.IO not initialized, cannot emit stock update');
      return;
    }

    const payload = {
      ...data,
      timestamp: new Date().toISOString(),
    };

    this.io.emit('stockUpdate', payload);
    if (process.env.DEBUG === 'true') {
      console.log('📦 Stock update emitted:', payload);
    }
  }

  // Emit order status update events
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
  emitLowStockAlert(productId, currentStock, threshold, productName = null) {
    if (!this.io) {
      console.warn('⚠️ Socket.IO not initialized, cannot emit low stock alert');
      return;
    }

    const payload = {
      productId,
      currentStock,
      threshold,
      productName,
      timestamp: new Date().toISOString(),
      type: 'low_stock'
    };

    // Emit to admin room only
    this.io.to('admin').emit('lowStockAlert', payload);

    if (process.env.DEBUG === 'true') {
      console.log('⚠️ Low stock alert emitted to admin:', payload);
    }
  }

  // Emit notification to all clients or specific rooms
  emitNotification(data, room = null) {
    if (!this.io) {
      console.warn('⚠️ Socket.IO not initialized, cannot emit notification');
      return;
    }

    const payload = {
      ...data,
      timestamp: new Date().toISOString(),
    };

    if (room) {
      this.io.to(room).emit('notification', payload);
    } else {
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
        connectedClients: 0,
        adminClients: 0,
        isInitialized: false
      };
    }

    const connectedClients = this.connectedClients.size;
    const adminClients = this.io.sockets.adapter.rooms.get('admin')?.size || 0;
    return {
      connectedClients,
      adminClients,
      isInitialized: this.isInitialized
    };
  }

  // Disconnect all clients and close server
  close() {
    if (this.io) {
      // Disconnect all clients
      this.io.close();
      this.connectedClients.clear();
      this.isInitialized = false;

      if (process.env.DEBUG === 'true') {
        console.log('🔌 Socket.IO server closed');
      }
    }
  }
}

// Export singleton instance
const socketService = new SocketService();

// Expose to global scope for debugging
if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
  global.socketService = socketService;
}

module.exports = socketService;