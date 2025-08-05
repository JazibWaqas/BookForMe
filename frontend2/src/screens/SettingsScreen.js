import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeProvider';

const settingsSections = [
  {
    title: 'Appearance',
    items: [
      {
        id: 'theme',
        title: 'Dark Mode',
        subtitle: 'Switch between light and dark themes',
        type: 'toggle',
        icon: 'moon',
      },
      {
        id: 'notifications',
        title: 'Push Notifications',
        subtitle: 'Receive alerts for safety updates',
        type: 'toggle',
        icon: 'notifications',
      },
    ],
  },
  {
    title: 'Privacy & Security',
    items: [
      {
        id: 'location',
        title: 'Location Services',
        subtitle: 'Allow app to access your location',
        type: 'toggle',
        icon: 'location',
      },
      {
        id: 'data',
        title: 'Data Usage',
        subtitle: 'Manage app data and cache',
        type: 'link',
        icon: 'cellular',
      },
      {
        id: 'privacy',
        title: 'Privacy Policy',
        subtitle: 'Read our privacy policy',
        type: 'link',
        icon: 'shield-checkmark',
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        id: 'profile',
        title: 'Edit Profile',
        subtitle: 'Update your personal information',
        type: 'link',
        icon: 'person',
      },
      {
        id: 'password',
        title: 'Change Password',
        subtitle: 'Update your account password',
        type: 'link',
        icon: 'lock-closed',
      },
      {
        id: 'logout',
        title: 'Sign Out',
        subtitle: 'Log out of your account',
        type: 'link',
        icon: 'log-out',
        danger: true,
      },
    ],
  },
  {
    title: 'Support',
    items: [
      {
        id: 'help',
        title: 'Help & Support',
        subtitle: 'Get help with the app',
        type: 'link',
        icon: 'help-circle',
      },
      {
        id: 'feedback',
        title: 'Send Feedback',
        subtitle: 'Share your thoughts with us',
        type: 'link',
        icon: 'chatbubble',
      },
      {
        id: 'about',
        title: 'About',
        subtitle: 'App version and information',
        type: 'link',
        icon: 'information-circle',
      },
    ],
  },
];

export default function SettingsScreen() {
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = React.useState(true);
  const [locationServices, setLocationServices] = React.useState(true);

  const styles = getStyles(theme);

  const handleSettingPress = (setting) => {
    switch (setting.id) {
      case 'theme':
        toggleTheme();
        break;
      case 'notifications':
        setNotifications(!notifications);
        Alert.alert('Notifications', notifications ? 'Notifications disabled' : 'Notifications enabled');
        break;
      case 'location':
        setLocationServices(!locationServices);
        Alert.alert('Location', locationServices ? 'Location services disabled' : 'Location services enabled');
        break;
      case 'data':
        Alert.alert('Data Usage', 'Data usage settings coming soon!');
        break;
      case 'privacy':
        Alert.alert('Privacy Policy', 'Privacy policy details coming soon!');
        break;
      case 'profile':
        Alert.alert('Edit Profile', 'Profile editing coming soon!');
        break;
      case 'password':
        Alert.alert('Change Password', 'Password change coming soon!');
        break;
      case 'logout':
        Alert.alert(
          'Sign Out',
          'Are you sure you want to sign out?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: () => Alert.alert('Signed Out', 'You have been signed out') },
          ]
        );
        break;
      case 'help':
        Alert.alert('Help & Support', 'Help and support coming soon!');
        break;
      case 'feedback':
        Alert.alert('Send Feedback', 'Feedback form coming soon!');
        break;
      case 'about':
        Alert.alert('About', 'KHI Safe App v1.0.0\n\nNeighborhood Safety App for Karachi');
        break;
    }
  };

  const renderSettingItem = (setting) => (
    <TouchableOpacity
      key={setting.id}
      style={styles.settingItem}
      onPress={() => handleSettingPress(setting)}
    >
      <View style={styles.settingIcon}>
        <Ionicons 
          name={setting.icon} 
          size={20} 
          color={setting.danger ? '#ef4444' : '#6b7280'} 
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, setting.danger && styles.settingTitleDanger]}>
          {setting.title}
        </Text>
        <Text style={styles.settingSubtitle}>{setting.subtitle}</Text>
      </View>
      {setting.type === 'toggle' ? (
        <Switch
          value={
            setting.id === 'theme' ? theme === 'dark' :
            setting.id === 'notifications' ? notifications :
            setting.id === 'location' ? locationServices : false
          }
          onValueChange={() => handleSettingPress(setting)}
          trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
          thumbColor={theme === 'dark' ? '#1f2937' : '#ffffff'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>
          Customize your app experience
        </Text>
      </View>

      {/* Settings Sections */}
      {settingsSections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionContent}>
            {section.items.map(renderSettingItem)}
          </View>
        </View>
      ))}

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>KHI Safe v1.0.0</Text>
        <Text style={styles.versionSubtext}>© 2024 KHI Safe Team</Text>
          </View>
      </ScrollView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme === 'dark' ? '#111827' : '#f8fafc',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  sectionContent: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingTitleDanger: {
    color: '#ef4444',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  versionText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
});