/**
 * Firebase Cloud Messaging (FCM) Setup
 * Handles push notifications for the app
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildApiUrl } from '../config/api';
import axios from 'axios';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const NOTIFICATION_TOKEN_KEY = 'expo_push_token';

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    console.warn('Push notifications not supported on web');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Failed to get push token for push notification!');
    return false;
  }

  return true;
}

/**
 * Get Expo Push Token
 * This token should be sent to your backend to register the device
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    // Check if we already have a token
    const existingToken = await AsyncStorage.getItem(NOTIFICATION_TOKEN_KEY);
    if (existingToken) {
      return existingToken;
    }

    // Request permissions
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    // Get the token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'bookforme-c93a6',
    });

    const token = tokenData.data;
    
    // Store the token
    await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token);
    
    // TODO: Send token to your backend API
    // await sendTokenToBackend(token);
    
    return token;
  } catch (error) {
    console.error('Error getting Expo push token:', error);
    return null;
  }
}

/**
 * Send push token to backend
 */
export async function sendTokenToBackend(token: string, userId: string): Promise<boolean> {
  try {
    const response = await axios.post(
      buildApiUrl('/api/users/push-token'),
      { token, userId, platform: Platform.OS }
    );
    
    return response.data.success === true;
  } catch (error) {
    console.error('Error sending token to backend:', error);
    return false;
  }
}

/**
 * Setup notification listeners
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
) {
  // Listener for notifications received while app is foregrounded
  const receivedListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification received:', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    }
  );

  // Listener for when user taps on notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('Notification tapped:', response);
      if (onNotificationTapped) {
        onNotificationTapped(response);
      }
    }
  );

  // Return cleanup function
  return () => {
    receivedListener.remove();
    responseListener.remove();
  };
}

/**
 * Schedule a local notification (for testing or reminders)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
    },
    trigger: trigger || null, // null means show immediately
  });
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all scheduled notifications
 */
export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

