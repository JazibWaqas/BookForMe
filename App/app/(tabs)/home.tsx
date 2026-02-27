import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, Image, ActivityIndicator, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Vendor, Category } from '../../types';
import VendorCard from '../../components/VendorCard';
import { COLORS, GRADIENTS, SHADOWS } from '../../constants/colors';
import { getCourtImage } from '../../constants/images';
import { useCategories, useVendorsBySport } from '../../hooks/useQueries';

// Icon mapping for categories
const categoryIcons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
  padel: 'tennisball',
  futsal: 'football',
  cricket: 'baseball',
  pickleball: 'tennisball-outline',
};

// Per-sport gradient colors — inject energy into the browse section
const categoryGradients: { [key: string]: readonly [string, string, ...string[]] } = {
  padel: ['#0A2218', '#0D2E1E', '#08090F'],
  futsal: ['#0A1230', '#0D1840', '#08090F'],
  cricket: ['#2A1800', '#381F00', '#08090F'],
  pickleball: ['#031A20', '#042530', '#08090F'],
};

// Per-sport icon accent colors
const categoryIconColors: { [key: string]: string } = {
  padel: '#00D084',
  futsal: '#60A5FA',
  cricket: '#FF9F0A',
  pickleball: '#22D3EE',
};

export default function HomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Use React Query hooks - data is cached and shared across app
  const { data: categories = [], isLoading: categoriesLoading, refetch: refetchCategories } = useCategories();
  const { data: padelVendors = [], isLoading: padelLoading, refetch: refetchPadel } = useVendorsBySport('padel');
  const { data: futsalVendors = [], isLoading: futsalLoading, refetch: refetchFutsal } = useVendorsBySport('futsal');
  const { data: cricketVendors = [], isLoading: cricketLoading, refetch: refetchCricket } = useVendorsBySport('cricket');
  const { data: pickleballVendors = [], isLoading: pickleballLoading, refetch: refetchPickleball } = useVendorsBySport('pickleball');

  const loading = categoriesLoading || padelLoading || futsalLoading || cricketLoading || pickleballLoading;
  const [refreshing, setRefreshing] = useState(false);

  // Combine all vendors for search
  const allVendors = useMemo(() =>
    [...padelVendors, ...futsalVendors, ...cricketVendors, ...pickleballVendors],
    [padelVendors, futsalVendors, cricketVendors, pickleballVendors]
  );

  // Filter vendors based on search query
  const filteredVendors = useMemo(() => {
    if (!searchQuery.trim()) return allVendors;

    const query = searchQuery.toLowerCase();
    return allVendors.filter(vendor =>
      vendor.name?.toLowerCase().includes(query) ||
      vendor.area?.toLowerCase().includes(query) ||
      vendor.address?.toLowerCase().includes(query) ||
      vendor.category?.toLowerCase().includes(query)
    );
  }, [allVendors, searchQuery]);

  // Also filter each sport category for the horizontal lists
  const filteredPadelVendors = useMemo(() => {
    if (!searchQuery.trim()) return padelVendors;
    const query = searchQuery.toLowerCase();
    return padelVendors.filter(v =>
      v.name?.toLowerCase().includes(query) || v.area?.toLowerCase().includes(query)
    );
  }, [padelVendors, searchQuery]);

  const filteredFutsalVendors = useMemo(() => {
    if (!searchQuery.trim()) return futsalVendors;
    const query = searchQuery.toLowerCase();
    return futsalVendors.filter(v =>
      v.name?.toLowerCase().includes(query) || v.area?.toLowerCase().includes(query)
    );
  }, [futsalVendors, searchQuery]);

  const filteredCricketVendors = useMemo(() => {
    if (!searchQuery.trim()) return cricketVendors;
    const query = searchQuery.toLowerCase();
    return cricketVendors.filter(v =>
      v.name?.toLowerCase().includes(query) || v.area?.toLowerCase().includes(query)
    );
  }, [cricketVendors, searchQuery]);

  const filteredPickleballVendors = useMemo(() => {
    if (!searchQuery.trim()) return pickleballVendors;
    const query = searchQuery.toLowerCase();
    return pickleballVendors.filter(v =>
      v.name?.toLowerCase().includes(query) || v.area?.toLowerCase().includes(query)
    );
  }, [pickleballVendors, searchQuery]);

  // React Query handles loading and caching
  // Real-time updates can be added later via queryClient.setQueryData if needed

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchCategories(),
      refetchPadel(),
      refetchFutsal(),
      refetchCricket(),
      refetchPickleball(),
    ]);
    setRefreshing(false);
  };

  if (loading && categories.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 12, color: COLORS.textMuted }}>Loading venues...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Seamless Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Hello</Text>
            <TouchableOpacity style={styles.locationRow}>
              <Ionicons name="location" size={16} color={COLORS.primary} />
              <Text style={styles.location}>Karachi, DHA</Text>
              <Ionicons name="chevron-down" size={14} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <LinearGradient
              colors={[COLORS.primary + '40', COLORS.primary + '15']}
              style={styles.profileGradientRing}
            >
              <Ionicons name="person-circle" size={36} color={COLORS.primary} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search venues, areas..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
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
        {/* Search Results */}
        {searchQuery.trim() ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {filteredVendors.length} {filteredVendors.length === 1 ? 'venue' : 'venues'} found
            </Text>
            {filteredVendors.length > 0 ? (
              <View style={styles.searchResults}>
                {filteredVendors.map((vendor) => (
                  <View key={vendor.id} style={styles.searchResultCard}>
                    <VendorCard
                      vendor={vendor}
                      onPress={() => router.push(`/vendor/${vendor.id}`)}
                      onBookPress={() => router.push(`/vendor/${vendor.id}`)}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptySearch}>
                <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptySearchText}>No venues found</Text>
                <Text style={styles.emptySearchSubtext}>
                  Try searching with a different keyword
                </Text>
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Categories - Sleek Pills */}
            <View style={styles.categoriesSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryPillsScroll}
              >
                {categories.map((cat) => {
                  const iconColor = categoryIconColors[cat.id] || COLORS.primary;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryPill, { borderColor: iconColor + '30', backgroundColor: iconColor + '08' }]}
                      onPress={() => router.push(`/category/${cat.id}`)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={categoryIcons[cat.id] || 'tennisball'}
                        size={16}
                        color={iconColor}
                      />
                      <Text style={styles.categoryPillText}>{cat.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Padel Courts - Horizontal Scroll */}
            {filteredPadelVendors.length > 0 && (
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
                  {filteredPadelVendors.slice(0, 5).map((vendor) => (
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
            {filteredFutsalVendors.length > 0 && (
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
                  {filteredFutsalVendors.slice(0, 5).map((vendor) => (
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

            {/* Cricket Nets - Horizontal Scroll */}
            {filteredCricketVendors.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Cricket Nets</Text>
                  <TouchableOpacity onPress={() => router.push('/category/cricket')}>
                    <Text style={styles.viewAll}>View All →</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.vendorsScroll}
                >
                  {filteredCricketVendors.slice(0, 5).map((vendor) => (
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

            {/* Pickleball Courts - Horizontal Scroll */}
            {filteredPickleballVendors.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Pickleball Courts</Text>
                  <TouchableOpacity onPress={() => router.push('/category/pickleball')}>
                    <Text style={styles.viewAll}>View All →</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.vendorsScroll}
                >
                  {filteredPickleballVendors.slice(0, 5).map((vendor) => (
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


          </>
        )}

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
    paddingTop: 52,
    paddingBottom: 18,
    paddingHorizontal: 20,
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
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  location: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  profileButton: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  profileGradientRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    height: 46,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    gap: 10,
  },
  searchInput: {
    fontSize: 15,
    color: COLORS.text,
    flex: 1,
    height: '100%',
  },
  searchResults: {
    paddingHorizontal: 20,
    gap: 16,
  },
  searchResultCard: {
    marginBottom: 16,
  },
  emptySearch: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptySearchText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySearchSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingVertical: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4,
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
    opacity: 0.9,
  },
  categoriesSection: {
    paddingVertical: 16,
  },
  categoryPillsScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
  },
  categoryPillText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  vendorsScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  vendorCardWrapper: {
    width: 280,
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
