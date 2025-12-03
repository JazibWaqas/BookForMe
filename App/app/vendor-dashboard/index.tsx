import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { COLORS } from '../../constants/colors';

export default function VendorDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Golden Court Padel Club</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/notifications')}>
          <View style={styles.iconButton}>
            <Text style={styles.iconText}>Notifications</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>TODAY'S BOOKINGS</Text>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statSubtext}>+3 from yesterday</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>TODAY'S REVENUE</Text>
            <Text style={styles.statValue}>PKR 15K</Text>
            <Text style={styles.statSubtext}>+12% from avg</Text>
          </Card>
        </View>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>THIS WEEK</Text>
            <Text style={styles.statValue}>78</Text>
            <Text style={styles.statSubtext}>bookings</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>THIS MONTH</Text>
            <Text style={styles.statValue}>PKR 280K</Text>
            <Text style={styles.statSubtext}>revenue</Text>
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
          <Text style={styles.cardTitle}>Recent Bookings</Text>
          {[
            { name: 'Ahmed Khan', time: '10:00 AM', court: 'Court 1', status: 'confirmed' },
            { name: 'Sara Ali', time: '11:00 AM', court: 'Court 2', status: 'confirmed' },
            { name: 'Bilal Shah', time: '2:00 PM', court: 'Court 1', status: 'pending' },
          ].map((booking, index) => (
            <View key={index} style={styles.bookingRow}>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingName}>{booking.name}</Text>
                <Text style={styles.bookingDetails}>
                  {booking.time} • {booking.court}
                </Text>
              </View>
              <View style={[styles.statusBadge, booking.status === 'pending' && styles.statusBadgePending]}>
                <Text style={[styles.statusText, booking.status === 'pending' && styles.statusTextPending]}>
                  {booking.status}
                </Text>
              </View>
            </View>
          ))}
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
  iconButton: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 10,
    color: COLORS.textMuted,
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
});

