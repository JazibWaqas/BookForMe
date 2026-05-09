import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut as firebaseSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from './firebase';
import { User as UserType } from '../types';

import { API_ENDPOINTS, apiClient, clearTokenCache, updateTokenCache } from '../config/api';

export interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin' | 'vendor';
  phone?: string;
  vendor_id?: string | null;
  avatar_url?: string;
  created_at?: string;
  // Social Fields
  bio?: string;
  points?: number;
  level?: number;
  stats?: {
    matches_played: number;
    wins: number;
    losses: number;
    win_rate: number;
  };
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: UserData;
  error?: string;
}

class AuthService {
  private token: string | null = null;

  async register(email: string, password: string, name: string, phone: string, role: 'customer' | 'vendor' = 'customer'): Promise<AuthResponse> {
    try {
      if (!email || !password || !name || !phone) {
        return {
          success: false,
          error: 'All fields are required'
        };
      }

      if (password.length < 6) {
        return {
          success: false,
          error: 'Password must be at least 6 characters'
        };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          error: 'Please enter a valid email address'
        };
      }

      const response = await apiClient.post(API_ENDPOINTS.auth.register, {
        email,
        password,
        name,
        phone,
        role
      });

      if (response.data.success) {
        await this.setToken(response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        await AsyncStorage.setItem('userRole', response.data.user.role || role);
        updateTokenCache(response.data.token);

        return {
          success: true,
          token: response.data.token,
          user: response.data.user
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Registration failed'
        };
      }
    } catch (error: any) {
      console.error('Registration error:', error);

      if (error.response?.status === 400) {
        return {
          success: false,
          error: error.response.data?.detail || error.response.data?.error || 'Registration failed. Please check your information.'
        };
      }

      if (error.response?.status === 409 || error.message?.includes('already')) {
        return {
          success: false,
          error: 'Email or phone number already registered'
        };
      }

      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network')) {
        return {
          success: false,
          error: 'Network error. Please check your connection and try again.'
        };
      }

      const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.message || 'Registration failed. Please try again.';
      return {
        success: false,
        error: typeof errorMessage === 'string' ? errorMessage : String(errorMessage)
      };
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      if (!email || !password) {
        return {
          success: false,
          error: 'Email and password are required'
        };
      }

      console.log('=== LOGIN ATTEMPT ===');
      console.log('API Base URL:', apiClient.defaults.baseURL);
      console.log('Login endpoint:', API_ENDPOINTS.auth.login);
      console.log('Full URL:', `${apiClient.defaults.baseURL}${API_ENDPOINTS.auth.login}`);
      console.log('Email:', email);

      const response = await apiClient.post(API_ENDPOINTS.auth.login, {
        email,
        password
      });

      console.log('Login response received:', response.status);

      if (response.data.success) {
        await this.setToken(response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        await AsyncStorage.setItem('userRole', response.data.user.role || 'customer');

        // Update token cache immediately so next requests work
        updateTokenCache(response.data.token);

        // Clear React Query cache on login to ensure fresh data for new user
        try {
          const { queryClient } = await import('../providers/QueryProvider');
          queryClient.clear();
        } catch (e) {
          console.log('Could not clear query cache:', e);
        }

        return {
          success: true,
          token: response.data.token,
          user: response.data.user
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Login failed'
        };
      }
    } catch (error: any) {
      console.error('=== LOGIN ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error config:', {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout,
      });
      console.error('Error response status:', error.response?.status);
      console.error('Error response data:', error.response?.data);
      console.error('Request data:', { email, password: '***' });

      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      if (error.response?.status === 422) {
        const validationError = error.response?.data?.detail || error.response?.data;
        return {
          success: false,
          error: Array.isArray(validationError)
            ? validationError.map((e: any) => e.msg || e.message || JSON.stringify(e)).join(', ')
            : typeof validationError === 'string'
              ? validationError
              : 'Invalid request format. Please check your email and password.'
        };
      }

      if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: `Cannot connect to server at ${apiClient.defaults.baseURL}. Please ensure the backend is running.`
        };
      }

      if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
        return {
          success: false,
          error: 'Connection timeout. Please check your network connection.'
        };
      }

      if (error.message?.includes('Network Error') || error.message?.includes('Network request failed')) {
        return {
          success: false,
          error: `Network error connecting to ${apiClient.defaults.baseURL}. Please check:\n1. Backend server is running\n2. Firewall allows connections\n3. You're on the same network`
        };
      }

      const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.message || 'Login failed. Please try again.';
      return {
        success: false,
        error: typeof errorMessage === 'string' ? errorMessage : String(errorMessage)
      };
    }
  }

  async loginWithPhone(phone: string, password: string): Promise<AuthResponse> {
    try {
      if (!phone || !password) {
        return {
          success: false,
          error: 'Phone and password are required'
        };
      }

      const response = await apiClient.post(API_ENDPOINTS.auth.loginPhone, {
        phone,
        password
      });

      if (response.data.success) {
        await this.setToken(response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        await AsyncStorage.setItem('userRole', response.data.user.role || 'customer');

        // Update token cache immediately
        updateTokenCache(response.data.token);

        // Clear React Query cache on login
        try {
          const { queryClient } = await import('../providers/QueryProvider');
          queryClient.clear();
        } catch (e) {
          console.log('Could not clear query cache:', e);
        }

        return {
          success: true,
          token: response.data.token,
          user: response.data.user
        };
      }

      return {
        success: false,
        error: response.data.error || 'Login failed'
      };
    } catch (error: any) {
      console.error('Phone login error:', error);

      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Invalid phone or password'
        };
      }

      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network')) {
        return {
          success: false,
          error: 'Network error. Please check your connection and try again.'
        };
      }

      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.error || error.message || 'Login failed'
      };
    }
  }

  async loginWithGoogleToken(userInfo: { email: string; name: string; uid: string }): Promise<AuthResponse> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.auth.google, {
        email: userInfo.email,
        name: userInfo.name || 'Google User',
        firebase_uid: userInfo.uid,
      });

      if (response.data.success) {
        await this.setToken(response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        await AsyncStorage.setItem('userRole', response.data.user.role || 'customer');
        updateTokenCache(response.data.token);
        return { success: true, token: response.data.token, user: response.data.user };
      }

      return { success: false, error: response.data.error || 'Google login failed' };
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.message || 'Google login failed';
      return { success: false, error: msg };
    }
  }

  async logout(): Promise<void> {
    try {
      await firebaseSignOut(auth);
      clearTokenCache();
      await this.clearToken();
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('userRole');

      // Clear React Query cache on logout
      const { queryClient } = await import('../providers/QueryProvider');
      queryClient.clear();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async getCurrentUser(): Promise<UserData | null> {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        return JSON.parse(userDataStr);
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) {
        return false;
      }

      try {
        const response = await apiClient.get(API_ENDPOINTS.auth.me);
        if (response.data.success && response.data.user) {
          await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
          return true;
        }
        return false;
      } catch (error: any) {
        if (error.response?.status === 401) {
          await this.logout();
          return false;
        }
        return false;
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  async getToken(): Promise<string | null> {
    if (this.token) {
      return this.token;
    }
    this.token = await AsyncStorage.getItem('authToken');
    return this.token;
  }

  private async setToken(token: string): Promise<void> {
    this.token = token;
    await AsyncStorage.setItem('authToken', token);
  }

  private async clearToken(): Promise<void> {
    this.token = null;
    await AsyncStorage.removeItem('authToken');
  }

  private async getUserFromFirestore(userId: string): Promise<UserData | null> {
    try {
      const { getDoc, doc } = await import('firebase/firestore');
      const { db } = await import('./firebase');

      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          id: userDoc.id,
          email: data.email || '',
          name: data.name || '',
          phone: data.phone || '',
          role: data.role || 'customer',
          vendor_id: data.vendor_id,
          created_at: data.created_at ? (typeof data.created_at === 'string' ? data.created_at : data.created_at.toDate().toISOString()) : new Date().toISOString()
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user from Firestore:', error);
      return null;
    }
  }

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  // Create vendor document in Firestore after registration
  async createVendorProfile(vendorData: {
    businessName: string;
    ownerName: string;
    email: string;
    phone: string;
    category: string;
    address: string;
    cnic?: string;
    location?: { lat: number; lng: number };
    description?: string;
  }, userId: string): Promise<boolean> {
    try {
      const vendorDoc: any = {
        business_name: vendorData.businessName,
        owner_name: vendorData.ownerName,
        email: vendorData.email,
        phone: vendorData.phone,
        category: vendorData.category,
        service_type: vendorData.category, // Also set service_type for backend compatibility
        address: vendorData.address,
        description: vendorData.description || '',
        whatsapp_connected: false,
        sheets_connected: false,
        created_at: new Date().toISOString(),
        status: 'active', // Auto-approve for easier registration
        user_id: userId,
      };

      // Add optional fields if provided
      if (vendorData.cnic) {
        vendorDoc.cnic = vendorData.cnic;
      }
      if (vendorData.location) {
        vendorDoc.location = vendorData.location;
      }

      // Create vendor document via backend API (avoids Firestore permissions issues)
      try {
        const response = await apiClient.post('/api/vendors', {
          ...vendorDoc,
          user_id: userId,
          id: userId
        });

        if (response.data.success) {
          return true;
        } else {
          console.error('Vendor creation failed:', response.data);
          return false;
        }
      } catch (apiError: any) {
        console.error('Error creating vendor via API:', apiError);
        console.error('Error details:', apiError.response?.data || apiError.message);
        return false;
      }
    } catch (error) {
      console.error('Error creating vendor profile:', error);
      return false;
    }
  }

  async updateProfile(data: { name: string; phone: string }): Promise<AuthResponse> {
    try {
      const response = await apiClient.put('/api/auth/profile', data);

      if (response.data.success) {
        // Update local storage
        const currentUser = await this.getCurrentUser();
        if (currentUser) {
          const updatedUser = { ...currentUser, ...response.data.user };
          await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        }

        return {
          success: true,
          user: response.data.user
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Profile update failed'
        };
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Profile update failed'
      };
    }
  }
}

export const authService = new AuthService();

