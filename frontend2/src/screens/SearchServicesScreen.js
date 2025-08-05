import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeProvider';
import { useFavorites } from '../contexts/FavoritesProvider';

const { width } = Dimensions.get('window');

const servicesData = [
  {
    id: 1,
    name: 'Police Station',
    category: 'Emergency',
    distance: '0.5 km',
    rating: 4.2,
    reviews: 45,
    address: 'DHA Phase 6, Karachi',
    phone: '+92-21-1234567',
    isOpen: true,
    icon: 'shield',
    color: '#ef4444',
  },
  {
    id: 2,
    name: 'Fire Station',
    category: 'Emergency',
    distance: '1.2 km',
    rating: 4.5,
    reviews: 32,
    address: 'Clifton Block 2, Karachi',
    phone: '+92-21-1234568',
    isOpen: true,
    icon: 'flame',
    color: '#f59e0b',
  },
  {
    id: 3,
    name: 'Hospital',
    category: 'Healthcare',
    distance: '0.8 km',
    rating: 4.7,
    reviews: 89,
    address: 'Gulshan-e-Iqbal Block 7, Karachi',
    phone: '+92-21-1234569',
    isOpen: true,
    icon: 'medical',
    color: '#10b981',
  },
  {
    id: 4,
    name: 'Pharmacy',
    category: 'Healthcare',
    distance: '0.3 km',
    rating: 4.1,
    reviews: 23,
    address: 'DHA Phase 6, Karachi',
    phone: '+92-21-1234570',
    isOpen: true,
    icon: 'medical-outline',
    color: '#3b82f6',
  },
  {
    id: 5,
    name: 'Security Company',
    category: 'Security',
    distance: '0.7 km',
    rating: 4.3,
    reviews: 67,
    address: 'Clifton Block 4, Karachi',
    phone: '+92-21-1234571',
    isOpen: true,
    icon: 'lock-closed',
    color: '#8b5cf6',
  },
  {
    id: 6,
    name: 'Electrician',
    category: 'Utilities',
    distance: '0.4 km',
    rating: 4.0,
    reviews: 18,
    address: 'DHA Phase 6, Karachi',
    phone: '+92-21-1234572',
    isOpen: false,
    icon: 'flash',
    color: '#eab308',
  },
];

const categories = [
  { id: 'all', name: 'All', icon: 'grid' },
  { id: 'emergency', name: 'Emergency', icon: 'warning' },
  { id: 'healthcare', name: 'Healthcare', icon: 'medical' },
  { id: 'security', name: 'Security', icon: 'shield' },
  { id: 'utilities', name: 'Utilities', icon: 'construct' },
];

export default function SearchServicesScreen() {
  const { theme } = useTheme();
  const { addToFavorites, isFavorite } = useFavorites();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const styles = getStyles(theme);

  const filteredServices = servicesData.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                          service.category.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleServicePress = (service) => {
    Alert.alert(
      service.name,
      `Address: ${service.address}\nPhone: ${service.phone}\nDistance: ${service.distance}`,
      [
        { text: 'Call', onPress: () => Alert.alert('Calling...', `Calling ${service.phone}`) },
        { text: 'Directions', onPress: () => Alert.alert('Directions', 'Opening maps...') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const toggleFavorite = (service) => {
    if (isFavorite(service.id)) {
      Alert.alert('Remove from Favorites', 'Service removed from favorites');
    } else {
      addToFavorites({
        id: service.id.toString(),
        type: 'service',
        title: service.name,
        subtitle: service.category,
        location: service.address,
      });
      Alert.alert('Added to Favorites', 'Service added to favorites');
    }
  };

  const renderServiceCard = (service) => (
    <TouchableOpacity
      key={service.id}
      style={styles.serviceCard}
      onPress={() => handleServicePress(service)}
    >
      <View style={styles.serviceHeader}>
        <View style={[styles.serviceIcon, { backgroundColor: service.color }]}>
          <Ionicons name={service.icon} size={24} color="white" />
        </View>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.serviceCategory}>{service.category}</Text>
          <View style={styles.serviceMeta}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#f59e0b" />
              <Text style={styles.ratingText}>{service.rating}</Text>
              <Text style={styles.reviewsText}>({service.reviews})</Text>
            </View>
            <Text style={styles.distanceText}>{service.distance}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(service)}
        >
          <Ionicons
            name={isFavorite(service.id) ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorite(service.id) ? '#ef4444' : '#9ca3af'}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.serviceFooter}>
        <View style={styles.serviceDetails}>
          <Ionicons name="location" size={14} color="#6b7280" />
          <Text style={styles.serviceAddress}>{service.address}</Text>
        </View>
        <View style={styles.serviceStatus}>
          <View style={[styles.statusDot, { backgroundColor: service.isOpen ? '#10b981' : '#ef4444' }]} />
          <Text style={[styles.statusText, { color: service.isOpen ? '#10b981' : '#ef4444' }]}>
            {service.isOpen ? 'Open' : 'Closed'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons
              name={category.icon}
              size={20}
              color={selectedCategory === category.id ? '#3b82f6' : '#6b7280'}
            />
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Services List */}
      <ScrollView style={styles.servicesContainer} showsVerticalScrollIndicator={false}>
        {filteredServices.length > 0 ? (
          filteredServices.map(renderServiceCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>No services found</Text>
            <Text style={styles.emptyStateSubtitle}>
              Try adjusting your search or category filter
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme === 'dark' ? '#111827' : '#f8fafc',
  },
  searchHeader: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 8,
  },
  categoriesContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  categoryButtonActive: {
    backgroundColor: '#dbeafe',
  },
  categoryText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  categoryTextActive: {
    color: '#3b82f6',
  },
  servicesContainer: {
    flex: 1,
    padding: 16,
  },
  serviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  serviceCategory: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginLeft: 2,
  },
  reviewsText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 2,
  },
  distanceText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  favoriteButton: {
    padding: 4,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceAddress: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    flex: 1,
  },
  serviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
}); 