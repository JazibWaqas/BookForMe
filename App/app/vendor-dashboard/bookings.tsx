import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { COLORS } from '../../constants/colors';

export default function VendorBookingsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');

  const bookings = [
    { id: 'BK001', customer: 'Ahmed Khan', date: 'Nov 23', time: '10:00 AM', court: 'Court 1', status: 'confirmed', amount: 'PKR 1250' },
    { id: 'BK002', customer: 'Sara Ali', date: 'Nov 23', time: '11:00 AM', court: 'Court 2', status: 'confirmed', amount: 'PKR 1250' },
    { id: 'BK003', customer: 'Bilal Shah', date: 'Nov 24', time: '2:00 PM', court: 'Court 1', status: 'pending', amount: 'PKR 1250' },
    { id: 'BK004', customer: 'Fatima Malik', date: 'Nov 24', time: '4:00 PM', court: 'Court 2', status: 'confirmed', amount: 'PKR 1250' },
    { id: 'BK005', customer: 'Hassan Raza', date: 'Nov 25', time: '9:00 AM', court: 'Court 1', status: 'cancelled', amount: 'PKR 1250' },
  ];

  const filteredBookings = bookings.filter((b) => {
    if (filter !== 'all' && b.status !== filter) return false;
    if (searchQuery && !b.customer.toLowerCase().includes(searchQuery.toLowerCase()) && !b.id.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Bookings</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        <Input
          placeholder="Search by name or booking ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />

        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {(['all', 'confirmed', 'pending', 'cancelled'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={styles.bookingsList}>
          {filteredBookings.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              onPress={() => router.push(`/vendor-dashboard/booking-detail?bookingId=${booking.id}`)}
              activeOpacity={0.7}
            >
              <Card style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingId}>#{booking.id}</Text>
                  <View style={[
                    styles.statusBadge,
                    booking.status === 'pending' && styles.statusBadgePending,
                    booking.status === 'cancelled' && styles.statusBadgeCancelled,
                  ]}>
                    <Text style={[
                      styles.statusText,
                      booking.status === 'pending' && styles.statusTextPending,
                      booking.status === 'cancelled' && styles.statusTextCancelled,
                    ]}>
                      {booking.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.customerName}>{booking.customer}</Text>

                <View style={styles.bookingDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date:</Text>
                    <Text style={styles.detailValue}>{booking.date}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Time:</Text>
                    <Text style={styles.detailValue}>{booking.time}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Court:</Text>
                    <Text style={styles.detailValue}>{booking.court}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount:</Text>
                    <Text style={styles.amountValue}>{booking.amount}</Text>
                  </View>
                </View>

                <View style={styles.viewDetailsHint}>
                  <Text style={styles.viewDetailsText}>Tap to view details →</Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  searchInput: {
    marginBottom: 16,
  },
  filterScroll: {
    marginBottom: 20,
    maxHeight: 40,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
  },
  filterChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  filterText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  filterTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  bookingsList: {
    flex: 1,
  },
  bookingCard: {
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingId: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 6,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  statusBadgePending: {
    borderColor: COLORS.warning,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  statusBadgeCancelled: {
    borderColor: COLORS.error,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
  statusTextCancelled: {
    color: COLORS.error,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  bookingDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  detailValue: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  amountValue: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButtonConfirm: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  actionButtonTextConfirm: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  actionButtonCancel: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonTextCancel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  viewDetailsHint: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

