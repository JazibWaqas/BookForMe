import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from './firebase';
import { User as UserType } from '../types';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Import API configuration
import { API_BASE_URL, buildApiUrl, API_ENDPOINTS } from '../config/api';

export type UserData = UserType;

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
      // Option 1: Use Firebase Auth directly
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Option 2: Also register with backend API for additional user data
      try {
        const response = await axios.post(buildApiUrl(API_ENDPOINTS.auth.register), {
          email,
          password,
          name,
          phone,
          role
        });

        if (response.data.success) {
          // Store token and user data
          await this.setToken(response.data.token);
          await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
          await AsyncStorage.setItem('userRole', role);
          
          return {
            success: true,
            token: response.data.token,
            user: response.data.user
          };
        }
      } catch (apiError: any) {
        // If backend registration fails, still allow Firebase auth
        console.warn('Backend registration failed, using Firebase only:', apiError.message);
      }

      // Fallback: Use Firebase Auth only
      const userData: UserData = {
        id: firebaseUser.uid,
        email: firebaseUser.email || email,
        name,
        phone,
        role,
        created_at: new Date().toISOString()
      };

      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      await AsyncStorage.setItem('userRole', role);

      return {
        success: true,
        user: userData
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // Option 1: Use backend API (preferred for full user data)
      try {
        const response = await axios.post(buildApiUrl(API_ENDPOINTS.auth.login), {
          email,
          password
        });

        if (response.data.success) {
          await this.setToken(response.data.token);
          await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
          await AsyncStorage.setItem('userRole', response.data.user.role);
          
          // Also sign in with Firebase Auth for consistency
          try {
            await signInWithEmailAndPassword(auth, email, password);
          } catch (firebaseError) {
            console.warn('Firebase sign-in failed, continuing with backend auth:', firebaseError);
          }

          return {
            success: true,
            token: response.data.token,
            user: response.data.user
          };
        }
      } catch (apiError: any) {
        // Fallback to Firebase Auth if backend is unavailable
        console.warn('Backend login failed, trying Firebase:', apiError.message);
      }

      // Option 2: Fallback to Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Get user data from Firestore
      const userData = await this.getUserFromFirestore(firebaseUser.uid);
      
      if (userData) {
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        await AsyncStorage.setItem('userRole', userData.role);
      }

      return {
        success: true,
        user: userData || {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: '',
          phone: '',
          role: 'customer',
          created_at: new Date().toISOString()
        }
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  }

  async loginWithPhone(phone: string, password: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(buildApiUrl(API_ENDPOINTS.auth.loginPhone), {
        phone,
        password
      });

      if (response.data.success) {
        await this.setToken(response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        await AsyncStorage.setItem('userRole', response.data.user.role);
        
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
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Login failed'
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
      await this.clearToken();
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('userRole');
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
    cnic: string;
    category: string;
    address: string;
    location: { lat: number; lng: number };
    description?: string;
  }, userId: string): Promise<boolean> {
    try {
      const vendorDoc = {
        business_name: vendorData.businessName,
        owner_name: vendorData.ownerName,
        email: vendorData.email,
        phone: vendorData.phone,
        cnic: vendorData.cnic,
        category: vendorData.category,
        address: vendorData.address,
        location: vendorData.location,
        description: vendorData.description || '',
        whatsapp_connected: false,
        sheets_connected: false,
        created_at: new Date().toISOString(),
        status: 'pending', // Pending verification
        user_id: userId,
      };

      // Create vendor document in Firestore
      await setDoc(doc(db, 'vendors', userId), vendorDoc);
      
      // Update user document with vendor_id
      await setDoc(doc(db, 'users', userId), {
        vendor_id: userId
      }, { merge: true });

      return true;
    } catch (error) {
      console.error('Error creating vendor profile:', error);
      return false;
    }
  }
}

export const authService = new AuthService();

