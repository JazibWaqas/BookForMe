import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { authService } from '../services/auth';
import { COLORS } from '../constants/colors';

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await authService.isAuthenticated();
        setIsAuthenticated(authenticated);
        
        if (authenticated) {
          const user = await authService.getCurrentUser();
          if (user) {
            setUserRole(user.role || 'customer');
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textMuted, marginTop: 16 }}>Loading...</Text>
      </View>
    );
  }

  if (isAuthenticated && userRole) {
    if (userRole === 'vendor') {
      return <Redirect href="/vendor-dashboard" />;
    } else {
      return <Redirect href="/(tabs)/home" />;
    }
  }

  return <Redirect href="/(auth)/login" />;
}

