import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
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

  // Auto-reload dashboard data every 5 seconds
  useEffect(() => {
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
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>{vendorName}</Text>
        </View>
        <TouchableOpacity onPress={() => setNotificationsVisible(true)} style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
          {notifications.length > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{notifications.length > 99 ? '99+' : notifications.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>TODAY'S BOOKINGS</Text>
            <Text style={styles.statValue}>{todaysBookingsCount}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>TODAY'S REVENUE</Text>
            <Text style={styles.statValue}>PKR {todaysRevenue.toLocaleString()}</Text>
          </Card>
        </View>

        <Card>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.actions}>
            <Button
              title="View Calendar"
              onPress={() => router.push('/vendor-dashboard/calendar')}
              variant="outline"
            />
            <Button
              title="Manage Bookings"
              onPress={() => router.push('/vendor-dashboard/bookings')}
              variant="outline"
            />
          </View>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Upcoming Bookings (Today)</Text>
          {upcoming.length === 0 ? (
            <Text style={styles.bookingDetails}>No upcoming bookings found.</Text>
          ) : (
            upcoming.map((booking, index) => (
              <TouchableOpacity key={index} style={styles.bookingRow} onPress={() => router.push(`/vendor-dashboard/booking-detail?bookingId=${booking.id}`)}>
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingName}>{booking.customer_name || 'Customer'}</Text>
                  <Text style={styles.bookingDetails}>
                    {booking.time} • Court {booking.resource_name || booking.service || 'N/A'}
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
        </Card>

        <View style={{ height: 32 }} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <View style={styles.navIconContainer}>
            <View style={[styles.dashIcon, styles.navIconActive]} />
            <View style={[styles.dashIconSmall, styles.navIconActive]} />
          </View>
          <Text style={[styles.navText, styles.navTextActive]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/vendor-dashboard/calendar')}
          activeOpacity={0.7}
        >
          <View style={styles.navIconContainer}>
            <View style={styles.calIcon} />
          </View>
          <Text style={styles.navText}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/vendor-dashboard/bookings')}
          activeOpacity={0.7}
        >
          <View style={styles.navIconContainer}>
            <View style={styles.bookIcon} />
            <View style={styles.bookIconLine} />
          </View>
          <Text style={styles.navText}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/vendor-dashboard/profile')}
          activeOpacity={0.7}
        >
          <View style={styles.navIconContainer}>
            <View style={styles.profIcon} />
            <View style={styles.profIconBody} />
          </View>
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  actions: {
    gap: 8,
  },
  bookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingName: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  bookingDetails: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  statusBadgePending: {
    borderColor: COLORS.warning,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  statusText: {
    fontSize: 10,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusTextPending: {
    color: COLORS.warning,
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingBottom: 28, // Increased for S22 Ultra and gesture navigation
    paddingTop: 8,
  },
  navItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 4,
  },
  navIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  // Dashboard icon (grid)
  dashIcon: {
    width: 10,
    height: 10,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  dashIconSmall: {
    width: 10,
    height: 10,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  // Calendar icon
  calIcon: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    borderRadius: 4,
    borderTopWidth: 4,
  },
  // Bookings icon (list)
  bookIcon: {
    width: 18,
    height: 3,
    backgroundColor: COLORS.textMuted,
    position: 'absolute',
    top: 4,
  },
  bookIconLine: {
    width: 18,
    height: 3,
    backgroundColor: COLORS.textMuted,
    position: 'absolute',
    bottom: 4,
  },
  // Profile icon
  profIcon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    position: 'absolute',
    top: 0,
  },
  profIconBody: {
    width: 14,
    height: 8,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    borderTopWidth: 0,
    position: 'absolute',
    bottom: 0,
  },
  navIconActive: {
    borderColor: COLORS.primary,
  },
  navText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  navTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
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

