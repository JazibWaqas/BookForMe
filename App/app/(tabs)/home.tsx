import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Vendor } from '../../types';
import { getSportsVendors, getVendorsByCategory } from '../../services/vendors';
import { CATEGORIES } from '../../constants/categories';
import VendorCard from '../../components/VendorCard';
import { COLORS } from '../../constants/colors';
import { getCourtImage } from '../../constants/images';

export default function HomeScreen() {
  const router = useRouter();
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [padelVendors, setPadelVendors] = useState<Vendor[]>([]);
  const [futsalVendors, setFutsalVendors] = useState<Vendor[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadVendors = async () => {
    setLoading(true);
    const [all, padel, futsal] = await Promise.all([
      getSportsVendors(),
      getVendorsByCategory('Padel Court'),
      getVendorsByCategory('Futsal Court'),
    ]);
    setAllVendors(all);
    setPadelVendors(padel);
    setFutsalVendors(futsal);
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Hello</Text>
            <TouchableOpacity style={styles.locationRow}>
              <Text style={styles.location}>Karachi, DHA</Text>
              <Text style={styles.locationArrow}>▼</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={styles.profileIconCircle} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/chatbot')}
          style={styles.searchBar}
        >
          <Text style={styles.searchText}>Search venues...</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Categories - Horizontal Scroll */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Sport</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryCard}
                onPress={() => router.push(`/category/${cat.id}`)}
              >
                <View style={styles.categoryContent}>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  <Text style={styles.categoryCount}>{cat.count} venues</Text>
                  <View style={styles.categoryArrow}>
                    <Text style={styles.categoryArrowText}>→</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Padel Courts - Horizontal Scroll */}
        {padelVendors.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Padel Courts</Text>
              <TouchableOpacity onPress={() => router.push('/category/padel')}>
                <Text style={styles.viewAll}>View All →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.vendorsScroll}
            >
              {padelVendors.slice(0, 5).map((vendor) => (
                <View key={vendor.id} style={styles.vendorCardWrapper}>
                  <VendorCard
                    vendor={vendor}
                    onPress={() => router.push(`/vendor/${vendor.id}`)}
                    onBookPress={() => router.push(`/vendor/${vendor.id}`)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Futsal Courts - Horizontal Scroll */}
        {futsalVendors.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Futsal Courts</Text>
              <TouchableOpacity onPress={() => router.push('/category/futsal')}>
                <Text style={styles.viewAll}>View All →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.vendorsScroll}
            >
              {futsalVendors.slice(0, 5).map((vendor) => (
                <View key={vendor.id} style={styles.vendorCardWrapper}>
                  <VendorCard
                    vendor={vendor}
                    onPress={() => router.push(`/vendor/${vendor.id}`)}
                    onBookPress={() => router.push(`/vendor/${vendor.id}`)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/chatbot')}
            >
              <Text style={styles.actionLabel}>AI Assistant</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/social')}
            >
              <Text style={styles.actionLabel}>Find Players</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/notifications')}
            >
              <Text style={styles.actionLabel}>Notifications</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: COLORS.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  location: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  locationArrow: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  searchBar: {
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchText: {
    fontSize: 15,
    color: COLORS.textMuted,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingTop: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryCard: {
    width: 160,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryCount: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  categoryArrow: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  categoryArrowText: {
    fontSize: 18,
    color: COLORS.primary,
  },
  vendorsScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  vendorCardWrapper: {
    width: 280,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    height: 80,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  // AI Chatbot FAB
  chatFab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 2,
  },
  fabChatBubble: {
    width: 24,
    height: 20,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: COLORS.textDark,
  },
  fabSparkle1: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textDark,
    position: 'absolute',
    top: -2,
    right: -2,
  },
  fabSparkle2: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textDark,
    position: 'absolute',
    bottom: -2,
    left: -2,
  },
  fabText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textDark,
    marginTop: 2,
  },
});
