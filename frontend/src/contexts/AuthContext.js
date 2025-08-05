// Authentication Context for React Native app
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signUp, 
  signIn, 
  signInAnon, 
  signOutUser, 
  resetPassword,
  getCurrentUser,
  onAuthStateChange 
} from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Setting up auth state listener');
    
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChange((user) => {
      console.log('AuthProvider: Auth state changed:', user ? 'User logged in' : 'No user');
      console.log('AuthProvider: User details:', user);
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const signup = async (email, password, displayName) => {
    try {
      console.log('AuthProvider: Attempting signup for:', email);
      const userCredential = await signUp(email, password, displayName);
      console.log('AuthProvider: Signup successful');
      return userCredential;
    } catch (error) {
      console.error('AuthProvider: Signup error:', error);
      throw error;
    }
  };

  const signin = async (email, password) => {
    try {
      console.log('AuthProvider: Attempting signin for:', email);
      const userCredential = await signIn(email, password);
      console.log('AuthProvider: Signin successful');
      return userCredential;
    } catch (error) {
      console.error('AuthProvider: Signin error:', error);
      throw error;
    }
  };

  const signinAnonymously = async () => {
    try {
      console.log('AuthProvider: Attempting anonymous signin');
      const userCredential = await signInAnon();
      console.log('AuthProvider: Anonymous signin successful');
      return userCredential;
    } catch (error) {
      console.error('AuthProvider: Anonymous signin error:', error);
      throw error;
    }
  };

  const signout = async () => {
    try {
      console.log('AuthProvider: Attempting signout');
      await signOutUser();
      console.log('AuthProvider: Signout successful');
    } catch (error) {
      console.error('AuthProvider: Signout error:', error);
      throw error;
    }
  };

  const resetPasswordEmail = async (email) => {
    try {
      console.log('AuthProvider: Attempting password reset for:', email);
      await resetPassword(email);
      console.log('AuthProvider: Password reset email sent');
    } catch (error) {
      console.error('AuthProvider: Password reset error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signup,
    signin,
    signinAnonymously,
    signout,
    resetPasswordEmail,
  };

  console.log('AuthProvider: Current state - user:', !!user, 'loading:', loading);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 