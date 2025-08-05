import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeProvider';
import { useFavorites } from '../contexts/FavoritesProvider';
import DebugAuth from '../components/DebugAuth';

const { width } = Dimensions.get('window');

const alertData = [
  {
    id: 1,
    type: 'robbery',
    title: 'Robbery Alert - DHA Phase 2',
    location: 'Near Zamzama Park',
    time: '2 hours ago',
    severity: 'high',
    icon: 'warning',
    description: 'Armed robbery reported near Zamzama Park. Avoid the area if possible.',
    color: '#ef4444',
    bgColor: '#fef2f2',
    borderColor: '#fecaca'
  },
  {
    id: 2,
    type: 'traffic',
    title: 'Heavy Traffic - Shahrah-e-Faisal',
    location: 'Airport to Drigh Road',
    time: '30 minutes ago',
    severity: 'medium',
    icon: 'car',
    description: 'Heavy traffic due to VIP movement. Use alternate routes.',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    borderColor: '#fed7aa'
  },
  {
    id: 3,
    type: 'utility',
    title: 'Power Outage - Gulshan-e-Iqbal',
    location: 'Block 7 & 8',
    time: '1 hour ago',
    severity: 'medium',
    icon: 'flash',
    description: 'Scheduled maintenance, power expected back by 6 PM.',
    color: '#eab308',
    bgColor: '#fefce8',
    borderColor: '#fde047'
  },
  {
    id: 4,
    type: 'community',
    title: 'Community Meeting - Clifton',
    location: 'Block 4 Community Center',
    time: '4 hours ago',
    severity: 'low',
    icon: 'people',
    description: 'Monthly security meeting scheduled for tomorrow 7 PM.',
    color: '#3b82f6',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe'
  }
];

const communityPosts = [
  {
    id: 1,
    author: 'Ahmed Khan',
    location: 'DHA Phase 6',
    time: '3 hours ago',
    content: 'Looking for a reliable electrician in the area. Any recommendations?',
    likes: 12,
    comments: 5,
    avatar: '👨'
  },
  {
    id: 2,
    author: 'Fatima Ali',
    location: 'Clifton Block 2',
    time: '5 hours ago',
    content: 'Great job by the security guards last night. Feeling safer in our neighborhood!',
    likes: 24,
    comments: 8,
    avatar: '👩'
  },
  {
    id: 3,
    author: 'Karachi Police',
    location: 'Saddar',
    time: '6 hours ago',
    content: 'Regular patrol increased in the area. Report any suspicious activity on 15.',
    likes: 45,
    comments: 12,
    avatar: '👮',
    verified: true
  }
];

const quickActions = [
  { id: 1, title: 'Report Issue', icon: 'document-text', color: '#ef4444' },
  { id: 2, title: 'Find Services', icon: 'search', color: '#3b82f6' },
  { id: 3, title: 'Emergency', icon: 'call', color: '#dc2626' },
  { id: 4, title: 'Community', icon: 'people', color: '#8b5cf6' },
];

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const { addToFavorites, isFavorite } = useFavorites();
  const [currentLocation] = useState('DHA Phase 6, Karachi');

  const styles = getStyles(theme);

  const handleQuickAction = (action) => {
    switch (action.title) {
      case 'Report Issue':
        navigation.navigate('Report');
        break;
      case 'Find Services':
        navigation.navigate('Near Me');
        break;
      case 'Emergency':
        Alert.alert('Emergency', 'Calling emergency services...');
        break;
      case 'Community':
        navigation.navigate('Community');
        break;
    }
  };

  const toggleFavorite = (item) => {
    if (isFavorite(item.id)) {
      // Remove from favorites
      Alert.alert('Remove from Favorites', 'Item removed from favorites');
    } else {
      // Add to favorites
      addToFavorites({
        id: item.id.toString(),
        type: 'alert',
        title: item.title,
        subtitle: item.location,
        location: item.location,
      });
      Alert.alert('Added to Favorites', 'Item added to favorites');
    }
  };

  const renderAlertItem = (alert) => (
    <View key={alert.id} style={[styles.alertCard, { backgroundColor: alert.bgColor, borderColor: alert.borderColor }]}>
      <View style={styles.alertHeader}>
        <View style={styles.alertIconContainer}>
          <Ionicons name={alert.icon} size={20} color={alert.color} />
        </View>
        <View style={styles.alertContent}>
          <Text style={[styles.alertTitle, { color: alert.color }]}>{alert.title}</Text>
          <Text style={styles.alertLocation}>{alert.location}</Text>
          <Text style={styles.alertTime}>{alert.time}</Text>
        </View>
        <TouchableOpacity onPress={() => toggleFavorite(alert)} style={styles.favoriteButton}>
          <Ionicons 
            name={isFavorite(alert.id) ? 'heart' : 'heart-outline'} 
            size={20} 
            color={isFavorite(alert.id) ? '#ef4444' : '#9ca3af'} 
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.alertDescription}>{alert.description}</Text>
    </View>
  );

  const renderCommunityPost = (post) => (
    <View key={post.id} style={styles.postCard}>
      <View style={styles.postHeader}>
        <Text style={styles.postAvatar}>{post.avatar}</Text>
        <View style={styles.postInfo}>
          <View style={styles.postAuthorRow}>
            <Text style={styles.postAuthor}>{post.author}</Text>
            {post.verified && (
              <Ionicons name="checkmark-circle" size={16} color="#3b82f6" />
            )}
          </View>
          <Text style={styles.postLocation}>{post.location}</Text>
          <Text style={styles.postTime}>{post.time}</Text>
        </View>
      </View>
      <Text style={styles.postContent}>{post.content}</Text>
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.postAction}>
          <Ionicons name="heart-outline" size={16} color="#9ca3af" />
          <Text style={styles.postActionText}>{post.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction}>
          <Ionicons name="chatbubble-outline" size={16} color="#9ca3af" />
          <Text style={styles.postActionText}>{post.comments}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Location Header */}
      <View style={styles.locationHeader}>
        <View style={styles.locationContent}>
          <Ionicons name="location" size={20} color="#3b82f6" />
          <View style={styles.locationText}>
            <Text style={styles.locationTitle}>Current Location</Text>
            <Text style={styles.locationSubtitle}>{currentLocation}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionCard}
              onPress={() => handleQuickAction(action)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                <Ionicons name={action.icon} size={24} color="white" />
              </View>
              <Text style={styles.quickActionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Safety Alerts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Safety Alerts</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.alertsContainer}>
          {alertData.map(renderAlertItem)}
        </ScrollView>
      </View>

      {/* Community Posts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Community</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Community')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {communityPosts.map(renderCommunityPost)}
      </View>

      {/* Debug Authentication */}
      <DebugAuth />
    </ScrollView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme === 'dark' ? '#111827' : '#f8fafc',
  },
  locationHeader: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    marginLeft: 12,
  },
  locationTitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  locationSubtitle: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme === 'dark' ? '#f9fafb' : '#1f2937',
  },
  seeAllText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 64) / 2,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    textAlign: 'center',
  },
  alertsContainer: {
    marginLeft: -8,
  },
  alertCard: {
    width: 280,
    marginHorizontal: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alertIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  alertLocation: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  alertTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  favoriteButton: {
    padding: 4,
  },
  alertDescription: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 16,
  },
  postCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  postAvatar: {
    fontSize: 24,
    marginRight: 12,
  },
  postInfo: {
    flex: 1,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 4,
  },
  postLocation: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  postTime: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  postContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    gap: 16,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postActionText: {
    fontSize: 12,
    color: '#9ca3af',
  },
}); 