import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
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
    </>
  );
}

