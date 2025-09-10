import React, { useState, useEffect } from 'react';
import socketService from '../services/SocketService';
import { queryClient } from '../lib/queryClient';

const DiagnosticPanel = ({ isVisible, onToggle }) => {
  const [socketStatus, setSocketStatus] = useState({});
  const [queryCache, setQueryCache] = useState({});
  const [systemMetrics, setSystemMetrics] = useState({});
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds instead of 5 seconds
  const [healthCheckResult, setHealthCheckResult] = useState(null);
  const [isTestingHealth, setIsTestingHealth] = useState(false);

  // Update socket status (reduced frequency)
  useEffect(() => {
    const updateSocketStatus = () => {
      setSocketStatus(socketService.getConnectionStatus());
    };

    updateSocketStatus();
    const interval = setInterval(updateSocketStatus, 10000); // 10 seconds instead of 1 second
    return () => clearInterval(interval);
  }, []);

  // Update query cache info
  useEffect(() => {
    const updateQueryCache = () => {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      
      setQueryCache({
        totalQueries: queries.length,
        staleQueries: queries.filter(q => q.isStale()).length,
        activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
        errorQueries: queries.filter(q => q.state.error).length,
      });
    };

    updateQueryCache();
    const interval = setInterval(updateQueryCache, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Update system metrics
  useEffect(() => {
    const updateSystemMetrics = () => {
      setSystemMetrics({
        timestamp: new Date().toLocaleTimeString(),
        userAgent: navigator.userAgent.substring(0, 50) + '...',
        memory: performance.memory ? {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
        } : null,
        url: window.location.href,
      });
    };

    updateSystemMetrics();
    const interval = setInterval(updateSystemMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const clearQueryCache = () => {
    queryClient.clear();
    console.log('🧹 Query cache cleared');
  };

  const invalidateAllQueries = () => {
    queryClient.invalidateQueries();
    console.log('🔄 All queries invalidated');
  };

  const reconnectSocket = () => {
    socketService.disconnect();
    setTimeout(() => {
      socketService.initialize();
    }, 1000);
    console.log('🔗 Socket reconnecting...');
  };

  const testHealthCheck = async () => {
    setIsTestingHealth(true);
    setHealthCheckResult(null);
    
    try {
      const result = await socketService.performHealthCheck();
      setHealthCheckResult({
        success: true,
        latency: result.latency,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      setHealthCheckResult({
        success: false,
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setIsTestingHealth(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white p-4 rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
        <h3 className="text-lg font-bold text-green-400">🔧 Diagnostic Panel</h3>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-white text-xl"
        >
          ×
        </button>
      </div>

      {/* Socket Status */}
      <div className="mb-4">
        <h4 className="font-semibold text-blue-400 mb-2">📡 Socket Status</h4>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Connected:</span>
            <span className={socketStatus.isConnected ? 'text-green-400' : 'text-red-400'}>
              {socketStatus.isConnected ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Reconnect Attempts:</span>
            <span>{socketStatus.reconnectAttempts}</span>
          </div>
          <div className="flex justify-between">
            <span>Socket ID:</span>
            <span className="text-xs">{socketStatus.socketId || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span>Transport:</span>
            <span className="text-xs">{socketStatus.transport || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span>Upgraded:</span>
            <span className={socketStatus.upgraded ? 'text-green-400' : 'text-yellow-400'}>
              {socketStatus.upgraded ? '✅ Yes' : '⚠️ No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Max Attempts:</span>
            <span>{socketStatus.maxReconnectAttempts}</span>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={reconnectSocket}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
            >
              🔄 Reconnect
            </button>
            <button
              onClick={testHealthCheck}
              disabled={isTestingHealth || !socketStatus.isConnected}
              className="px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-xs"
            >
              {isTestingHealth ? '⏳ Testing...' : '🏓 Ping Test'}
            </button>
          </div>
          {healthCheckResult && (
            <div className={`mt-2 p-2 rounded text-xs ${
              healthCheckResult.success ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
            }`}>
              {healthCheckResult.success ? (
                <span>✅ Healthy ({healthCheckResult.latency}ms) at {healthCheckResult.timestamp}</span>
              ) : (
                <span>❌ Error: {healthCheckResult.error} at {healthCheckResult.timestamp}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Query Cache Status */}
      <div className="mb-4">
        <h4 className="font-semibold text-purple-400 mb-2">💾 Query Cache</h4>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Total Queries:</span>
            <span>{queryCache.totalQueries}</span>
          </div>
          <div className="flex justify-between">
            <span>Stale Queries:</span>
            <span className="text-yellow-400">{queryCache.staleQueries}</span>
          </div>
          <div className="flex justify-between">
            <span>Active Queries:</span>
            <span className="text-green-400">{queryCache.activeQueries}</span>
          </div>
          <div className="flex justify-between">
            <span>Error Queries:</span>
            <span className="text-red-400">{queryCache.errorQueries}</span>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={clearQueryCache}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
            >
              🧹 Clear Cache
            </button>
            <button
              onClick={invalidateAllQueries}
              className="px-2 py-1 bg-orange-600 hover:bg-orange-700 rounded text-xs"
            >
              🔄 Invalidate All
            </button>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="mb-4">
        <h4 className="font-semibold text-green-400 mb-2">📊 System Metrics</h4>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Last Update:</span>
            <span>{systemMetrics.timestamp}</span>
          </div>
          {systemMetrics.memory && (
            <>
              <div className="flex justify-between">
                <span>Memory Used:</span>
                <span>{systemMetrics.memory.used} MB</span>
              </div>
              <div className="flex justify-between">
                <span>Memory Total:</span>
                <span>{systemMetrics.memory.total} MB</span>
              </div>
              <div className="flex justify-between">
                <span>Memory Limit:</span>
                <span>{systemMetrics.memory.limit} MB</span>
              </div>
            </>
          )}
          <div className="text-xs text-gray-400 mt-2">
            <span>URL: {systemMetrics.url}</span>
          </div>
        </div>
      </div>

      {/* Refresh Rate Control */}
      <div className="border-t border-gray-700 pt-2">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Refresh Interval (ms)
        </label>
        <select
          value={refreshInterval}
          onChange={(e) => setRefreshInterval(Number(e.target.value))}
          className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm"
        >
          <option value={1000}>1 second</option>
          <option value={5000}>5 seconds</option>
          <option value={10000}>10 seconds</option>
          <option value={30000}>30 seconds</option>
        </select>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-500 mt-3 border-t border-gray-700 pt-2">
        Press <kbd className="bg-gray-800 px-1 rounded">Ctrl+Shift+D</kbd> to toggle
      </div>
    </div>
  );
};

export default DiagnosticPanel;