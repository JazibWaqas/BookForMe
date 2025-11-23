import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Vendor, Category } from '../../types';
import { getSportsVendors } from '../../services/vendors';
import { CATEGORIES } from '../../constants/categories';
import VendorCard from '../../components/VendorCard';
import CategoryScroll from '../../components/CategoryScroll';
import QuickActionGrid from '../../components/QuickActionGrid';
import Card from '../../components/ui/Card';

export default function HomeScreen() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadVendors = async () => {
    setLoading(true);
    const data = await getSportsVendors();
    setVendors(data);
    setLoading(false);
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVendors();
    setRefreshing(false);
  };

  const quickActions = [
    { id: '1', label: 'AI Assistant', icon: '🤖', onPress: () => router.push('/(tabs)/chatbot') },
    { id: '2', label: 'Find Match', icon: '🎮', onPress: () => router.push('/(tabs)/social') },
    { id: '3', label: 'My Bookings', icon: '📅', onPress: () => router.push('/(tabs)/profile') },
  ];

  const trendingVendors = vendors.slice(0, 5);
  const upcomingBookings = [];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          tintColor="#4ade80"
          colors={['#4ade80']}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.locationLabel}>Location</Text>
            <Text style={styles.locationText}>Karachi, Pakistan</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.signOutButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuIcon}>☰</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity 
          onPress={() => router.push('/category/sports')}
          style={styles.searchBar}
        >
          <Text style={styles.searchText}>Search venues, sports, locations…</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <QuickActionGrid actions={quickActions} />
      </View>

      {/* Categories */}
      <View style={styles.categorySection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <CategoryScroll 
          categories={CATEGORIES} 
          onCategoryPress={(category) => router.push(`/category/${category.id}`)} 
        />
      </View>

      {/* Trending */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending</Text>
          <TouchableOpacity onPress={() => router.push('/category/sports')}>
            <Text style={styles.viewAllText}>See More</Text>
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <Text style={styles.emptyText}>Loading venues...</Text>
        ) : trendingVendors.length > 0 ? (
          <View style={styles.vendorList}>
            {trendingVendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                onPress={() => router.push(`/vendor/${vendor.id}`)}
                onBookPress={() => router.push(`/vendor/${vendor.id}`)}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No venues found</Text>
        )}
      </View>

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
          <Card style={styles.bookingCard}>
            <View>
              <Text style={styles.bookingName}>Elite Padel Club</Text>
              <Text style={styles.bookingTime}>Today • 6:00 PM</Text>
            </View>
            <View style={styles.bookingBadge}>
              <Text style={styles.bookingBadgeText}>Confirmed</Text>
            </View>
          </Card>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#4b5563',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  locationLabel: {
    fontSize: 11,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#4b5563',
    borderRadius: 8,
  },
  signOutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d1d5db',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: '#4b5563',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    color: '#d1d5db',
  },
  searchBar: {
    height: 48,
    borderWidth: 2,
    borderColor: '#4b5563',
    borderRadius: 16,
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#1f1f1f',
    flexDirection: 'row',
  },
  searchText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  categorySection: {
    paddingVertical: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d1d5db',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  viewAllText: {
    fontSize: 12,
    color: '#6b7280',
    textDecorationLine: 'underline',
  },
  vendorList: {
    gap: 12,
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 32,
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookingName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f9fafb',
  },
  bookingTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  bookingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#6b7280',
    borderRadius: 8,
  },
  bookingBadgeText: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#e5e7eb',
  },
});
