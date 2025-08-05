import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeProvider';
import { useFavorites } from '../contexts/FavoritesProvider';

const propertyData = [
  {
    id: 1,
    name: 'DHA Phase 6 Villa',
    type: 'Villa',
    price: 'PKR 45,000,000',
    area: '500 sq yards',
    bedrooms: 4,
    bathrooms: 3,
    location: 'DHA Phase 6, Karachi',
    safety: 9.5,
    amenities: 8.8,
    investment: 9.2,
    description: 'Beautiful villa in a secure neighborhood with modern amenities.',
    features: ['Security Guard', 'Parking', 'Garden', 'Modern Kitchen'],
    images: ['🏠', '🌳', '🚗'],
    verified: true,
  },
  {
    id: 2,
    name: 'Clifton Apartment',
    type: 'Apartment',
    price: 'PKR 25,000,000',
    area: '1,200 sq ft',
    bedrooms: 3,
    bathrooms: 2,
    location: 'Clifton Block 2, Karachi',
    safety: 9.0,
    amenities: 9.2,
    investment: 8.8,
    description: 'Luxury apartment with sea view and premium facilities.',
    features: ['Sea View', 'Gym', 'Pool', '24/7 Security'],
    images: ['🏢', '🌊', '🏊'],
    verified: true,
  },
  {
    id: 3,
    name: 'Gulshan House',
    type: 'House',
    price: 'PKR 35,000,000',
    area: '300 sq yards',
    bedrooms: 3,
    bathrooms: 2,
    location: 'Gulshan-e-Iqbal Block 7, Karachi',
    safety: 8.8,
    amenities: 8.7,
    investment: 8.5,
    description: 'Family-friendly house in a quiet residential area.',
    features: ['Quiet Area', 'Schools Nearby', 'Market Access', 'Parking'],
    images: ['🏡', '🎓', '🛒'],
    verified: false,
  },
  {
    id: 4,
    name: 'Defence Phase 5 Flat',
    type: 'Flat',
    price: 'PKR 18,000,000',
    area: '800 sq ft',
    bedrooms: 2,
    bathrooms: 1,
    location: 'Defence Phase 5, Karachi',
    safety: 8.5,
    amenities: 8.3,
    investment: 8.2,
    description: 'Affordable flat in a well-maintained building.',
    features: ['Affordable', 'Well Maintained', 'Good Location', 'Security'],
    images: ['🏘️', '🔧', '📍'],
    verified: true,
  },
];

const insights = [
  {
    id: 1,
    title: 'Property Market Trends',
    description: 'Karachi property market showing steady growth in secure areas.',
    icon: 'trending-up',
    color: '#10b981',
  },
  {
    id: 2,
    title: 'Safety Investment',
    description: 'Properties in gated communities command 15% premium.',
    icon: 'shield',
    color: '#3b82f6',
  },
  {
    id: 3,
    title: 'Amenities Value',
    description: 'Modern amenities increase property value by 20-25%.',
    icon: 'construct',
    color: '#f59e0b',
  },
  {
    id: 4,
    title: 'Location Premium',
    description: 'DHA and Clifton areas show highest appreciation rates.',
    icon: 'location',
    color: '#8b5cf6',
  },
];

const filters = [
  { id: 'all', name: 'All', icon: 'grid' },
  { id: 'villa', name: 'Villa', icon: 'home' },
  { id: 'apartment', name: 'Apartment', icon: 'business' },
  { id: 'house', name: 'House', icon: 'home-outline' },
  { id: 'flat', name: 'Flat', icon: 'layers' },
];

export default function PropertyInsightsScreen() {
  const { theme } = useTheme();
  const { addToFavorites, isFavorite } = useFavorites();
  const [selectedFilter, setSelectedFilter] = useState('all');

  const styles = getStyles(theme);

  const filteredProperties = propertyData.filter(property => {
    if (selectedFilter === 'all') return true;
    return property.type.toLowerCase() === selectedFilter;
  });

  const handlePropertyPress = (property) => {
    Alert.alert(
      property.name,
      `${property.description}\n\nPrice: ${property.price}\nArea: ${property.area}\nLocation: ${property.location}`,
      [
        { text: 'View Details', onPress: () => Alert.alert('Details', 'Detailed view coming soon!') },
        { text: 'Contact Agent', onPress: () => Alert.alert('Contact', 'Contacting agent...') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const toggleFavorite = (property) => {
    if (isFavorite(property.id)) {
      Alert.alert('Remove from Favorites', 'Property removed from favorites');
    } else {
      addToFavorites({
        id: property.id.toString(),
        type: 'listing',
        title: property.name,
        subtitle: property.price,
        location: property.location,
      });
      Alert.alert('Added to Favorites', 'Property added to favorites');
    }
  };

  const renderPropertyCard = (property) => (
    <TouchableOpacity
      key={property.id}
      style={styles.propertyCard}
      onPress={() => handlePropertyPress(property)}
    >
      <View style={styles.propertyHeader}>
        <View style={styles.propertyInfo}>
          <View style={styles.propertyTitleRow}>
            <Text style={styles.propertyName}>{property.name}</Text>
            {property.verified && (
              <Ionicons name="checkmark-circle" size={16} color="#3b82f6" />
            )}
          </View>
          <Text style={styles.propertyType}>{property.type}</Text>
          <Text style={styles.propertyPrice}>{property.price}</Text>
        </View>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(property)}
        >
          <Ionicons
            name={isFavorite(property.id) ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorite(property.id) ? '#ef4444' : '#9ca3af'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.propertyDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={14} color="#6b7280" />
          <Text style={styles.detailText}>{property.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="resize" size={14} color="#6b7280" />
          <Text style={styles.detailText}>{property.area}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="bed" size={14} color="#6b7280" />
          <Text style={styles.detailText}>{property.bedrooms} Bedrooms</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="water" size={14} color="#6b7280" />
          <Text style={styles.detailText}>{property.bathrooms} Bathrooms</Text>
        </View>
      </View>

      <View style={styles.ratingsContainer}>
        <View style={styles.rating}>
          <Ionicons name="shield" size={14} color="#10b981" />
          <Text style={styles.ratingText}>Safety: {property.safety}</Text>
        </View>
        <View style={styles.rating}>
          <Ionicons name="construct" size={14} color="#3b82f6" />
          <Text style={styles.ratingText}>Amenities: {property.amenities}</Text>
        </View>
        <View style={styles.rating}>
          <Ionicons name="trending-up" size={14} color="#f59e0b" />
          <Text style={styles.ratingText}>Investment: {property.investment}</Text>
        </View>
      </View>

      <View style={styles.featuresContainer}>
        {property.features.slice(0, 3).map((feature, index) => (
          <View key={index} style={styles.feature}>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  const renderInsightCard = (insight) => (
    <View key={insight.id} style={styles.insightCard}>
      <View style={[styles.insightIcon, { backgroundColor: insight.color }]}>
        <Ionicons name={insight.icon} size={20} color="white" />
      </View>
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>{insight.title}</Text>
        <Text style={styles.insightDescription}>{insight.description}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Property Insights</Text>
        <Text style={styles.headerSubtitle}>
          Discover properties with safety and investment potential
        </Text>
      </View>

      {/* Market Insights */}
      <View style={styles.insightsSection}>
        <Text style={styles.sectionTitle}>Market Insights</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {insights.map(renderInsightCard)}
        </ScrollView>
      </View>

      {/* Property Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              selectedFilter === filter.id && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Ionicons
              name={filter.icon}
              size={18}
              color={selectedFilter === filter.id ? '#3b82f6' : '#6b7280'}
            />
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter.id && styles.filterTextActive
              ]}
            >
              {filter.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Properties List */}
      <ScrollView style={styles.propertiesContainer} showsVerticalScrollIndicator={false}>
        {filteredProperties.map(renderPropertyCard)}
      </ScrollView>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme === 'dark' ? '#111827' : '#f8fafc',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  insightsSection: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 200,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  insightDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  filtersContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterButtonActive: {
    backgroundColor: '#dbeafe',
  },
  filterText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#3b82f6',
  },
  propertiesContainer: {
    flex: 1,
    padding: 16,
  },
  propertyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 4,
  },
  propertyType: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  propertyPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  favoriteButton: {
    padding: 4,
  },
  propertyDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
  ratingsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  feature: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
}); 