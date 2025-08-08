import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/contexts/ThemeProvider';
import { FavoritesProvider } from './src/contexts/FavoritesProvider';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ComplaintsProvider } from './src/contexts/ComplaintsContext';
import HomeScreen from './src/screens/HomeScreen';
import SearchServicesScreen from './src/screens/SearchServicesScreen';
import SubmitComplaintScreen from './src/screens/SubmitComplaintScreen';
import CommunityChatScreen from './src/screens/CommunityChatScreen';
import NeighborhoodRankingsScreen from './src/screens/NeighborhoodRankingsScreen';
import PropertyInsightsScreen from './src/screens/PropertyInsightsScreen';
import VerifiedListingsScreen from './src/screens/VerifiedListingsScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AuthScreen from './src/screens/AuthScreen';
import ChatbotAssistant from './src/screens/ChatbotAssistant';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function TabNavigator() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Near Me') {
            iconName = focused ? 'location' : 'location-outline';
          } else if (route.name === 'Report') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Community') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Assistant') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 5,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 10),
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        tabBarSafeAreaInsets: { bottom: 0 },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Near Me" component={SearchServicesScreen} />
      <Tab.Screen name="Report" component={SubmitComplaintScreen} />
      <Tab.Screen name="Community" component={CommunityChatScreen} />
      <Tab.Screen name="Assistant" component={ChatbotAssistant} />
    </Tab.Navigator>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2563eb',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Drawer.Screen 
        name="MainTabs" 
        component={TabNavigator} 
        options={{ 
          title: 'KHI Safe',
          drawerLabel: 'Home',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Rankings" 
        component={NeighborhoodRankingsScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="trending-up-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Property" 
        component={PropertyInsightsScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="business-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Listings" 
        component={VerifiedListingsScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="location-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Favorites" 
        component={FavoritesScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  console.log('AppContent: Current state - user:', !!user, 'loading:', loading);

  if (loading) {
    console.log('AppContent: Showing loading screen');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <Text style={{ fontSize: 18, color: '#6b7280' }}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    console.log('AppContent: No user found, showing AuthScreen');
    return <AuthScreen />;
  }

  console.log('AppContent: User found, showing main app');
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <DrawerNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ComplaintsProvider>
        <ThemeProvider>
          <FavoritesProvider>
            <AppContent />
          </FavoritesProvider>
        </ThemeProvider>
      </ComplaintsProvider>
    </AuthProvider>
  );
}