import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Card from '../components/ui/Card';
import { COLORS } from '../constants/colors';

export default function NotificationsScreen() {
  const router = useRouter();

  const notifications = [
    {
      id: 1,
      type: 'booking',
      title: 'Booking Confirmed',
      message: 'Your booking at Golden Court Padel Club for Nov 24, 10:00 AM has been confirmed.',
      time: '2 hours ago',
      read: false,
    },
    {
      id: 2,
      type: 'promo',
      title: '20% Off Weekend Slots',
      message: 'Book any weekend slot this week and get 20% off!',
      time: '5 hours ago',
      read: false,
    },
    {
      id: 3,
      type: 'social',
      title: 'New Match Request',
      message: 'Ahmed Khan wants to play Padel with you on Saturday.',
      time: '1 day ago',
      read: true,
    },
    {
      id: 4,
      type: 'booking',
      title: 'Booking Reminder',
      message: 'Your booking at City Sports Complex is tomorrow at 3:00 PM.',
      time: '1 day ago',
      read: true,
    },
    {
      id: 5,
      type: 'social',
      title: 'New Forum Reply',
      message: 'Someone replied to your post in the Padel Community forum.',
      time: '2 days ago',
      read: true,
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return '📅';
      case 'promo':
        return '🎁';
      case 'social':
        return '👥';
      default:
        return '🔔';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.markAllButton}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            style={[styles.notificationCard, !notification.read && styles.notificationCardUnread]}
          >
            <View style={styles.notificationRow}>
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  {!notification.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
            </View>
          </Card>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.backgroundLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: COLORS.textSecondary,
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    fontSize: 12,
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  notificationCard: {
    marginBottom: 12,
  },
  notificationCardUnread: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(74, 222, 128, 0.05)',
  },
  notificationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  notificationMessage: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});

