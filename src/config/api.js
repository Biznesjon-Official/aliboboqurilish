/**
 * Centralized API configuration
 * Uses environment variables for all port and URL configuration
 */

// Get backend port from environment or use default
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || '5001';
const FRONTEND_PORT = process.env.REACT_APP_PORT || '3000';

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Get API base URL from environment or construct it
const getApiBase = () => {
  if (process.env.REACT_APP_API_BASE) {
    return process.env.REACT_APP_API_BASE.replace(/\/api$/, '');
  }
  
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL.replace(/\/api$/, '');
  }
  
  if (isProduction) {
    return 'https://aliboboqurilish.uz';
  }
  
  return `http://localhost:${BACKEND_PORT}`;
};

// Get Socket.IO URL
const getSocketUrl = () => {
  if (process.env.REACT_APP_SOCKET_URL) {
    return process.env.REACT_APP_SOCKET_URL;
  }
  
  if (isProduction) {
    return 'https://aliboboqurilish.uz';
  }
  
  return `http://localhost:${BACKEND_PORT}`;
};

// Debug logging
if (process.env.REACT_APP_DEBUG_MODE === 'true') {
  console.log('🔧 API Configuration loaded:', {
    REACT_APP_API_BASE: process.env.REACT_APP_API_BASE,
    REACT_APP_API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
    REACT_APP_SOCKET_URL: process.env.REACT_APP_SOCKET_URL,
    BACKEND_PORT
  });
}

export const API_BASE = getApiBase();
export const API_URL = `${API_BASE}/api`;
export const SOCKET_URL = getSocketUrl();
export const BACKEND_PORT_NUM = parseInt(BACKEND_PORT);
export const FRONTEND_PORT_NUM = parseInt(FRONTEND_PORT);

// Debug logging
if (process.env.REACT_APP_DEBUG_MODE === 'true') {
  console.log('🔧 API Configuration:', {
    API_BASE,
    API_URL,
    SOCKET_URL,
    BACKEND_PORT: BACKEND_PORT_NUM,
    FRONTEND_PORT: FRONTEND_PORT_NUM,
    NODE_ENV: process.env.NODE_ENV
  });
}

export default {
  API_BASE,
  API_URL,
  SOCKET_URL,
  BACKEND_PORT_NUM,
  FRONTEND_PORT_NUM
};
