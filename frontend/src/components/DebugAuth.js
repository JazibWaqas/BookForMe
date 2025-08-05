import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { signInAnon } from '../services/authService';

export default function DebugAuth() {
  const { user, loading, signout } = useAuth();

  const handleForceSignOut = async () => {
    try {
      await signout();
      console.log('DebugAuth: Force sign out successful');
    } catch (error) {
      console.error('DebugAuth: Force sign out error:', error);
    }
  };

  const handleAnonymousSignIn = async () => {
    try {
      await signInAnon();
      console.log('DebugAuth: Anonymous sign in successful');
    } catch (error) {
      console.error('DebugAuth: Anonymous sign in error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Authentication</Text>
      <Text style={styles.status}>
        User: {user ? 'Logged In' : 'Not Logged In'}
      </Text>
      <Text style={styles.status}>
        Loading: {loading ? 'Yes' : 'No'}
      </Text>
      {user && (
        <Text style={styles.userInfo}>
          Email: {user.email || 'Anonymous'}
        </Text>
      )}
      
      <TouchableOpacity style={styles.button} onPress={handleForceSignOut}>
        <Text style={styles.buttonText}>Force Sign Out</Text>
      </TouchableOpacity>
      
      {!user && (
        <TouchableOpacity style={styles.button} onPress={handleAnonymousSignIn}>
          <Text style={styles.buttonText}>Anonymous Sign In</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f3f4f6',
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 14,
    color: '#059669',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
}); 