/**
 * Stock Update Debugger - Comprehensive debugging tool for real-time stock updates
 * Use this to identify exactly where stock updates are failing
 */

class StockUpdateDebugger {
  constructor() {
    this.logs = [];
    this.isEnabled = process.env.NODE_ENV === 'development';
    this.startTime = Date.now();
    
    if (this.isEnabled) {
      this.initialize();
    }
  }

  initialize() {
    console.log('🕵️‍♂️ Stock Update Debugger initialized');
    
    // Override console methods to capture logs
    this.captureConsoleLogs();
    
    // Monitor Socket.IO events
    this.monitorSocketEvents();
    
    // Monitor React Query events
    this.monitorReactQueryEvents();
    
    // Monitor DOM events
    this.monitorDOMEvents();
    
    // Monitor localStorage changes
    this.monitorStorageEvents();
    
    // Expose debug methods globally
    window.stockDebugger = this;
    
    // Add helpful console commands
    window.testStock = (productId, newStock) => this.simulateStockUpdate(productId, newStock);
    window.checkSocket = () => this.testSocketConnection();
    window.stockReport = () => this.generateReport();
    window.stockLogs = () => this.getRecentLogs();
    window.forceRefreshNow = () => {
      console.log('🔄 Force refreshing all caches NOW...');
      if (window.queryClient) {
        window.queryClient.removeQueries({ queryKey: ['products'], exact: false });
        window.queryClient.refetchQueries({ queryKey: ['products'], exact: false, type: 'all' });
      }
      if (window.forceRefreshAllStocks) {
        window.forceRefreshAllStocks();
      }
    };
    
    console.log('🕵️‍♂️ Stock Debug Commands Available:');
    console.log('  - testStock(productId, newStock) - Simulate stock update');
    console.log('  - checkSocket() - Test socket connection');
    console.log('  - stockReport() - Generate debug report');
    console.log('  - stockLogs() - Show recent logs');
    console.log('  - forceRefreshNow() - Force immediate cache refresh');
  }

  log(level, category, message, data = null) {
    const timestamp = Date.now() - this.startTime;
    const logEntry = {
      timestamp,
      level,
      category,
      message,
      data: data ? JSON.stringify(data, null, 2) : null,
      time: new Date().toLocaleTimeString()
    };
    
    this.logs.push(logEntry);
    
    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
    
    const emoji = this.getLevelEmoji(level);
    const color = this.getLevelColor(level);
    
    console.log(
      `%c${emoji} [${category}] ${message}`, 
      `color: ${color}; font-weight: bold;`,
      data || ''
    );
  }

  getLevelEmoji(level) {
    const emojis = {
      'info': 'ℹ️',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌',
      'debug': '🔍'
    };
    return emojis[level] || 'ℹ️';
  }

  getLevelColor(level) {
    const colors = {
      'info': '#2196F3',
      'success': '#4CAF50',
      'warning': '#FF9800',
      'error': '#F44336',
      'debug': '#9C27B0'
    };
    return colors[level] || '#000000';
  }

  captureConsoleLogs() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = (...args) => {
      if (args[0] && typeof args[0] === 'string') {
        if (args[0].includes('📦 Stock update received:')) {
          this.log('success', 'SOCKET', 'Stock update received from backend', args[1]);
        } else if (args[0].includes('✅ Connected to Socket.IO server')) {
          this.log('success', 'SOCKET', 'Connected to Socket.IO server');
        } else if (args[0].includes('❌ Disconnected from Socket.IO server')) {
          this.log('error', 'SOCKET', 'Disconnected from Socket.IO server');
        }
      }
      originalLog.apply(console, args);
    };
    
    console.error = (...args) => {
      if (args[0] && typeof args[0] === 'string') {
        if (args[0].includes('Socket connection error')) {
          this.log('error', 'SOCKET', 'Socket connection error', args[1]);
        }
      }
      originalError.apply(console, args);
    };
  }

  monitorSocketEvents() {
    // Monitor if Socket.IO is properly initialized
    setTimeout(() => {
      if (window.socketService) {
        const status = window.socketService.getConnectionStatus();
        this.log('info', 'SOCKET', 'Socket service status', status);
      } else {
        this.log('error', 'SOCKET', 'Socket service not found on window');
      }
    }, 1000);
  }

  monitorReactQueryEvents() {
    // Monitor React Query cache updates
    setTimeout(() => {
      if (window.queryClient) {
        this.log('info', 'REACT_QUERY', 'Query client found');
        
        // Monitor cache changes
        const cache = window.queryClient.getQueryCache();
        cache.subscribe((event) => {
          if (event.type === 'updated' && event.query.queryKey.includes('products')) {
            this.log('info', 'REACT_QUERY', 'Product cache updated', {
              queryKey: event.query.queryKey,
              state: event.query.state.status
            });
          }
        });
      } else {
        this.log('error', 'REACT_QUERY', 'Query client not found on window');
      }
    }, 1000);
  }

  monitorDOMEvents() {
    // Monitor custom DOM events
    window.addEventListener('stockUpdate', (event) => {
      this.log('success', 'DOM_EVENT', 'Stock update DOM event fired', event.detail);
    });
    
    window.addEventListener('forceStockRefresh', (event) => {
      this.log('info', 'DOM_EVENT', 'Force stock refresh event fired');
    });
  }

  monitorStorageEvents() {
    // Monitor localStorage changes
    window.addEventListener('storage', (event) => {
      if (event.key && event.key.startsWith('stock_')) {
        this.log('info', 'STORAGE', 'Stock localStorage updated', {
          key: event.key,
          oldValue: event.oldValue,
          newValue: event.newValue
        });
      }
    });
  }

  // Debug methods accessible from browser console
  getConnectionStatus() {
    if (window.socketService) {
      return window.socketService.getConnectionStatus();
    }
    return { error: 'Socket service not available' };
  }

  testSocketConnection() {
    this.log('info', 'TEST', 'Testing socket connection...');
    
    if (window.socketService && window.socketService.performHealthCheck) {
      window.socketService.performHealthCheck()
        .then((result) => {
          this.log('success', 'TEST', 'Socket health check passed', result);
        })
        .catch((error) => {
          this.log('error', 'TEST', 'Socket health check failed', error.message);
        });
    } else {
      this.log('error', 'TEST', 'Socket service or health check method not available');
    }
  }

  simulateStockUpdate(productId, newStock) {
    this.log('info', 'TEST', `Simulating stock update for product ${productId} to ${newStock}`);
    
    const mockUpdate = {
      type: 'single_product',
      productId,
      newQuantity: newStock,
      stockDelta: -1,
      timestamp: new Date().toISOString(),
      orderId: 'debug_test_' + Date.now()
    };
    
    // Simulate socket event
    if (window.socketService) {
      window.socketService.emit('stockUpdate', mockUpdate);
      this.log('success', 'TEST', 'Simulated socket event emitted');
    } else {
      this.log('error', 'TEST', 'Socket service not available for simulation');
    }
  }

  getCacheDump() {
    if (window.queryClient) {
      const cache = window.queryClient.getQueryCache();
      const queries = cache.getAll();
      const productQueries = queries.filter(q => 
        q.queryKey.some(key => typeof key === 'string' && key.includes('products'))
      );
      
      return productQueries.map(q => ({
        queryKey: q.queryKey,
        status: q.state.status,
        data: q.state.data ? 'has data' : 'no data',
        error: q.state.error?.message || null,
        lastUpdated: q.state.dataUpdatedAt ? new Date(q.state.dataUpdatedAt).toLocaleTimeString() : null
      }));
    }
    return { error: 'Query client not available' };
  }

  getRecentLogs(count = 20) {
    return this.logs.slice(-count);
  }

  clearLogs() {
    this.logs = [];
    this.log('info', 'DEBUG', 'Logs cleared');
  }

  // Test if stock updates are reaching components
  testComponentUpdates(productId) {
    this.log('info', 'TEST', `Testing component updates for product ${productId}`);
    
    // Check if product is in any cached queries
    const cacheDump = this.getCacheDump();
    const relevantQueries = cacheDump.filter(q => 
      q.queryKey.includes(productId) || 
      q.queryKey.some(key => key === 'products' || key === 'list')
    );
    
    this.log('info', 'TEST', `Found ${relevantQueries.length} relevant cached queries`, relevantQueries);
    
    return relevantQueries;
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      socketStatus: this.getConnectionStatus(),
      recentLogs: this.getRecentLogs(10),
      cacheStatus: this.getCacheDump(),
      totalLogs: this.logs.length
    };
    
    console.group('🕵️‍♂️ Stock Update Debug Report');
    console.log('Socket Status:', report.socketStatus);
    console.log('Recent Logs:', report.recentLogs);
    console.log('Cache Status:', report.cacheStatus);
    console.groupEnd();
    
    return report;
  }
}

// Initialize debugger
const stockUpdateDebugger = new StockUpdateDebugger();

export default stockUpdateDebugger;