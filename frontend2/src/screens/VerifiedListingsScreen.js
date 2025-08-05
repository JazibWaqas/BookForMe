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

const listingsData = [
  {
    id: 1,
    title: 'DHA Phase 6 Security Service',
    category: 'Security',
    rating: 4.8,
    reviews: 156,
    verified: true,
    location: 'DHA Phase 6, Karachi',
    description: 'Professional security services with 24/7 monitoring and armed guards.',
    features: ['24/7 Monitoring', 'Armed Guards', 'CCTV', 'Emergency Response'],
    contact: '+92-21-1234567',
    price: 'PKR 15,000/month',
    icon: 'shield',
    color: '#ef4444',
  },
  {
    id: 2,
    title: 'Clifton Electrician Services',
    category: 'Utilities',
    rating: 4.6,
    reviews: 89,
    verified: true,
    location: 'Clifton Block 2, Karachi',
    description: 'Licensed electrician with 10+ years experience in residential and commercial work.',
    features: ['Licensed', 'Emergency Service', 'Warranty', 'Free Quotes'],
    contact: '+92-21-1234568',
    price: 'PKR 500-2000',
    icon: 'flash',
    color: '#f59e0b',
  },
  {
    id: 3,
    title: 'Gulshan Plumbing Solutions',
    category: 'Utilities',
    rating: 4.7,
    reviews: 124,
    verified: true,
    location: 'Gulshan-e-Iqbal Block 7, Karachi',
    description: 'Reliable plumbing services for all types of repairs and installations.',
    features: ['24/7 Service', 'Guaranteed Work', 'Modern Equipment', 'Fair Pricing'],
    contact: '+92-21-1234569',
    price: 'PKR 800-3000',
    icon: 'water',
    color: '#3b82f6',
  },
  {
    id: 4,
    title: 'Defence Cleaning Services',
    category: 'Household',
    rating: 4.5,
    reviews: 67,
    verified: true,
    location: 'Defence Phase 5, Karachi',
    description: 'Professional cleaning services for homes and offices with eco-friendly products.',
    features: ['Eco-friendly', 'Trained Staff', 'Flexible Schedule', 'Satisfaction Guaranteed'],
    contact: '+92-21-1234570',
    price: 'PKR 2,000-5,000',
    icon: 'sparkles',
    color: '#10b981',
  },
  {
    id: 5,
    title: 'Saddar Medical Equipment',
    category: 'Healthcare',
    rating: 4.9,
    reviews: 203,
    verified: true,
    location: 'Saddar, Karachi',
    description: 'Medical equipment rental and sales with professional installation and support.',
    features: ['Certified Products', 'Installation', 'Maintenance', '24/7 Support'],
    contact: '+92-21-1234571',
    price: 'PKR 1,000-10,000',
    icon: 'medical',
    color: '#8b5cf6',
  },
];

const categories = [
  { id: 'all', name: 'All', icon: 'grid' },
  { id: 'security', name: 'Security', icon: 'shield' },
  { id: 'utilities', name: 'Utilities', icon: 'construct' },
  { id: 'household', name: 'Household', icon: 'home' },
  { id: 'healthcare', name: 'Healthcare', icon: 'medical' },
];

export default function VerifiedListingsScreen() {
  const { theme } = useTheme();
  const { addToFavorites, isFavorite } = useFavorites();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const styles = getStyles(theme);

  const filteredListings = listingsData.filter(listing => {
    if (selectedCategory === 'all') return true;
    return listing.category.toLowerCase() === selectedCategory;
  });

  const handleListingPress = (listing) => {
    Alert.alert(
      listing.title,
      `${listing.description}\n\nContact: ${listing.contact}\nPrice: ${listing.price}\nLocation: ${listing.location}`,
      [
        { text: 'Call Now', onPress: () => Alert.alert('Calling...', `Calling ${listing.contact}`) },
        { text: 'View Details', onPress: () => Alert.alert('Details', 'Detailed view coming soon!') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const toggleFavorite = (listing) => {
    if (isFavorite(listing.id)) {
      Alert.alert('Remove from Favorites', 'Listing removed from favorites');
    } else {
      addToFavorites({
        id: listing.id.toString(),
        type: 'service',
        title: listing.title,
        subtitle: listing.category,
        location: listing.location,
      });
      Alert.alert('Added to Favorites', 'Listing added to favorites');
    }
  };

  const renderListingCard = (listing) => (
    <TouchableOpacity
      key={listing.id}
      style={styles.listingCard}
      onPress={() => handleListingPress(listing)}
    >
      <View style={styles.listingHeader}>
        <View style={[styles.listingIcon, { backgroundColor: listing.color }]}>
          <Ionicons name={listing.icon} size={24} color="white" />
        </View>
        <View style={styles.listingInfo}>
          <View style={styles.listingTitleRow}>
            <Text style={styles.listingTitle}>{listing.title}</Text>
            {listing.verified && (
              <Ionicons name="checkmark-circle" size={16} color="#3b82f6" />
            )}
          </View>
          <Text style={styles.listingCategory}>{listing.category}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#f59e0b" />
            <Text style={styles.ratingText}>{listing.rating}</Text>
            <Text style={styles.reviewsText}>({listing.reviews} reviews)</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(listing)}
        >
          <Ionicons
            name={isFavorite(listing.id) ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorite(listing.id) ? '#ef4444' : '#9ca3af'}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.listingDescription}>{listing.description}</Text>

      <View style={styles.featuresContainer}>
        {listing.features.map((feature, index) => (
          <View key={index} style={styles.feature}>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <View style={styles.listingFooter}>
        <View style={styles.contactInfo}>
          <Ionicons name="call" size={14} color="#6b7280" />
          <Text style={styles.contactText}>{listing.contact}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>{listing.price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Verified Listings</Text>
        <Text style={styles.headerSubtitle}>
          Trusted and verified services in your neighborhood
        </Text>
      </View>

      {/* Category Filter */}
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
              size={18}
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

      {/* Listings */}
      <ScrollView style={styles.listingsContainer} showsVerticalScrollIndicator={false}>
        {filteredListings.map(renderListingCard)}
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
  listingsContainer: {
    flex: 1,
    padding: 16,
  },
  listingCard: {
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
  listingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  listingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listingInfo: {
    flex: 1,
  },
  listingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 4,
  },
  listingCategory: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 4,
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
  favoriteButton: {
    padding: 4,
  },
  listingDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
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
  listingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
}); 