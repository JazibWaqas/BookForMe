/**
 * API Configuration
 * Centralized configuration for backend API endpoints
 */

// Get the local IP address for development (useful for device testing)
// You can manually set this or use environment variables
const getLocalIP = (): string => {
  // For development, you can manually set your computer's IP
  // Example: return '192.168.1.100';
  return 'localhost';
};

// Environment-based configuration
export const API_CONFIG = {
  // Development URL - change localhost to your IP if testing on physical device
  development: `http://${getLocalIP()}:8000`,
  
  // Production URL - update this when deploying
  production: process.env.EXPO_PUBLIC_API_URL || 'https://your-backend-url.com',
  
  // Staging URL (optional)
  staging: process.env.EXPO_PUBLIC_STAGING_URL || 'https://staging.your-backend-url.com',
};

// Get current API base URL based on environment
export const getApiBaseUrl = (): string => {
  if (__DEV__) {
    return API_CONFIG.development;
  }
  
  // Check for staging environment
  if (process.env.EXPO_PUBLIC_ENV === 'staging') {
    return API_CONFIG.staging;
  }
  
  return API_CONFIG.production;
};

// Export the base URL
export const API_BASE_URL = getApiBaseUrl();

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    loginPhone: '/api/auth/login/phone',
    me: '/api/auth/me',
    changePassword: '/api/auth/change-password',
    setPassword: '/api/auth/set-password',
  },
  
  // Vendors
  vendors: {
    list: '/api/vendors',
    get: (id: string) => `/api/vendors/${id}`,
    availability: (id: string) => `/api/vendors/${id}/availability`,
    bookings: (id: string) => `/api/vendors/${id}/bookings`,
  },
  
  // Bookings
  bookings: {
    create: '/api/bookings',
    get: (id: string) => `/api/bookings/${id}`,
    list: '/api/bookings',
  },
  
  // Health check
  health: '/health',
};

// Helper to build full URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

