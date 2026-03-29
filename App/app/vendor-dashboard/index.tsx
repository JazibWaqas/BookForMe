import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  FlatList,
  Animated,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';
import { authService } from '../../services/auth';
import { apiClient, API_ENDPOINTS } from '../../config/api';

type DashboardMetrics = {
  revenue_today: number;
  bookings_today: number;
  pending_actions: number;
  available_today: number;
  active_courts: number;
};

type UpcomingRow = {
  id: string;
  customer_name: string;
  service: string;
  resource_id?: string;
  resource_name?: string;
  time: string;
  status: string;
  amount: number;
  booking_source?: string;
};

type PendingRow = {
  id: string;
  status: string;
  date?: string;
  time: string;
  customer_name: string;
  resource_name?: string;
  amount: number;
  hold_expires_at?: string | null;
  booking_source?: string;
};

type NotifRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at?: string | null;
};

function sourceIcon(source?: string): keyof typeof Ionicons.glyphMap {
  const s = (source || 'app').toLowerCase();
  if (s.includes('whatsapp')) return 'logo-whatsapp';
  if (s === 'walk-in' || s === 'manual') return 'walk-outline';
  return 'phone-portrait-outline';
}

function holdCountdownLabel(iso?: string | null): string | null {
  if (!iso) return null;
  const end = new Date(iso);
  if (Number.isNaN(end.getTime())) return null;
  const sec = Math.floor((end.getTime() - Date.now()) / 1000);
  if (sec <= 0) return 'Hold expired';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m left`;
  if (m > 0) return `${m}m ${s}s left`;
  return `${s}s left`;
}

export default function VendorDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [vendorName, setVendorName] = useState('Vendor Dashboard');
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    revenue_today: 0,
    bookings_today: 0,
    pending_actions: 0,
    available_today: 0,
    active_courts: 0,
  });
  const [upcoming, setUpcoming] = useState<UpcomingRow[]>([]);
  const [pendingItems, setPendingItems] = useState<PendingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState<NotifRow[]>([]);
  const [reseedLoading, setReseedLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fetchNotifications = useCallback(async (uid: string) => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.social.notifications, {
        params: { user_id: uid, limit: 40 },
      });
      const raw = Array.isArray(res.data) ? res.data : [];
      setNotifications(
        raw.map((n: any) => ({
          id: n.id,
          type: String(n.type ?? ''),
          title: n.title ?? '',
          message: n.message ?? '',
          read: Boolean(n.read),
          created_at:
            n.created_at == null
              ? null
              : typeof n.created_at === 'string'
                ? n.created_at
                : new Date(n.created_at).toISOString(),
        }))
      );
    } catch (e) {
      console.error('notifications fetch', e);
    }
  }, []);

  const fetchDashboardData = useCallback(async (vId: string, uid?: string | null) => {
    try {
      const analyticsRes = await apiClient.get(API_ENDPOINTS.vendors.analyticsToday(vId));
      if (analyticsRes.data.success) {
        const m = analyticsRes.data.metrics || {};
        setMetrics({
          revenue_today: Number(m.revenue_today) || 0,
          bookings_today: Number(m.bookings_today) || 0,
          pending_actions: Number(m.pending_actions) || 0,
          available_today: Number(m.available_today) || 0,
          active_courts: Number(m.active_courts) || 0,
        });
        setUpcoming(analyticsRes.data.upcoming || []);
        setPendingItems(Array.isArray(analyticsRes.data.pending_items) ? analyticsRes.data.pending_items : []);
      }
    } catch (error) {
      console.error('Error fetching vendor analytics:', error);
    }

    try {
      const vendorRes = await apiClient.get(API_ENDPOINTS.vendors.get(vId));
      if (vendorRes.data.success) {
        const v = vendorRes.data.vendor;
        setVendorName(v?.name || v?.business_name || 'Vendor Dashboard');
      }
    } catch (error) {
      console.error('Error fetching vendor profile:', error);
    }

    if (uid) {
      try {
        await fetchNotifications(uid);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    }
  }, [fetchNotifications]);

  useEffect(() => {
    const initialize = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user?.vendor_id) {
          setVendorId(user.vendor_id);
          setUserId(user.id || null);
          await fetchDashboardData(user.vendor_id, user.id);
        }
      } catch (error) {
        console.error('Error initializing dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [fetchDashboardData]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    if (!vendorId) return;

    const intervalId = setInterval(() => {
      fetchDashboardData(vendorId, userId);
    }, 8000);

    return () => clearInterval(intervalId);
  }, [vendorId, userId, fetchDashboardData, fadeAnim, slideAnim]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const openNotifications = () => {
    setNotificationsVisible(true);
    if (userId) fetchNotifications(userId);
  };

  const markRead = async (nid: string) => {
    try {
      await apiClient.patch(API_ENDPOINTS.social.notificationMarkRead(nid), {});
      setNotifications((prev) => prev.map((n) => (n.id === nid ? { ...n, read: true } : n)));
    } catch (e) {
      console.error('mark read', e);
    }
  };

  const runSmartReseed = () => {
    if (!vendorId) return;
    Alert.alert(
      'Generate missing slots',
      'Creates only missing slot documents for your schedule. Nothing is deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Run',
          onPress: async () => {
            setReseedLoading(true);
            try {
              const res = await apiClient.post(API_ENDPOINTS.vendors.smartReseed(vendorId));
              const created = res.data?.created ?? 0;
              Alert.alert('Done', res.data?.message || `Created ${created} new slot documents.`);
              await fetchDashboardData(vendorId, userId);
            } catch (e: any) {
              const msg = e?.response?.data?.detail || e?.message || 'Request failed';
              Alert.alert('Error', String(msg));
            } finally {
              setReseedLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ overflow: 'hidden', paddingBottom: 10 }}>
        <LinearGradient
          colors={['rgba(0, 208, 132, 0.15)', 'transparent']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Dashboard</Text>
              <Text style={styles.subtitle}>{vendorName}</Text>
            </View>
            <TouchableOpacity onPress={openNotifications} style={styles.notificationButton}>
              <Ionicons name="notifications" size={24} color="#FFF" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <Animated.ScrollView
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          <View style={[styles.statTile, { marginRight: 6, marginBottom: 8 }]}>
            <Ionicons name="calendar" size={14} color="#3B82F6" style={{ marginBottom: 6 }} />
            <Text style={styles.statLabel}>BOOKINGS TODAY</Text>
            <Text style={styles.statValue}>{metrics.bookings_today}</Text>
          </View>
          <View style={[styles.statTile, { marginLeft: 6, marginBottom: 8 }]}>
            <Ionicons name="cash" size={14} color="#00D084" style={{ marginBottom: 6 }} />
            <Text style={styles.statLabel}>REVENUE TODAY</Text>
            <Text style={[styles.statValue, { color: '#00D084', fontSize: 18 }]}>
              PKR {Math.round(metrics.revenue_today).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.statTile, { marginRight: 6 }]}>
            <Ionicons name="alert-circle" size={14} color="#F59E0B" style={{ marginBottom: 6 }} />
            <Text style={styles.statLabel}>NEEDS ACTION</Text>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{metrics.pending_actions}</Text>
          </View>
          <View style={[styles.statTile, { marginLeft: 6 }]}>
            <Ionicons name="grid-outline" size={14} color="#A78BFA" style={{ marginBottom: 6 }} />
            <Text style={styles.statLabel}>UNBOOKED FROM NOW</Text>
            <Text style={[styles.statValue, { color: '#A78BFA' }]}>{metrics.available_today}</Text>
          </View>
        </View>

        <View style={styles.glassCard}>
          <Text style={styles.cardTitle}>Operations</Text>
          <View style={styles.opsRow}>
            <TouchableOpacity
              style={[styles.opButton, reseedLoading && { opacity: 0.6 }]}
              onPress={runSmartReseed}
              disabled={reseedLoading}
            >
              {reseedLoading ? (
                <ActivityIndicator color="#00D084" size="small" />
              ) : (
                <Ionicons name="add-circle-outline" size={22} color="#00D084" />
              )}
              <Text style={styles.opButtonText}>Generate slots</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.opButton} onPress={() => router.push('/vendor-dashboard/calendar')}>
              <Ionicons name="calendar-outline" size={22} color="#93C5FD" />
              <Text style={styles.opButtonText}>Manage bookings</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.glassCard}>
          <Text style={styles.cardTitle}>Needs attention</Text>
          {pendingItems.length === 0 ? (
            <Text style={styles.bookingDetailsEmpty}>No pending payments or active holds.</Text>
          ) : (
            pendingItems.map((p) => {
              const hold = p.status === 'locked' ? holdCountdownLabel(p.hold_expires_at) : null;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={styles.bookingRow}
                  onPress={() => router.push(`/vendor-dashboard/booking-detail?bookingId=${p.id}`)}
                >
                  <View style={styles.bookingAvatarBox}>
                    <Ionicons name={sourceIcon(p.booking_source)} size={18} color="rgba(255,255,255,0.5)" />
                  </View>
                  <View style={styles.bookingInfo}>
                    <Text style={styles.bookingName}>{p.customer_name}</Text>
                    <Text style={styles.bookingDetails}>
                      {p.time} · {p.resource_name || 'Court'} · PKR {Math.round(p.amount)}
                    </Text>
                    {p.status === 'pending' && (
                      <Text style={styles.tagAwaiting}>Awaiting payment</Text>
                    )}
                    {hold && <Text style={styles.tagHold}>{hold}</Text>}
                  </View>
                  <View style={[styles.statusBadge, p.status === 'locked' ? styles.statusBadgePending : styles.statusBadgePending]}>
                    <Text style={[styles.statusText, styles.statusTextPending]}>{p.status}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={[styles.glassCard, { marginBottom: 32 }]}>
          <Text style={styles.cardTitle}>Upcoming today</Text>
          {upcoming.length === 0 ? (
            <Text style={styles.bookingDetailsEmpty}>No upcoming sessions today.</Text>
          ) : (
            upcoming.map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingRow}
                onPress={() => router.push(`/vendor-dashboard/booking-detail?bookingId=${booking.id}`)}
              >
                <View style={styles.bookingAvatarBox}>
                  <Ionicons name={sourceIcon(booking.booking_source)} size={18} color="rgba(255,255,255,0.5)" />
                </View>
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingName}>{booking.customer_name}</Text>
                  <Text style={styles.bookingDetails}>
                    {booking.time} · {booking.resource_name || booking.resource_id || 'Court'} · PKR{' '}
                    {Math.round(booking.amount || 0)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    booking.status === 'pending' && styles.statusBadgePending,
                    booking.status === 'locked' && styles.statusBadgePending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      booking.status === 'pending' && styles.statusTextPending,
                      booking.status === 'locked' && styles.statusTextPending,
                    ]}
                  >
                    {booking.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </Animated.ScrollView>

      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <Ionicons name="grid" size={24} color={COLORS.primary} />
          <Text style={[styles.navText, styles.navTextActive]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/vendor-dashboard/calendar')} activeOpacity={0.7}>
          <Ionicons name="calendar-outline" size={24} color="rgba(255,255,255,0.4)" />
          <Text style={styles.navText}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/vendor-dashboard/bookings')} activeOpacity={0.7}>
          <Ionicons name="list-outline" size={24} color="rgba(255,255,255,0.4)" />
          <Text style={styles.navText}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/vendor-dashboard/profile')} activeOpacity={0.7}>
          <Ionicons name="person-outline" size={24} color="rgba(255,255,255,0.4)" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={notificationsVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setNotificationsVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {notifications.length === 0 ? (
              <View style={styles.emptyNotifications}>
                <Ionicons name="notifications-off-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No notifications</Text>
                <Text style={styles.emptySubtext}>
                  Booking and payment alerts appear here when written to your account in Firestore.
                </Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.notificationItem, !item.read && styles.notificationUnread]}
                    onPress={() => {
                      if (!item.read) markRead(item.id);
                    }}
                  >
                    <View style={styles.notificationIcon}>
                      <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle}>{item.title}</Text>
                      <Text style={styles.notificationMessage}>{item.message}</Text>
                      {item.created_at ? (
                        <Text style={styles.notificationTime}>{item.created_at.slice(0, 16).replace('T', ' ')}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    fontWeight: '500',
  },
  notificationButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  statTile: {
    flex: 1,
    minWidth: '42%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 4,
  },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  opsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  opButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  opButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  opHint: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  bookingAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bookingDetailsEmpty: {
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  bookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  bookingDetails: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  tagAwaiting: {
    fontSize: 11,
    color: '#FBBF24',
    marginTop: 4,
    fontWeight: '600',
  },
  tagHold: {
    fontSize: 11,
    color: '#F97316',
    marginTop: 2,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.4)',
    borderRadius: 10,
    backgroundColor: 'rgba(0, 208, 132, 0.1)',
  },
  statusBadgePending: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  statusText: {
    fontSize: 9,
    color: '#00D084',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statusTextPending: {
    color: '#F59E0B',
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#0F172A',
    paddingTop: 12,
  },
  navItem: {
    flex: 1,
    paddingVertical: 4,
    alignItems: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },
  navTextActive: {
    color: '#00D084',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  emptyNotifications: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text,
    marginTop: 12,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  notificationUnread: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    opacity: 0.7,
  },
});
