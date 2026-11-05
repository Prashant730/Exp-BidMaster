import axios from 'axios'

// Get the API URL from environment variables, or use default localhost URL
let API_URL = 'http://localhost:5000/api'

if (import.meta.env && import.meta.env.VITE_API_URL) {
  API_URL = import.meta.env.VITE_API_URL
} else if (import.meta.env && import.meta.env.PROD) {
  // Use your new Render backend as the default in production
  API_URL = 'https://bidmaster-1-zgvo.onrender.com/api'
  console.log("Using Production API URL:", API_URL);
}

// Create an axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Function to add authentication token and tenant context to requests
function addTokenToRequest(config) {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = 'Bearer ' + token
  }

  // Tenant auto-detection (subdomain or dev override)
  let subdomain = localStorage.getItem('mockTenant')
  if (!subdomain && typeof window !== 'undefined' && window.location.hostname) {
    const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(window.location.hostname)
    if (!isIP && window.location.hostname !== 'localhost') {
      const parts = window.location.hostname.split('.')
      if (parts.length >= 3 && parts[0] !== 'www') {
        subdomain = parts[0]
      } else if (parts.length === 2 && parts[1] === 'localhost' && parts[0] !== 'www') {
        subdomain = parts[0]
      }
    }
  }

  if (subdomain) {
    config.headers['x-tenant-subdomain'] = subdomain
  }

  return config
}

// Function to handle request errors
function handleRequestError(error) {
  return Promise.reject(error)
}

// Add interceptor to automatically add token to every request
api.interceptors.request.use(addTokenToRequest, handleRequestError)

// Function to handle successful responses
function handleResponseSuccess(response) {
  return response
}

// Function to handle response errors (like token expiration)
function handleResponseError(error) {
  // Check if error status is 401 (unauthorized)
  if (error.response && error.response.status === 401) {
    // Remove token and user data from localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // Redirect to home page
    window.location.href = '/'
  }
  return Promise.reject(error)
}

// Add interceptor to handle response errors
api.interceptors.response.use(handleResponseSuccess, handleResponseError)

// Auth API - Functions for user authentication
export const authAPI = {
  // Register a new user
  register: function (userData) {
    return api.post('/auth/register', userData)
  },
  // Login an existing user
  login: function (credentials) {
    return api.post('/auth/login', credentials)
  },
  // Get current user information
  getMe: function () {
    return api.get('/auth/me')
  },
}

// User API - Functions for user operations
export const userAPI = {
  // Submit seller request
  submitSellerRequest: function (requestData) {
    return api.post('/users/seller-request', requestData)
  },
  // Get current user's seller status
  getSellerStatus: function () {
    return api.get('/auth/me')
  },
}

// Auctions API - Functions for auction operations
export const auctionsAPI = {
  // Get all auctions with optional filters
  getAll: function (params) {
    if (params === undefined) {
      params = {}
    }
    return api.get('/auctions', { params: params })
  },
  // Get a single auction by ID
  getById: function (id) {
    return api.get('/auctions/' + id)
  },
  // Create a new auction
  create: function (auctionData) {
    return api.post('/auctions', auctionData)
  },
  // Place a bid on an auction
  placeBid: function (id, amount) {
    return api.post('/auctions/' + id + '/bid', { amount: amount })
  },
  // Get all auctions created by a specific user
  getUserAuctions: function (userId) {
    return api.get('/auctions/user/' + userId)
  },
}

// Upload API - Functions for file uploads
export const uploadAPI = {
  // Upload multiple images (up to 4)
  uploadImages: function (files) {
    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i])
    }
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  // Upload a single image
  uploadSingle: function (file) {
    const formData = new FormData()
    formData.append('image', file)
    return api.post('/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

// Admin API - Functions for admin operations
export const adminAPI = {
  // Get all users (admin only)
  getUsers: function () {
    return api.get('/admin/users')
  },
  // Get single user by ID
  getUser: function (userId) {
    return api.get('/admin/users/' + userId)
  },
  // Get pending seller requests
  getPendingSellers: function () {
    return api.get('/users/pending-sellers')
  },
  // Update user role
  updateUserRole: function (userId, role) {
    return api.put('/admin/users/' + userId + '/role', { role: role })
  },
  // Approve seller
  approveSeller: function (userId) {
    return api.put('/users/' + userId + '/approve-seller')
  },
  // Reject seller
  rejectSeller: function (userId) {
    return api.put('/users/' + userId + '/reject-seller')
  },
  // Ban user
  banUser: function (userId) {
    return api.put('/admin/users/' + userId + '/ban')
  },
  // Unban user
  unbanUser: function (userId) {
    return api.put('/admin/users/' + userId + '/unban')
  },
  // Delete user
  deleteUser: function (userId) {
    return api.delete('/admin/users/' + userId)
  },
  // Get platform stats
  getStats: function () {
    return api.get('/admin/stats')
  },
}

// Activity API - Functions for live activity tracking (admin only)
export const activityAPI = {
  // Get recent activities
  getRecent: function (limit) {
    if (limit === undefined) {
      limit = 50
    }
    return api.get('/activity', { params: { limit: limit } })
  },
  // Get activity statistics
  getStats: function () {
    return api.get('/activity/stats')
  },
  // Get activities by type
  getByType: function (type, limit) {
    if (limit === undefined) {
      limit = 20
    }
    return api.get('/activity/type/' + type, { params: { limit: limit } })
  },
}

export const contactAPI = {
  submit: function (formData) {
    return api.post('/contact', formData)
  },
}

export const tenantAPI = {
  getAll: () => api.get('/tenants'),
  getPublic: (subdomain) => api.get(`/tenants/public/${subdomain}`),
  create: (data) => api.post('/tenants', data),
  update: (id, data) => api.put(`/tenants/${id}`, data),
  delete: (id) => api.delete(`/tenants/${id}`),
  // SaaS Onboarding & Plan routes
  onboard: (data) => api.post('/tenants/onboard', data),
  getPlans: () => api.get('/tenants/plans'),
  getDashboard: (params) => api.get('/tenants/current/dashboard', { params }),
  updatePlan: (newPlan) => api.post('/tenants/current/plan', { newPlan }),
  updateSettings: (settings) => api.put('/tenants/current/settings', settings),
}

export default api

