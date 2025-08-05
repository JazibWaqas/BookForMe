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

const getTypeIcon = (type) => {
  switch (type) {
    case 'service':
      return 'construct';
    case 'location':
      return 'location';
    case 'listing':
      return 'home';
    case 'alert':
      return 'warning';
    case 'post':
      return 'chatbubble';
    default:
      return 'heart';
  }
};

const getTypeColor = (type) => {
  switch (type) {
    case 'service':
      return '#3b82f6';
    case 'location':
      return '#10b981';
    case 'listing':
      return '#f59e0b';
    case 'alert':
      return '#ef4444';
    case 'post':
      return '#8b5cf6';
    default:
      return '#6b7280';
  }
};

export default function FavoritesScreen() {
  const { theme } = useTheme();
  const { favorites, removeFromFavorites } = useFavorites();
  const [selectedFilter, setSelectedFilter] = useState('all');

  const styles = getStyles(theme);

  const filteredFavorites = favorites.filter(favorite => {
    if (selectedFilter === 'all') return true;
    return favorite.type === selectedFilter;
  });

  const handleFavoritePress = (favorite) => {
    Alert.alert(
      favorite.title,
      `${favorite.subtitle || ''}\n\nLocation: ${favorite.location}\nAdded: ${favorite.addedAt.toLocaleDateString()}`,
      [
        { text: 'View Details', onPress: () => Alert.alert('Details', 'Detailed view coming soon!') },
        { text: 'Remove', onPress: () => removeFromFavorites(favorite.id), style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const removeFavorite = (favorite) => {
    Alert.alert(
      'Remove from Favorites',
      `Are you sure you want to remove "${favorite.title}" from favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          onPress: () => {
            removeFromFavorites(favorite.id);
            Alert.alert('Removed', 'Item removed from favorites');
          },
          style: 'destructive'
        },
      ]
    );
  };

  const renderFavoriteCard = (favorite) => (
    <TouchableOpacity
      key={favorite.id}
      style={styles.favoriteCard}
      onPress={() => handleFavoritePress(favorite)}
    >
      <View style={styles.favoriteHeader}>
        <View style={[styles.favoriteIcon, { backgroundColor: getTypeColor(favorite.type) }]}>
          <Ionicons name={getTypeIcon(favorite.type)} size={20} color="white" />
        </View>
        <View style={styles.favoriteInfo}>
          <Text style={styles.favoriteTitle}>{favorite.title}</Text>
          {favorite.subtitle && (
            <Text style={styles.favoriteSubtitle}>{favorite.subtitle}</Text>
          )}
          <Text style={styles.favoriteLocation}>{favorite.location}</Text>
          <Text style={styles.favoriteDate}>
            Added {favorite.addedAt.toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFavorite(favorite)}
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="heart-outline" size={64} color="#9ca3af" />
      <Text style={styles.emptyStateTitle}>No Favorites Yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Start adding items to your favorites to see them here
      </Text>
    </View>
  );

  const filters = [
    { id: 'all', name: 'All', icon: 'grid' },
    { id: 'service', name: 'Services', icon: 'construct' },
    { id: 'location', name: 'Locations', icon: 'location' },
    { id: 'listing', name: 'Listings', icon: 'home' },
    { id: 'alert', name: 'Alerts', icon: 'warning' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favorites</Text>
        <Text style={styles.headerSubtitle}>
          Your saved items and favorite places
        </Text>
      </View>

      {/* Filter Tabs */}
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

      {/* Favorites List */}
      <ScrollView style={styles.favoritesContainer} showsVerticalScrollIndicator={false}>
        {filteredFavorites.length > 0 ? (
          filteredFavorites.map(renderFavoriteCard)
        ) : (
          renderEmptyState()
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
  favoritesContainer: {
    flex: 1,
    padding: 16,
  },
  favoriteCard: {
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
  favoriteHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  favoriteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  favoriteSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  favoriteLocation: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  favoriteDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  removeButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
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