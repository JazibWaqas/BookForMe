import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Vendor } from '../../types';
import { getSportsVendors, getVendorsByCategory } from '../../services/vendors';
import VendorCard from '../../components/VendorCard';

export default function CategoryListingScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVendors();
  }, [category]);

  const loadVendors = async () => {
    setLoading(true);
    const data = category === 'sports' 
      ? await getSportsVendors()
      : await getVendorsByCategory(category || '');
    setVendors(data);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>
              {category === 'sports' ? 'Sports Courts' : category}
            </Text>
            <Text style={styles.subtitle}>{vendors.length} venues found</Text>
          </View>
        </View>
        
        <View style={styles.searchRow}>
          <TouchableOpacity style={styles.searchBar}>
            <Text style={styles.searchText}>Search venues or locations…</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sortButton}>
            <Text style={styles.sortText}>Top</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.sidebar}>
          <ScrollView style={styles.filters}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterTitle}>Price / hr</Text>
              <View style={styles.sliderPlaceholder}>
                <Text style={styles.placeholderText}>Slider</Text>
              </View>
            </View>
            
            <View style={styles.filterGroup}>
              <Text style={styles.filterTitle}>Amenities</Text>
              {['Parking', 'WiFi', 'AC Courts', 'Coaching'].map((amenity) => (
                <TouchableOpacity key={amenity} style={styles.checkboxRow}>
                  <View style={styles.checkbox} />
                  <Text style={styles.checkboxLabel}>{amenity}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <ScrollView style={styles.venueList}>
          {loading ? (
            <Text style={styles.emptyText}>Loading venues...</Text>
          ) : vendors.length > 0 ? (
            <View style={styles.vendorGrid}>
              {vendors.map((vendor) => (
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
        </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#4b5563',
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: '#4b5563',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: '#d1d5db',
    fontSize: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f9fafb',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
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
  sortButton: {
    width: 48,
    height: 48,
    borderWidth: 2,
    borderColor: '#4b5563',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f1f1f',
  },
  sortText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 128,
    borderRightWidth: 1,
    borderRightColor: '#4b5563',
    backgroundColor: '#1a1a1a',
  },
  filters: {
    padding: 12,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  sliderPlaceholder: {
    height: 80,
    borderWidth: 2,
    borderColor: '#4b5563',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f1f1f',
  },
  placeholderText: {
    fontSize: 12,
    color: '#6b7280',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  checkboxLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  venueList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  vendorGrid: {
    gap: 16,
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 32,
  },
});
