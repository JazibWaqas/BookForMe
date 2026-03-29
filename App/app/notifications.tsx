import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { authService } from '../services/auth';
import { apiClient } from '../config/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: any;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadNotifications(); }, []);

  const initialLoadDone = useRef(false);
  useFocusEffect(useCallback(() => {
    if (!initialLoadDone.current) { initialLoadDone.current = true; return; }
    loadNotifications();
  }, []));

  const loadNotifications = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) return;

      // We need to add this endpoint to Social API or use general get
      // For now, assuming direct Firestore query or new endpoint
      // Let's assume we added /api/social/notifications/list
      // But we haven't added it to backend yet! 
      // I will add it to the backend social_api.py in the next step.
      const response = await apiClient.get('/api/social/notifications', {
        params: { user_id: user.id }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = (notification: Notification) => {
    // Mark as read
    // Navigate based on type
    if (notification.type === 'match_joined' && notification.data?.match_id) {
      // Navigate to match details (if we had a screen for it)
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.item, !item.read && styles.unreadItem]}
      onPress={() => handlePress(item)}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={item.type.includes('match') ? "tennisball" : "notifications"}
          size={24}
          color={COLORS.primary}
        />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      {!item.read && <View style={styles.dot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  listContent: { padding: 16 },
  item: { flexDirection: 'row', padding: 16, backgroundColor: COLORS.card, borderRadius: 12, marginBottom: 12, alignItems: 'center' },
  unreadItem: { backgroundColor: '#2a2a2a', borderColor: COLORS.primary, borderWidth: 1 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(74, 222, 128, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  contentContainer: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  message: { fontSize: 14, color: COLORS.textMuted, marginBottom: 4 },
  time: { fontSize: 12, color: COLORS.textMuted, opacity: 0.7 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 50 },
  emptyText: { color: COLORS.textMuted, marginTop: 12, fontSize: 16 }
});
