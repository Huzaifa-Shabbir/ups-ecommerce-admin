const API_BASE_URL = "http://localhost:4000"; // Removed /api

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
};

// Helper function for API requests (matching working frontend pattern)
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Important for cookies
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    let errorData;
    if (contentType.includes('application/json')) {
      errorData = await response.json();
    } else {
      const text = await response.text().catch(() => '');
      throw new Error(`Server returned non-JSON response (status ${response.status}). ${text.slice(0, 200)}`);
    }
    // Backend returns { error: "..." } format
    const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  } else {
    const text = await response.text().catch(() => '');
    throw new Error(`Server returned non-JSON response (status ${response.status}). ${text.slice(0, 200)}`);
  }
};

// Auth API
export const authAPI = {
  login: async (identifier, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  },
};

// Products API
export const productsAPI = {
  getAll: async () => {
    const data = await apiRequest('/products');
    return Array.isArray(data) ? data : (data.products || []);
  },
  getById: async (id) => {
    const data = await apiRequest(`/products/${id}`);
    return data.product || data;
  },
  create: (data) => apiRequest('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/products/${id}`, { method: 'DELETE' }),
};

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    const data = await apiRequest('/categories');
    return Array.isArray(data) ? data : (data.categories || []);
  },
  getById: async (id) => {
    const data = await apiRequest(`/categories/${id}`);
    return data.category || data;
  },
  create: (data) => apiRequest('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/categories/${id}`, { method: 'DELETE' }),
};

// Orders API - FIXED ENDPOINTS
export const ordersAPI = {
  getAll: async () => {
    const data = await apiRequest('/orders');
    return Array.isArray(data) ? data : (data.orders || []);
  },
  getById: async (id) => {
    const data = await apiRequest(`/orders/${id}`);
    return data.order || data;
  },
  getDetail: async (id) => {
    const data = await apiRequest(`/orders/${id}/details`); // Fixed: /details not /detail
    return data.orderDetail || data;
  },
  getSummary: async () => {
    const data = await apiRequest('/orders/report'); // Fixed: /report not /summary
    return data.report || data;
  },
  getCustomerOrders: async (customerId) => {
    const data = await apiRequest(`/orders/customer/${customerId}`);
    return Array.isArray(data) ? data : (data.orders || []);
  },
  create: (data) => apiRequest('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id, status) => apiRequest(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  delete: (id) => apiRequest(`/orders/${id}`, { method: 'DELETE' }),
};

// Services API - FIXED ENDPOINTS
export const servicesAPI = {
  getAll: async () => {
    const data = await apiRequest('/services'); // Fixed: /services not /services/all
    return Array.isArray(data) ? data : (data.services || []);
  },
  getAvailable: async () => {
    const data = await apiRequest('/services/available');
    return Array.isArray(data) ? data : (data.services || []);
  },
  getById: async (id) => {
    const data = await apiRequest(`/services/${id}`);
    return data.service || data;
  },
  create: (data) => apiRequest('/services', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/services/${id}`, { method: 'DELETE' }),
};

// Payments API
export const paymentsAPI = {
  getAll: async () => {
    const data = await apiRequest('/payments');
    return Array.isArray(data) ? data : (data.payments || []);
  },
  getById: async (id) => {
    const data = await apiRequest(`/payments/${id}`);
    return data.payment || data;
  },
  getByOrder: async (orderId) => {
    const data = await apiRequest(`/payments/order/${orderId}`);
    return Array.isArray(data) ? data : (data.payments || []);
  },
  create: (data) => apiRequest('/payments', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id, status) => apiRequest(`/payments/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  delete: (id) => apiRequest(`/payments/${id}`, { method: 'DELETE' }),
};

// Feedback API
export const feedbackAPI = {
  getAll: async () => {
    const data = await apiRequest('/feedback');
    return Array.isArray(data) ? data : (data.feedback || []);
  },
  getById: async (id) => {
    const data = await apiRequest(`/feedback/${id}`);
    return data.feedback || data;
  },
  getByCustomer: async (customerId) => {
    const data = await apiRequest(`/feedback/customer/${customerId}`);
    return Array.isArray(data) ? data : (data.feedback || []);
  },
  getByOrder: async (orderId) => {
    const data = await apiRequest(`/feedback/order/${orderId}`);
    return data.feedback || data;
  },
  create: (data) => apiRequest('/feedback', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/feedback/${id}`, { method: 'DELETE' }),
};

// Dashboard Stats API (aggregate data)
export const dashboardAPI = {
  getStats: async () => {
    try {
      // Use Promise.allSettled to handle individual failures gracefully
      const [productsResult, ordersResult, paymentsResult] = await Promise.allSettled([
        productsAPI.getAll(),
        ordersAPI.getAll(),
        paymentsAPI.getAll(),
      ]);

      const products = productsResult.status === 'fulfilled' ? productsResult.value : [];
      const orders = ordersResult.status === 'fulfilled' ? ordersResult.value : [];
      const payments = paymentsResult.status === 'fulfilled' ? paymentsResult.value : [];

      // Handle case where results might be objects with nested arrays
      const productsList = Array.isArray(products) ? products : (products.products || []);
      const ordersList = Array.isArray(orders) ? orders : (orders.orders || []);
      const paymentsList = Array.isArray(payments) ? payments : (payments.payments || []);

      const totalRevenue = paymentsList.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
      const totalOrders = ordersList.length;
      const totalProducts = productsList.length;
      
      // Get unique customers from orders (try different possible column names)
      const uniqueCustomers = new Set(
        ordersList
          .map(order => order.customer_id || order.user_id || order.user_Id || order.customer_Id)
          .filter(Boolean)
      );
      const totalCustomers = uniqueCustomers.size;

      return {
        totalProducts,
        totalCustomers,
        totalOrders,
        totalRevenue,
        recentOrders: ordersList.slice(0, 5),
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return default values instead of throwing
      return {
        totalProducts: 0,
        totalCustomers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        recentOrders: [],
      };
    }
  },
};