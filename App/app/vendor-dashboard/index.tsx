import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function VendorDashboardScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Golden Court Padel Club</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/notifications')}>
          <View style={styles.iconButton}>
            <Text style={styles.iconText}>🔔</Text>
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
        <TouchableOpacity style={styles.navItem}>
          <Text style={[styles.navText, styles.navTextActive]}>🏠 Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/vendor-dashboard/calendar')}
        >
          <Text style={styles.navText}>📅 Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/vendor-dashboard/bookings')}
        >
          <Text style={styles.navText}>📋 Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Text style={styles.navText}>👤 Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#4b5563',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f9fafb',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: '#4b5563',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
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
    color: '#6b7280',
    letterSpacing: 1,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f9fafb',
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
    borderTopColor: '#4b5563',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingName: {
    fontSize: 14,
    color: '#f9fafb',
    marginBottom: 4,
  },
  bookingDetails: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#4ade80',
    borderRadius: 8,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  statusBadgePending: {
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  statusText: {
    fontSize: 10,
    color: '#4ade80',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusTextPending: {
    color: '#fbbf24',
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: '#4b5563',
    backgroundColor: '#1f1f1f',
  },
  navItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  navText: {
    fontSize: 10,
    color: '#6b7280',
  },
  navTextActive: {
    color: '#4ade80',
    fontWeight: '600',
  },
});

