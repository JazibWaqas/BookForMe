/**
 * API Configuration
 * Centralized configuration for backend API endpoints
 */

// Get the local IP address for development (useful for device testing)
// You can manually set this or use environment variables
const getLocalIP = (): string => {
  // For development, use your computer's IP address if testing on physical device
  // Or use 'localhost' if testing on emulator/simulator
  // From your Expo output, your IP is: 192.168.100.67
  return process.env.EXPO_PUBLIC_API_HOST || '192.168.100.67';
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

  // Slots
  slots: {
    lock: (slotId: string) => `/api/slots/${slotId}/lock`,
  },

  // Payments
  payments: {
    submit: '/api/payments',
  },

  // Health check
  health: '/health',
};

// Helper to build full URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Create axios instance with base configuration
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Memory cache for token to avoid AsyncStorage reads on every request
let tokenCache: { token: string | null; timestamp: number } | null = null;
const TOKEN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedToken = async (): Promise<string | null> => {
  const now = Date.now();
  
  // Return cached token if still valid
  if (tokenCache && (now - tokenCache.timestamp) < TOKEN_CACHE_DURATION) {
    return tokenCache.token;
  }
  
  // Fetch from AsyncStorage and cache it
  try {
    const token = await AsyncStorage.getItem('authToken');
    tokenCache = { token, timestamp: now };
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Clear token cache (call this on logout)
export const clearTokenCache = () => {
  tokenCache = null;
};

// Update token cache (call this on login to immediately cache new token)
export const updateTokenCache = (token: string) => {
  tokenCache = { token, timestamp: Date.now() };
};

// Request interceptor to automatically add token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getCachedToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token for request:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 (token expired)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth data and cache
      clearTokenCache();
      try {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userData');
        await AsyncStorage.removeItem('userRole');
      } catch (storageError) {
        console.error('Error clearing auth data:', storageError);
      }
    }
    return Promise.reject(error);
  }
);

