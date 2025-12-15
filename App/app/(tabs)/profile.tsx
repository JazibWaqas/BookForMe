import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { COLORS } from '../../constants/colors';
import { authService } from '../../services/auth';
import { getUserBookings } from '../../services/bookings';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<'customer' | 'vendor' | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  // Check user role and load data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const loadUserData = async () => {
        setLoading(true);
        try {
          const role = await AsyncStorage.getItem('userRole');
          if (role === 'vendor') {
            // Redirect vendor to vendor dashboard
            router.replace('/vendor-dashboard');
            return;
          }

          setUserRole(role as 'customer' | 'vendor' | null);

          // Fetch user profile
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          }

          // Fetch bookings for statistics
          const bookings = await getUserBookings();
          setBookingsCount(bookings.length);

          // Get recent 3 bookings
          const recent = bookings
            .filter(b => b.status === 'confirmed' || b.status === 'completed')
            .slice(0, 3);
          setRecentBookings(recent);

        } catch (error) {
          console.error('Error loading user data:', error);
        } finally {
          setLoading(false);
        }
      };
      loadUserData();
    }, [router])
  );

  const formatBookingDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const formatBookingTime = (timeStr: string) => {
    try {
      if (!timeStr) return '';

      // If it's an ISO timestamp, extract the time part
      if (timeStr.includes('T')) {
        const timePart = timeStr.split('T')[1].split('+')[0].split('-')[0];
        const [hours, minutes] = timePart.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
      }

      // Simple HH:MM format
      if (timeStr?.includes(':')) {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
      }
      return timeStr;
    } catch {
      return timeStr;
    }
  };

  // Show loading state while checking role
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textMuted, marginTop: 12 }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Manage your account</Text>
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.profileCard}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <View style={styles.avatarInner}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            </View>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || user?.phone || 'No email'}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{bookingsCount}</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{bookingsCount * 50}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          {recentBookings.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No bookings yet</Text>
              <Text style={styles.emptySubtext}>Book a court to get started!</Text>
            </Card>
          ) : (
            recentBookings.map((booking, i) => (
              <Card key={booking.id || i} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingTitle}>
                    {booking.vendor?.name || booking.vendor?.business_name || 'Venue'}
                  </Text>
                  <Text style={[styles.bookingStatus, {
                    color: booking.status === 'confirmed' ? COLORS.success : COLORS.primary
                  }]}>
                    {booking.status === 'confirmed' ? 'Confirmed' : 'Completed'}
                  </Text>
                </View>
                <Text style={styles.bookingDate}>
                  {formatBookingDate(booking.date)} • {formatBookingTime(booking.time || booking.start_time)}
                </Text>
                <Text style={styles.bookingPrice}>PKR {booking.amount || 0}</Text>
              </Card>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/bookings')}
          >
            <Card style={styles.settingCard}>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>My Bookings</Text>
                <Text style={styles.settingArrow}>→</Text>
              </View>
            </Card>
          </TouchableOpacity>
          {[
            { label: 'Edit Profile' },
            { label: 'Notifications' },
            { label: 'Payment Methods' },
            { label: 'Help & Support' },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={styles.settingItem}>
              <Card style={styles.settingCard}>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  <Text style={styles.settingArrow}>→</Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Sign Out"
          variant="outline"
          onPress={async () => {
            await AsyncStorage.removeItem('userRole');
            router.replace('/(auth)/login');
          }}
        />

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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.backgroundLight,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  profileCard: {
    marginBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.surface,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  avatarInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  bookingCard: {
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bookingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  bookingStatus: {
    fontSize: 12,
    color: COLORS.primary,
  },
  bookingDate: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  bookingPrice: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  settingItem: {
    marginBottom: 12,
  },
  settingCard: {
    padding: 0,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  settingArrow: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});


