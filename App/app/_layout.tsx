import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryProvider } from '../providers/QueryProvider';
import { useEffect } from 'react';
import { View } from 'react-native';
import { setupNotificationListeners, getExpoPushToken } from '../services/notifications';
import { authService } from '../services/auth';
import { runIntegrationTest } from '../services/database-integration';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    // Run integration test on app start
    runIntegrationTest();

    // Initialize notifications
    const initializeNotifications = async () => {
      try {
        const token = await getExpoPushToken();
        if (token) {
          console.log('Expo Push Token:', token);
          const user = await authService.getCurrentUser();
          if (user) {
            const { sendTokenToBackend } = require('../services/notifications');
            await sendTokenToBackend(token, user.id);
          }
        }
        setupNotificationListeners(
          (notification) => { console.log('Notification received:', notification); },
          (response) => { console.log('Notification tapped:', response); }
        );
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();
  }, []);

  // Show blank screen while fonts load — takes < 1 second
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#0B0F1A' }} />;
  }

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0B0F1A' },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(auth)/register" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="vendor/[id]" />
          <Stack.Screen name="vendor/booking" />
          <Stack.Screen name="category/[category]" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="vendor-dashboard/index" />
          <Stack.Screen name="vendor-dashboard/calendar" />
          <Stack.Screen name="vendor-dashboard/bookings" />
          <Stack.Screen name="admin-dashboard/index" />
        </Stack>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
