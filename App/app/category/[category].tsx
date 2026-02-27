import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Vendor } from '../../types';
import { getVendorsByCategory } from '../../services/vendors';
import VendorCard from '../../components/VendorCard';
import { COLORS } from '../../constants/colors';

export default function CategoryListingScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadVendors();
  }, [category]);

  const loadVendors = async () => {
    setLoading(true);
    try {
      const data = await getVendorsByCategory(category || '');
      setVendors(data);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>
              {category === 'padel' ? 'Padel Courts' :
                category === 'futsal' ? 'Futsal Courts' :
                  category === 'cricket' ? 'Cricket Nets' :
                    category === 'pickleball' ? 'Pickleball Courts' :
                      'Sports Courts'}
            </Text>
            <Text style={styles.subtitle}>{vendors.length} venues available</Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <TouchableOpacity style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
            <Text style={styles.searchText}>Search venues...</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Text style={styles.filterText}>Filters</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
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
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filtersList}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterTitle}>Price Range</Text>
                <Text style={styles.filterSubtext}>PKR 1000 - PKR 5000/hr</Text>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterTitle}>Amenities</Text>
                {['Parking', 'WiFi', 'AC Courts', 'Coaching', 'Showers', 'Cafeteria'].map((amenity) => (
                  <TouchableOpacity key={amenity} style={styles.filterOption}>
                    <View style={styles.checkbox} />
                    <Text style={styles.filterOptionText}>{amenity}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '500',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.4)',
    flex: 1,
  },
  filterButton: {
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00EA77',
  },
  content: {
    flex: 1,
  },
  vendorGrid: {
    padding: 16,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  filtersList: {
    padding: 20,
  },
  filterGroup: {
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 12,
  },
  filterSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)'
  },
  filterOptionText: {
    fontSize: 15,
    color: '#FFF',
  },
  applyButton: {
    margin: 20,
    height: 56,
    backgroundColor: '#00EA77',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
});
