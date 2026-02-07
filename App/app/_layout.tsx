import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryProvider } from '../providers/QueryProvider';
import { useEffect } from 'react';
import { setupNotificationListeners, getExpoPushToken } from '../services/notifications';
import { authService } from '../services/auth';
import { runIntegrationTest } from '../services/database-integration';

export default function RootLayout() {
  useEffect(() => {
    // Run integration test on app start
    runIntegrationTest();

    // Initialize notifications
    const initializeNotifications = async () => {
      try {
        // Request notification permissions and get token
        const token = await getExpoPushToken();
        if (token) {
          console.log('Expo Push Token:', token);

          // Get current user and send token to backend
          const user = await authService.getCurrentUser();
          if (user) {
            const { sendTokenToBackend } = require('../services/notifications');
            await sendTokenToBackend(token, user.id);
          }
        }

        // Setup notification listeners
        setupNotificationListeners(
          (notification) => {
            console.log('Notification received:', notification);
            // Handle notification received while app is open
          },
          (response) => {
            console.log('Notification tapped:', response);
            // Handle notification tap - navigate to relevant screen
            // You can add navigation logic here based on notification data
          }
        );
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#1a1a1a' },
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
        </Stack>
      </QueryProvider>
    </SafeAreaProvider>
  );
}

