import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { COLORS } from '../../constants/colors';
import { authService } from '../../services/auth';
import { format } from 'date-fns';
import { useCurrentUser, useUserBookings } from '../../hooks/useQueries';

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
  
  // Use React Query hooks for data fetching with caching
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: allBookings = [], isLoading: bookingsLoading } = useUserBookings();
  
  // Only wait for user data, bookings can load async
  const loading = userLoading;
  
  // Calculate derived data
  const bookingsCount = allBookings.length;
  const completedBookings = allBookings.filter((b: any) => b.status === 'completed').length;
  const upcomingBookings = allBookings.filter((b: any) => 
    b.status === 'confirmed' || b.status === 'pending'
  ).length;
  const recentBookings = allBookings
    .filter((b: any) => b.status === 'confirmed' || b.status === 'completed')
    .slice(0, 3);

  // Check user role and redirect if vendor
  useFocusEffect(
    React.useCallback(() => {
      const checkRole = async () => {
        const role = await AsyncStorage.getItem('userRole');
        if (role === 'vendor') {
          router.replace('/vendor-dashboard');
          return;
        }
        setUserRole(role as 'customer' | 'vendor' | null);
      };
      checkRole();
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

  const menuItems: Array<{ icon: string; label: string; action?: string; route?: string }> = [
    { icon: 'person-outline', label: 'Edit Profile', action: 'edit' },
    { icon: 'notifications-outline', label: 'Notifications', route: '/notifications' },
    { icon: 'help-circle-outline', label: 'Help & Support', action: 'support' },
    { icon: 'information-circle-outline', label: 'About', action: 'about' },
  ];

  const handleMenuAction = (action?: string, route?: string) => {
    if (route) {
      router.push(route as any);
      return;
    }

    switch (action) {
      case 'edit':
        Alert.alert('Edit Profile', 'Profile editing feature coming soon!');
        break;
      case 'support':
        Alert.alert(
          'Help & Support',
          'Need help? Contact us:\n\nEmail: support@bookforme.pk\nPhone: +92 300 1234567\n\nWe\'re here to help!'
        );
        break;
      case 'about':
        Alert.alert(
          'About BookForMe',
          'Version 1.0.0\n\nYour one-stop platform for booking sports venues in Karachi.\n\n© 2025 BookForMe'
        );
        break;
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              await AsyncStorage.removeItem('userRole');
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => Alert.alert(
            'Settings',
            'Choose an option',
            [
              { text: 'Edit Profile', onPress: () => handleMenuAction('edit') },
              { text: 'About', onPress: () => handleMenuAction('about') },
              { text: 'Cancel', style: 'cancel' }
            ]
          )}
        >
          <Ionicons name="settings-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.profileCard}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.editAvatarButton}
                onPress={() => Alert.alert('Change Photo', 'Profile photo upload feature coming soon!')}
              >
                <Ionicons name="camera" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || user?.phone || 'No email'}</Text>
          </View>

          <View style={styles.statsRow}>
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => router.push('/bookings')}
              disabled={bookingsLoading}
            >
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(74, 222, 128, 0.1)' }]}>
                <Ionicons name="calendar" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.statValue}>{bookingsLoading ? '-' : upcomingBookings}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => router.push('/bookings')}
              disabled={bookingsLoading}
            >
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
              </View>
              <Text style={styles.statValue}>{bookingsLoading ? '-' : completedBookings}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </TouchableOpacity>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Ionicons name="calendar-outline" size={20} color="#f59e0b" />
              </View>
              <Text style={styles.statValue}>{bookingsLoading ? '-' : bookingsCount}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </Card>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            <TouchableOpacity onPress={() => router.push('/bookings')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {bookingsLoading ? (
            <Card style={styles.emptyCard}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.emptySubtext}>Loading bookings...</Text>
            </Card>
          ) : recentBookings.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.textMuted} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>No bookings yet</Text>
              <Text style={styles.emptySubtext}>Book a court to get started!</Text>
              <Button
                title="Find a Court"
                onPress={() => router.push('/(tabs)/home')}
                style={{ marginTop: 16, minWidth: 150 }}
                variant="outline"
              />
            </Card>
          ) : (
            recentBookings.map((booking, i) => (
              <Card key={booking.id || i} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <View style={styles.bookingInfo}>
                    <Text style={styles.bookingTitle}>
                      {booking.vendor?.name || booking.vendor?.business_name || 'Venue'}
                    </Text>
                    <View style={styles.bookingDateRow}>
                      <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                      <Text style={styles.bookingDate}>
                        {formatBookingDate(booking.date)} • {formatBookingTime(booking.time || booking.start_time)}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, {
                    backgroundColor: booking.status === 'confirmed' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(59, 130, 246, 0.1)'
                  }]}>
                    <Text style={[styles.statusText, {
                      color: booking.status === 'confirmed' ? COLORS.success : COLORS.primary
                    }]}>
                      {booking.status === 'confirmed' ? 'Confirmed' : 'Completed'}
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/bookings')}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.text} />
                </View>
                <Text style={styles.menuItemLabel}>My Bookings</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>

            {menuItems.map((item, i) => (
              <TouchableOpacity 
                key={i} 
                style={styles.menuItem}
                onPress={() => handleMenuAction(item.action, item.route)}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconContainer}>
                    <Ionicons name={item.icon as any} size={20} color={COLORS.text} />
                  </View>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title="Sign Out"
          variant="outline"
          style={styles.signOutButton}
          textStyle={styles.signOutText}
          icon={<Ionicons name="log-out-outline" size={20} color={COLORS.error} style={{ marginRight: 8 }} />}
          onPress={handleSignOut}
        />

        <View style={{ height: 40 }} />
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
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  settingsButton: {
    padding: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileCard: {
    marginBottom: 24,
    padding: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.surface,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.text,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  bookingCard: {
    marginBottom: 12,
    padding: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  bookingDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookingDate: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  menuContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  signOutButton: {
    marginTop: 8,
    borderColor: COLORS.error,
  },
  signOutText: {
    color: COLORS.error,
  },
});


