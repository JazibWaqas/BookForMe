import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeProvider';
import Header from '../components/Header';

const { width } = Dimensions.get('window');

export default function SearchServices() {
  const { colors, spacing, fontSize, borderRadius } = useTheme();
  const [activeCategory, setActiveCategory] = useState('food');
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  const categories = [
    { id: 'food', label: 'Food & Drink', icon: 'restaurant' },
    { id: 'activities', label: 'Things to do', icon: 'location' },
    { id: 'shopping', label: 'Shopping', icon: 'bag' },
    { id: 'services', label: 'Services', icon: 'build' },
  ];

  const subcategories = {
    food: [
      { id: 'restaurants', name: 'Restaurants', icon: 'restaurant' },
      { id: 'coffee', name: 'Coffee', icon: 'cafe' },
      { id: 'takeout', name: 'Takeout', icon: 'bag' },
      { id: 'delivery', name: 'Delivery', icon: 'car' },
    ],
    activities: [
      { id: 'parks', name: 'Parks', icon: 'leaf' },
      { id: 'gyms', name: 'Gyms', icon: 'fitness' },
      { id: 'art', name: 'Art', icon: 'camera' },
      { id: 'attractions', name: 'Attractions', icon: 'star' },
    ],
    shopping: [
      { id: 'groceries', name: 'Groceries', icon: 'basket' },
      { id: 'beauty', name: 'Beauty', icon: 'cut' },
      { id: 'electronics', name: 'Electronics', icon: 'phone-portrait' },
      { id: 'apparel', name: 'Apparel', icon: 'shirt' },
    ],
    services: [
      { id: 'plumber', name: 'Plumber', icon: 'build' },
      { id: 'electrician', name: 'Electrician', icon: 'flash' },
      { id: 'gas', name: 'Gas', icon: 'flame' },
      { id: 'hospitals', name: 'Hospitals', icon: 'medical' },
      { id: 'beauty-salons', name: 'Beauty Salons', icon: 'cut' },
      { id: 'security', name: 'Security', icon: 'shield' },
    ],
  };

  const sampleServices = [
    {
      id: '1',
      name: 'Ali Plumbing Services',
      description: 'Professional plumbing repairs',
      category: 'plumber',
      rating: 4.5,
      distance: '0.8 km',
      price: 'Rs. 1,500',
      availability: 'Available now',
    },
    {
      id: '2',
      name: 'Khan Electrical Works',
      description: 'Licensed electrician services',
      category: 'electrician',
      rating: 4.8,
      distance: '1.2 km',
      price: 'Rs. 2,000',
      availability: 'Available in 30 min',
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: spacing.md,
    },
    headerCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerIcon: {
      width: 40,
      height: 40,
      backgroundColor: '#D1FAE5',
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.sm,
    },
    headerTitle: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    categoryTabs: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.xs,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryTabsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    categoryTab: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      marginHorizontal: 2,
    },
    categoryTabActive: {
      backgroundColor: colors.primary,
    },
    categoryTabText: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
    categoryTabTextActive: {
      color: 'white',
    },
    locationCard: {
      backgroundColor: '#EBF8FF',
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: '#BFDBFE',
    },
    locationContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    locationInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    locationIcon: {
      width: 32,
      height: 32,
      backgroundColor: '#DBEAFE',
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.sm,
    },
    locationText: {
      fontSize: fontSize.md,
      fontWeight: '500',
      color: '#1E3A8A',
    },
    locationSubtext: {
      fontSize: fontSize.sm,
      color: '#3B82F6',
    },
    changeButton: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      borderWidth: 1,
      borderColor: '#3B82F6',
    },
    changeButtonText: {
      fontSize: fontSize.sm,
      color: '#3B82F6',
    },
    sectionTitle: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.md,
      textTransform: 'capitalize',
    },
    subcategoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    subcategoryCard: {
      width: (width - spacing.md * 3) / 2,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 2,
      borderColor: colors.border,
    },
    subcategoryCardActive: {
      borderColor: colors.primary,
      backgroundColor: '#EBF8FF',
    },
    subcategoryContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    subcategoryIcon: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.sm,
      backgroundColor: colors.card,
    },
    subcategoryIconActive: {
      backgroundColor: '#DBEAFE',
    },
    subcategoryName: {
      fontSize: fontSize.sm,
      fontWeight: '500',
      color: colors.text,
      flex: 1,
    },
    subcategoryNameActive: {
      color: '#1E3A8A',
    },
    serviceItem: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    serviceHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    serviceInfo: {
      flex: 1,
    },
    serviceName: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    serviceDescription: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    servicePrice: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.success,
    },
    serviceDetails: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    serviceDetailItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    serviceDetailText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
    },
    serviceActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    actionButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButtonPrimary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    actionButtonText: {
      fontSize: fontSize.sm,
      color: colors.text,
      marginLeft: spacing.xs,
    },
    actionButtonTextPrimary: {
      color: 'white',
    },
  });

  const renderSubcategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.subcategoryCard,
        selectedSubcategory === item.id && styles.subcategoryCardActive,
      ]}
      onPress={() => setSelectedSubcategory(item.id)}
    >
      <View style={styles.subcategoryContent}>
        <View
          style={[
            styles.subcategoryIcon,
            selectedSubcategory === item.id && styles.subcategoryIconActive,
          ]}
        >
          <Ionicons
            name={item.icon}
            size={20}
            color={selectedSubcategory === item.id ? colors.primary : colors.textSecondary}
          />
        </View>
        <Text
          style={[
            styles.subcategoryName,
            selectedSubcategory === item.id && styles.subcategoryNameActive,
          ]}
        >
          {item.name}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={selectedSubcategory === item.id ? colors.primary : colors.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );

  const getFilteredServices = () => {
    if (!selectedSubcategory) return [];
    return sampleServices.filter(service => service.category === selectedSubcategory);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Near Me" />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Ionicons name="navigate" size={20} color="#10B981" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Near Me</Text>
              <Text style={styles.headerSubtitle}>Find local services and places around you</Text>
            </View>
          </View>
        </View>

        {/* Category Tabs */}
        <View style={styles.categoryTabs}>
          <View style={styles.categoryTabsContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryTab,
                  activeCategory === category.id && styles.categoryTabActive,
                ]}
                onPress={() => {
                  setActiveCategory(category.id);
                  setSelectedSubcategory(null);
                }}
              >
                <Ionicons
                  name={category.icon}
                  size={16}
                  color={activeCategory === category.id ? 'white' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.categoryTabText,
                    activeCategory === category.id && styles.categoryTabTextActive,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location Info */}
        <View style={styles.locationCard}>
          <View style={styles.locationContent}>
            <View style={styles.locationInfo}>
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={16} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.locationText}>DHA Phase 5, Karachi</Text>
                <Text style={styles.locationSubtext}>Searching within 5 km radius</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.changeButton}>
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Subcategories */}
        <Text style={styles.sectionTitle}>{activeCategory.replace('-', ' & ')}</Text>
        <FlatList
          data={subcategories[activeCategory] || []}
          renderItem={renderSubcategory}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        />

        {/* Service Results */}
        {selectedSubcategory && (
          <View style={{ marginTop: spacing.md }}>
            <Text style={styles.sectionTitle}>
              {subcategories[activeCategory]?.find(s => s.id === selectedSubcategory)?.name} Near You
            </Text>
            
            {getFilteredServices().map((service) => (
              <View key={service.id} style={styles.serviceItem}>
                <View style={styles.serviceHeader}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceDescription}>{service.description}</Text>
                  </View>
                  {service.price && (
                    <Text style={styles.servicePrice}>{service.price}</Text>
                  )}
                </View>
                
                <View style={styles.serviceDetails}>
                  <View style={styles.serviceDetailItem}>
                    <Ionicons name="star" size={14} color="#FBBF24" />
                    <Text style={styles.serviceDetailText}>{service.rating}</Text>
                  </View>
                  <View style={styles.serviceDetailItem}>
                    <Ionicons name="location" size={14} color={colors.textSecondary} />
                    <Text style={styles.serviceDetailText}>{service.distance}</Text>
                  </View>
                  <View style={styles.serviceDetailItem}>
                    <Ionicons name="time" size={14} color={colors.textSecondary} />
                    <Text style={styles.serviceDetailText}>{service.availability}</Text>
                  </View>
                </View>
                
                <View style={styles.serviceActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="call" size={16} color={colors.text} />
                    <Text style={styles.actionButtonText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.actionButtonPrimary]}>
                    <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>
                      View Details
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}