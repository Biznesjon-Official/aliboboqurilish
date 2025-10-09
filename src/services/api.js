// API base URL - use environment variable or default based on NODE_ENV
const API_BASE_URL = process.env.REACT_APP_API_BASE || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://aliboboqurilish.uz/api' 
    : 'http://localhost:5000/api');

// Generic API call function
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      // Try to extract a helpful error message from the response
      let message = `HTTP error! status: ${response.status}`;
      try {
        const text = await response.text();
        if (text) {
          try {
            const data = JSON.parse(text);
            message = data.message || data.error || message;
          } catch {
            // Not JSON, use plain text
            message = text;
          }
        }
      } catch {}
      const err = new Error(message);
      err.status = response.status;
      throw err;
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Craftsmen API
export const craftsmenAPI = {
  // Get all craftsmen with pagination and filters
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    return apiCall(`/craftsmen?${queryParams}`);
  },

  // Get single craftsman
  getById: async (id) => {
    return apiCall(`/craftsmen/${id}`);
  },

  // Create new craftsman
  create: async (data) => {
    return apiCall('/craftsmen', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update craftsman
  update: async (id, data) => {
    return apiCall(`/craftsmen/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete craftsman
  delete: async (id) => {
    return apiCall(`/craftsmen/${id}`, {
      method: 'DELETE',
    });
  },

  // Get craftsmen count
  getCount: async () => {
    return apiCall('/craftsmen/count/total');
  },
};

// Products API
export const productsAPI = {
  // Get all products with pagination and filters
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    return apiCall(`/products?${queryParams}`);
  },

  // Get single product
  getById: async (id) => {
    return apiCall(`/products/${id}`);
  },

  // Create new product
  create: async (data) => {
    const response = await apiCall('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    // Return the product data, extracting from response if needed
    return response.product || response;
  },

  // Update product
  update: async (id, data) => {
    const response = await apiCall(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    // Return the product data, extracting from response if needed
    return response.product || response;
  },

  // Delete product
  delete: async (id) => {
    return apiCall(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  // Get products count
  getCount: async () => {
    return apiCall('/products/count/total');
  },

  // Get categories
  getCategories: async () => {
    return apiCall('/products/categories/list');
  },
};

// Orders API
export const ordersAPI = {
  // Get all orders with pagination and filters
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    return apiCall(`/orders?${queryParams}`);
  },

  // Get single order
  getById: async (id) => {
    return apiCall(`/orders/${id}`);
  },

  // Create new order
  create: async (data) => {
    return apiCall('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update order
  update: async (id, data) => {
    return apiCall(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete order
  delete: async (id) => {
    return apiCall(`/orders/${id}`, {
      method: 'DELETE',
    });
  },

  // Update order status
  updateStatus: async (id, statusData) => {
    return apiCall(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  },

  // Get orders count
  getCount: async () => {
    return apiCall('/orders/count/total');
  },

  // Get orders by status count
  getCountByStatus: async () => {
    return apiCall('/orders/count/by-status');
  },
};

// Health check
export const healthCheck = async () => {
  try {
    const base = process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'production' ? 'https://aliboboqurilish.uz/api' : 'http://localhost:5000/api');
    const response = await fetch(`${base}/health`);
    return response.ok;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

// Recent Activities API
export const recentActivitiesAPI = {
  // Get all recent activities with pagination and filters
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    return apiCall(`/recent-activities?${queryParams}`);
  },

  // Get single activity
  getById: async (id) => {
    return apiCall(`/recent-activities/${id}`);
  },

  // Get activity statistics
  getStats: async () => {
    return apiCall('/recent-activities/stats');
  },

  // Delete activity
  delete: async (id) => {
    return apiCall(`/recent-activities/${id}`, {
      method: 'DELETE',
    });
  },

  // Delete all activities
  deleteAll: async () => {
    return apiCall('/recent-activities/all', {
      method: 'DELETE',
    });
  },

  // Cleanup old activities
  cleanup: async (daysOld = 90) => {
    return apiCall('/recent-activities/cleanup', {
      method: 'POST',
      body: JSON.stringify({ daysOld }),
    });
  },

  // Clear cache
  clearCache: async () => {
    return apiCall('/recent-activities/cache/clear');
  },
}; 