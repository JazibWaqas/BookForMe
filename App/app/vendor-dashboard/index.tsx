import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, FlatList, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';
import { authService } from '../../services/auth';
import { apiClient, API_ENDPOINTS } from '../../config/api';

export default function VendorDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [vendorName, setVendorName] = useState('Vendor Dashboard');
  const [metrics, setMetrics] = useState({ revenue: 0, bookings: 0 });
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async (vId: string) => {
    try {
      // Fetch vendor profile and analytics in parallel
      const [vendorRes, analyticsRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.vendors.get(vId)),
        apiClient.get(API_ENDPOINTS.vendors.analyticsToday(vId))
      ]);

      if (vendorRes.data.success) {
        setVendorName(vendorRes.data.vendor.name || vendorRes.data.vendor.business_name || 'Vendor Dashboard');
      }

      if (analyticsRes.data.success) {
        setMetrics({
          revenue: analyticsRes.data.metrics.revenue_today || 0,
          bookings: analyticsRes.data.metrics.bookings_today || 0,
        });
        setUpcoming(analyticsRes.data.upcoming || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user && user.vendor_id) {
          setVendorId(user.vendor_id);
          await fetchDashboardData(user.vendor_id);
        }
      } catch (error) {
        console.error('Error initializing dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [fetchDashboardData]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Auto-reload and entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();

    if (!vendorId) return;

    const intervalId = setInterval(() => {
      fetchDashboardData(vendorId);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [vendorId, fetchDashboardData]);

  // Backend calculates these now
  const todaysBookingsCount = metrics.bookings;
  const todaysRevenue = metrics.revenue;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Cinematic Gradient */}
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
            <TouchableOpacity onPress={() => setNotificationsVisible(true)} style={styles.notificationButton}>
              <Ionicons name="notifications" size={24} color="#FFF" />
              {notifications.length > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{notifications.length > 99 ? '99+' : notifications.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <Animated.ScrollView
        style={[styles.content, {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.glassCard, { flex: 1, marginRight: 6 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="calendar" size={16} color="#3B82F6" style={{ marginRight: 6 }} />
              <Text style={styles.statLabel}>BOOKINGS</Text>
            </View>
            <Text style={styles.statValue}>{todaysBookingsCount}</Text>
          </View>
          <View style={[styles.glassCard, { flex: 1, marginLeft: 6 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="cash" size={16} color="#00D084" style={{ marginRight: 6 }} />
              <Text style={styles.statLabel}>REVENUE</Text>
            </View>
            <Text style={[styles.statValue, { color: '#00D084' }]}>PKR {todaysRevenue.toLocaleString()}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.glassCard}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionPillPrimary} onPress={() => router.push('/vendor-dashboard/calendar')}>
              <Ionicons name="calendar-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionPillTextPrimary}>View Calendar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionPillSecondary} onPress={() => router.push('/vendor-dashboard/bookings')}>
              <Ionicons name="layers-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionPillTextSecondary}>Manage</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Bookings */}
        <View style={[styles.glassCard, { marginBottom: 32 }]}>
          <Text style={styles.cardTitle}>Upcoming Bookings (Today)</Text>
          {upcoming.length === 0 ? (
            <Text style={styles.bookingDetailsEmpty}>No upcoming bookings found.</Text>
          ) : (
            upcoming.map((booking, index) => (
              <TouchableOpacity key={index} style={styles.bookingRow} onPress={() => router.push(`/vendor-dashboard/booking-detail?bookingId=${booking.id}`)}>
                <View style={styles.bookingAvatarBox}>
                  <Ionicons name="person" size={20} color="rgba(255,255,255,0.4)" />
                </View>
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingName}>{booking.customer_name || 'Customer'}</Text>
                  <Text style={styles.bookingDetails}>
                    {booking.time} • {booking.resource_name || booking.service || 'N/A'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, booking.status === 'pending' && styles.statusBadgePending]}>
                  <Text style={[styles.statusText, booking.status === 'pending' && styles.statusTextPending]}>
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
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/vendor-dashboard/calendar')}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={24} color="rgba(255,255,255,0.4)" />
          <Text style={styles.navText}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/vendor-dashboard/bookings')}
          activeOpacity={0.7}
        >
          <Ionicons name="list-outline" size={24} color="rgba(255,255,255,0.4)" />
          <Text style={styles.navText}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/vendor-dashboard/profile')}
          activeOpacity={0.7}
        >
          <Ionicons name="person-outline" size={24} color="rgba(255,255,255,0.4)" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications Modal */}
      <Modal
        visible={notificationsVisible}
        transparent={true}
        animationType="slide"
      >
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
                <Text style={styles.emptyText}>No notifications yet</Text>
                <Text style={styles.emptySubtext}>
                  You will see notifications for payments, cancellations, and upcoming slots here.
                </Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <View style={styles.notificationItem}>
                    <View style={styles.notificationIcon}>
                      <Ionicons
                        name={item.type === 'payment' ? 'cash-outline' : item.type === 'cancellation' ? 'close-circle-outline' : 'time-outline'}
                        size={20}
                        color={COLORS.primary}
                      />
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle}>{item.title}</Text>
                      <Text style={styles.notificationMessage}>{item.message}</Text>
                      <Text style={styles.notificationTime}>{item.time}</Text>
                    </View>
                  </View>
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
    marginBottom: 16,
  },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionPillPrimary: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 208, 132, 0.15)',
    borderColor: 'rgba(0, 208, 132, 0.3)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
  },
  actionPillTextPrimary: {
    color: '#00D084',
    fontWeight: '700',
    fontSize: 14,
  },
  actionPillSecondary: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
  },
  actionPillTextSecondary: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
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
  statusBadge: {
    paddingHorizontal: 12,
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
    fontSize: 10,
    color: '#00D084',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
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
  // Notifications Modal
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

