import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
            <Text style={styles.backText}>←</Text>
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
                <Text style={styles.modalClose}>✕</Text>
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
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backText: {
    fontSize: 20,
    color: COLORS.text,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchBar: {
    flex: 1,
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
  filterButton: {
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  vendorGrid: {
    padding: 20,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.backgroundLight,
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
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalClose: {
    fontSize: 24,
    color: COLORS.textMuted,
  },
  filtersList: {
    padding: 20,
  },
  filterGroup: {
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  filterSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
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
    borderColor: COLORS.border,
    borderRadius: 6,
  },
  filterOptionText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  applyButton: {
    margin: 20,
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
});
