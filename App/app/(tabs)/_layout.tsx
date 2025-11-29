import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';

// Simple icon components using geometric shapes
const HomeIcon = ({ active }: { active: boolean }) => (
  <View style={styles.iconContainer}>
    <View style={[styles.homeIcon, active && styles.iconActive]} />
    <View style={[styles.homeBase, active && styles.iconActive]} />
  </View>
);

const ChatIcon = ({ active }: { active: boolean }) => (
  <View style={styles.iconContainer}>
    <View style={[styles.chatBubble, active && styles.iconActive]} />
    <View style={[styles.chatDot, active && styles.iconActive]} />
  </View>
);

const SocialIcon = ({ active }: { active: boolean }) => (
  <View style={styles.iconContainer}>
    <View style={[styles.personCircle, active && styles.iconActive]} />
    <View style={[styles.personCircleSmall, active && styles.iconActive, { left: 14 }]} />
  </View>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <View style={styles.iconContainer}>
    <View style={[styles.profileCircle, active && styles.iconActive]} />
    <View style={[styles.profileBody, active && styles.iconActive]} />
  </View>
);

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 65 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <HomeIcon active={focused} />,
        }}
      />
      <Tabs.Screen
        name="chatbot"
        options={{
          title: 'AI Chat',
          tabBarIcon: ({ focused }) => <ChatIcon active={focused} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ focused }) => <SocialIcon active={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <ProfileIcon active={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  // Home icon (house shape)
  homeIcon: {
    width: 14,
    height: 14,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: COLORS.textMuted,
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
    top: 2,
  },
  homeBase: {
    width: 16,
    height: 10,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    borderTopWidth: 0,
    position: 'absolute',
    bottom: 2,
  },
  // Chat icon (speech bubble)
  chatBubble: {
    width: 20,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
  },
  chatDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textMuted,
    position: 'absolute',
    bottom: 6,
  },
  // Social icon (two people)
  personCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    position: 'absolute',
    left: 4,
  },
  personCircleSmall: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    position: 'absolute',
  },
  // Profile icon (person)
  profileCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    position: 'absolute',
    top: 2,
  },
  profileBody: {
    width: 16,
    height: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    borderTopWidth: 0,
    position: 'absolute',
    bottom: 2,
  },
  // Active state
  iconActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
});
