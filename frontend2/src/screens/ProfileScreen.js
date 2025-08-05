import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeProvider';

const userProfile = {
  name: 'Ahmed Khan',
  email: 'ahmed.khan@email.com',
  phone: '+92-300-1234567',
  location: 'DHA Phase 6, Karachi',
  avatar: '👨',
  memberSince: 'January 2024',
  totalReports: 12,
  totalFavorites: 8,
  safetyScore: 95,
  communityContributions: 15,
};

const profileStats = [
  {
    id: 'reports',
    title: 'Reports Submitted',
    value: userProfile.totalReports,
    icon: 'document-text',
    color: '#ef4444',
  },
  {
    id: 'favorites',
    title: 'Favorites',
    value: userProfile.totalFavorites,
    icon: 'heart',
    color: '#f59e0b',
  },
  {
    id: 'safety',
    title: 'Safety Score',
    value: userProfile.safetyScore,
    icon: 'shield',
    color: '#10b981',
  },
  {
    id: 'contributions',
    title: 'Contributions',
    value: userProfile.communityContributions,
    icon: 'people',
    color: '#3b82f6',
  },
];

const profileActions = [
  {
    id: 'edit',
    title: 'Edit Profile',
    subtitle: 'Update your personal information',
    icon: 'person',
    action: 'edit',
  },
  {
    id: 'security',
    title: 'Security Settings',
    subtitle: 'Manage your account security',
    icon: 'shield-checkmark',
    action: 'security',
  },
  {
    id: 'notifications',
    title: 'Notification Preferences',
    subtitle: 'Customize your alerts',
    icon: 'notifications',
    action: 'notifications',
  },
  {
    id: 'privacy',
    title: 'Privacy Settings',
    subtitle: 'Control your data and privacy',
    icon: 'lock-closed',
    action: 'privacy',
  },
];

export default function ProfileScreen() {
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);

  const styles = getStyles(theme);

  const handleActionPress = (action) => {
    switch (action) {
      case 'edit':
        Alert.alert('Edit Profile', 'Profile editing coming soon!');
        break;
      case 'security':
        Alert.alert('Security Settings', 'Security settings coming soon!');
        break;
      case 'notifications':
        Alert.alert('Notification Preferences', 'Notification settings coming soon!');
        break;
      case 'privacy':
        Alert.alert('Privacy Settings', 'Privacy settings coming soon!');
        break;
    }
  };

  const renderStatCard = (stat) => (
    <View key={stat.id} style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
        <Ionicons name={stat.icon} size={20} color="white" />
      </View>
      <Text style={styles.statValue}>{stat.value}</Text>
      <Text style={styles.statTitle}>{stat.title}</Text>
    </View>
  );

  const renderActionItem = (action) => (
    <TouchableOpacity
      key={action.id}
      style={styles.actionItem}
      onPress={() => handleActionPress(action.action)}
    >
      <View style={styles.actionIcon}>
        <Ionicons name={action.icon} size={20} color="#6b7280" />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{action.title}</Text>
        <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>{userProfile.avatar}</Text>
          <TouchableOpacity style={styles.editAvatarButton}>
            <Ionicons name="camera" size={16} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{userProfile.name}</Text>
          <Text style={styles.profileEmail}>{userProfile.email}</Text>
          <Text style={styles.profileLocation}>{userProfile.location}</Text>
          <Text style={styles.memberSince}>Member since {userProfile.memberSince}</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Your Activity</Text>
        <View style={styles.statsGrid}>
          {profileStats.map(renderStatCard)}
        </View>
      </View>

      {/* Profile Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <View style={styles.actionsContainer}>
          {profileActions.map(renderActionItem)}
        </View>
      </View>

      {/* Additional Info */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Additional Information</Text>
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Ionicons name="call" size={16} color="#6b7280" />
            <Text style={styles.infoText}>{userProfile.phone}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="location" size={16} color="#6b7280" />
            <Text style={styles.infoText}>{userProfile.location}</Text>
          </View>
        </View>
      </View>

      {/* Safety Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>Safety Tips</Text>
        <View style={styles.tipCard}>
          <Ionicons name="lightbulb" size={20} color="#f59e0b" />
          <Text style={styles.tipText}>
            Always report suspicious activities in your neighborhood to help keep everyone safe.
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Ionicons name="shield" size={20} color="#10b981" />
          <Text style={styles.tipText}>
            Keep your location services enabled for better safety alerts and emergency response.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const getStyles = (theme) => StyleSheet.create({
    container: {
      flex: 1,
    backgroundColor: theme === 'dark' ? '#111827' : '#f8fafc',
    },
    profileHeader: {
    backgroundColor: 'white',
    padding: 20,
      alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
    },
    avatar: {
    fontSize: 64,
    marginBottom: 8,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#3b82f6',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
      justifyContent: 'center',
  },
  profileInfo: {
      alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  profileLocation: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statsSection: {
    padding: 16,
    backgroundColor: 'white',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
      fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  actionsSection: {
    padding: 16,
    backgroundColor: 'white',
    marginTop: 8,
  },
  actionsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
      borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoSection: {
    padding: 16,
    backgroundColor: 'white',
    marginTop: 8,
  },
  infoContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  tipsSection: {
    padding: 16,
    backgroundColor: 'white',
    marginTop: 8,
    marginBottom: 16,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginLeft: 12,
      flex: 1,
    },
  });