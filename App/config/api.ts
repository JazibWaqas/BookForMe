import Constants from 'expo-constants';

const getExpoHost = (): string | null => {
  const hostUri = (Constants.expoConfig as any)?.hostUri as string | undefined;
  if (hostUri) return hostUri.split(':')[0] || null;

  const debuggerHost = (Constants.manifest as any)?.debuggerHost as string | undefined;
  if (debuggerHost) return debuggerHost.split(':')[0] || null;

  return null;
};

//Basic Backend Configuration
const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
const expoHost = getExpoHost();
export const API_BASE_URL = envApiUrl || (expoHost ? `http://${expoHost}:8000` : 'http://localhost:8000');
export const API_URL = API_BASE_URL;
export const WS_URL = API_BASE_URL.replace('http', 'ws');

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
    patch: (id: string) => `/api/vendors/${id}`,
    availability: (id: string) => `/api/vendors/${id}/availability`,
    bookings: (id: string) => `/api/vendors/${id}/bookings`,
    grid: (id: string, date: string) => `/api/vendors/${id}/grid?date=${date}`,
    approveSlot: (vendorId: string, slotId: string) => `/api/vendors/${vendorId}/slots/${slotId}/approve`,
    rejectSlot: (vendorId: string, slotId: string) => `/api/vendors/${vendorId}/slots/${slotId}/reject`,
    blockSlot: (vendorId: string, slotId: string) => `/api/vendors/${vendorId}/slots/${slotId}/block`,
    walkIn: (vendorId: string, slotId: string) => `/api/vendors/${vendorId}/slots/${slotId}/walk-in`,
    analyticsToday: (id: string) => `/api/vendors/${id}/analytics/today`,
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

// Helper to build full Media URL
export const getMediaUrl = (path: string | undefined | null): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

// Create axios instance with base configuration
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
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

