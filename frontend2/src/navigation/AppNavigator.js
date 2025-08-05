import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeProvider';

// Import screens
import HomeDashboard from '../screens/HomeDashboard';
import SearchServices from '../screens/SearchServices';
import SubmitComplaint from '../screens/SubmitComplaint';
import CommunityChat from '../screens/CommunityChat';
import NeighborhoodRankings from '../screens/NeighborhoodRankings';
import PropertyInsights from '../screens/PropertyInsights';
import VerifiedListings from '../screens/VerifiedListings';
import FavoritesScreen from '../screens/FavoritesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatbotAssistant from '../screens/ChatbotAssistant';
import AppSidebar from '../components/AppSidebar';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function TabNavigator() {
  const { colors } = useTheme();
  const [showChatbot, setShowChatbot] = useState(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'NearMe') {
              iconName = focused ? 'navigate' : 'navigate-outline';
            } else if (route.name === 'Report') {
              iconName = focused ? 'document-text' : 'document-text-outline';
            } else if (route.name === 'Community') {
              iconName = focused ? 'people' : 'people-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: 5,
            height: 60,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={HomeDashboard} />
        <Tab.Screen name="NearMe" component={SearchServices} />
        <Tab.Screen name="Report" component={SubmitComplaint} />
        <Tab.Screen name="Community" component={CommunityChat} />
      </Tab.Navigator>

      {/* Floating Chatbot Button */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 80,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
        }}
        onPress={() => setShowChatbot(true)}
      >
        <Ionicons name="chatbubble" size={24} color="white" />
      </TouchableOpacity>

      {/* Chatbot Modal */}
      <Modal
        visible={showChatbot}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChatbot(false)}
      >
        <ChatbotAssistant onClose={() => setShowChatbot(false)} />
      </Modal>
    </>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <AppSidebar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Drawer.Screen name="MainTabs" component={TabNavigator} />
      <Drawer.Screen name="Rankings" component={NeighborhoodRankings} />
      <Drawer.Screen name="Property" component={PropertyInsights} />
      <Drawer.Screen name="Listings" component={VerifiedListings} />
      <Drawer.Screen name="Favorites" component={FavoritesScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
    </Drawer.Navigator>
  );
}

export default function AppNavigator() {
  return <DrawerNavigator />;
}