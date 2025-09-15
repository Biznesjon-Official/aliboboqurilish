import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10; // Increased from 5
    this.listeners = new Map();
    this.healthCheckInterval = null;
    this.lastSuccessfulPing = null;
    this.previousHealthCheckFailed = false; // Track health check failures
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  initialize() {
    if (this.socket) {
      // Already initialized; avoid noisy logs
      return;
    }

    try {
      // Use environment variables for socket URL
      const socketUrl = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_BASE?.replace(/\/api$/, '') || 'http://localhost:5000';
      
      console.log(`🔧 Initializing Socket.IO with URL: ${socketUrl}`);
      
      this.socket = io(socketUrl, {
        transports: ['polling', 'websocket'],
        timeout: 60000, // Increased from 20s to 60s
        reconnection: true,
        reconnectionDelay: 2000, // Increased from 1s to 2s
        reconnectionDelayMax: 10000, // Max delay between reconnection attempts
        maxReconnectionAttempts: 10, // Increased from 5 to 10
        randomizationFactor: 0.5, // Randomize reconnection delay
        forceNew: false,
        upgrade: true,
        rememberUpgrade: true,
        withCredentials: true, // Ensure credentials are sent with requests
        rejectUnauthorized: false // Accept self-signed certificates in development
        // Removed extraHeaders as they can cause CORS issues
      });

      this.setupEventListeners();
      this.startHealthMonitoring();
      console.log('🔗 Socket.IO initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Socket.IO:', error);
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('✅ Connected to Socket.IO server');
      
      // Send a ping to verify connection health
      this.socket.emit('ping', (response) => {
        if (response === 'pong') {
          console.log('🏓 Socket connection verified with ping/pong');
        }
      });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('❌ Disconnected from Socket.IO server:', reason);
      
      // Reset reconnect attempts on clean disconnect
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        this.reconnectAttempts = 0;
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.reconnectAttempts++;
      
      // Implement exponential backoff for connection errors
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        console.log(`🔄 Retrying connection in ${delay/1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      } else {
        console.warn('⚠️ Max reconnection attempts reached. Socket will retry automatically.');
      }
      
      // In development, if we keep failing, disable socket connection to prevent spam
      if (this.isDevelopment && this.reconnectAttempts > 5) {
        console.log('🔧 Development mode: Disabling socket connection to prevent spam');
        this.disconnect();
      }
    });

    // Stock update events
    this.socket.on('stockUpdate', (data) => {
      console.log('📦 Stock update received:', data);
      this.emit('stockUpdate', data);
    });

    // Low stock alerts (admin only)
    this.socket.on('lowStockAlert', (data) => {
      console.log('⚠️ Low stock alert received:', data);
      this.emit('lowStockAlert', data);
    });

    // Order events
    this.socket.on('newOrder', (data) => {
      console.log('🛒 New order received:', data);
      this.emit('newOrder', data);
    });

    this.socket.on('orderStatusUpdate', (data) => {
      console.log('📋 Order status updated:', data);
      this.emit('orderStatusUpdate', data);
    });

    this.socket.on('orderUpdate', (data) => {
      console.log('📋 Order update received:', data);
      this.emit('orderUpdate', data);
    });

    // Product events
    this.socket.on('productUpdate', (data) => {
      // console.log('📦 Product updated:', data);
      this.emit('productUpdate', data);
    });

    // Notification events
    this.socket.on('notification', (data) => {
      console.log('🔔 Notification received:', data);
      this.emit('notification', data);
    });
  }

  // Event emission to registered listeners
  emit(event, data) {
    const eventListeners = this.listeners.get(event) || [];
    eventListeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in socket event listener for ${event}:`, error);
      }
    });
  }

  // Register event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return cleanup function
    return () => this.off(event, callback);
  }

  // Remove event listener
  off(event, callback) {
    const eventListeners = this.listeners.get(event) || [];
    const index = eventListeners.indexOf(callback);
    if (index > -1) {
      eventListeners.splice(index, 1);
    }
  }

  // Join admin room for admin-specific events
  joinAdminRoom() {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_admin');
      console.log('👨‍💼 Joined admin room');
    }
  }

  // Leave admin room
  leaveAdminRoom() {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_admin');
      console.log('👨‍💼 Left admin room');
    }
  }

  // Emit event to server
  send(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('❌ Cannot send event: Socket not connected');
    }
  }

  // Get connection status with health check
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      socketId: this.socket?.id || null,
      transport: this.socket?.io?.engine?.transport?.name || null,
      upgraded: this.socket?.io?.engine?.upgraded || false,
    };
  }

  // Perform health check
  performHealthCheck() {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Health check timeout'));
      }, 5000);

      this.socket.emit('ping', (response) => {
        clearTimeout(timeout);
        if (response === 'pong') {
          resolve({ status: 'healthy', latency: Date.now() - startTime });
        } else {
          reject(new Error('Invalid ping response'));
        }
      });

      const startTime = Date.now();
    });
  }

  // Start periodic health monitoring
  startHealthMonitoring() {
    // Clear any existing interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Start health check every 5 minutes instead of 30 seconds
    this.healthCheckInterval = setInterval(() => {
      if (this.isConnected) {
        this.performHealthCheck()
          .then((result) => {
            this.lastSuccessfulPing = Date.now();
            // Only log health checks if there was a previous failure
            if (process.env.NODE_ENV === 'development' && this.previousHealthCheckFailed) {
              console.log(`🟢 Socket health check recovered (${result.latency}ms latency)`);
              this.previousHealthCheckFailed = false;
            }
          })
          .catch((error) => {
            if (!this.previousHealthCheckFailed) {
              console.warn('⚠️ Socket health check failed:', error.message);
              this.previousHealthCheckFailed = true;
            }
            // If health check fails multiple times, force reconnection
            if (this.lastSuccessfulPing && Date.now() - this.lastSuccessfulPing > 120000) {
              console.log('🔄 Forcing socket reconnection due to failed health checks');
              this.socket?.disconnect();
              this.socket?.connect();
            }
          });
      }
    }, 5 * 60 * 1000); // Check every 5 minutes instead of 30 seconds
  }

  // Stop health monitoring
  stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  // Disconnect socket
  disconnect() {
    this.stopHealthMonitoring();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
      console.log('🔗 Socket disconnected');
    }
  }
}

// Export singleton instance
const socketService = new SocketService();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  window.socketService = socketService;
}

export default socketService;