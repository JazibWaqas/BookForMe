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

const rankingsData = [
  {
    id: 1,
    name: 'DHA Phase 6',
    rank: 1,
    score: 9.2,
    safety: 9.5,
    cleanliness: 8.8,
    amenities: 9.0,
    community: 9.1,
    description: 'One of the safest and most well-maintained areas in Karachi.',
    population: '45,000',
    area: '2.5 sq km',
    policeStations: 2,
    hospitals: 3,
    schools: 8,
    parks: 4,
    color: '#10b981',
  },
  {
    id: 2,
    name: 'Clifton Block 2',
    rank: 2,
    score: 8.9,
    safety: 9.0,
    cleanliness: 8.5,
    amenities: 9.2,
    community: 8.8,
    description: 'Prime location with excellent security and modern amenities.',
    population: '32,000',
    area: '1.8 sq km',
    policeStations: 1,
    hospitals: 2,
    schools: 6,
    parks: 3,
    color: '#3b82f6',
  },
  {
    id: 3,
    name: 'Gulshan-e-Iqbal Block 7',
    rank: 3,
    score: 8.5,
    safety: 8.8,
    cleanliness: 8.2,
    amenities: 8.7,
    community: 8.4,
    description: 'Family-friendly neighborhood with good educational institutions.',
    population: '38,000',
    area: '2.1 sq km',
    policeStations: 1,
    hospitals: 2,
    schools: 7,
    parks: 2,
    color: '#f59e0b',
  },
  {
    id: 4,
    name: 'Defence Phase 5',
    rank: 4,
    score: 8.2,
    safety: 8.5,
    cleanliness: 8.0,
    amenities: 8.3,
    community: 8.1,
    description: 'Well-planned residential area with good infrastructure.',
    population: '28,000',
    area: '1.6 sq km',
    policeStations: 1,
    hospitals: 1,
    schools: 5,
    parks: 2,
    color: '#8b5cf6',
  },
  {
    id: 5,
    name: 'Saddar',
    rank: 5,
    score: 7.8,
    safety: 7.5,
    cleanliness: 7.2,
    amenities: 8.5,
    community: 7.8,
    description: 'Historic area with commercial importance and cultural heritage.',
    population: '55,000',
    area: '3.2 sq km',
    policeStations: 3,
    hospitals: 4,
    schools: 9,
    parks: 1,
    color: '#ef4444',
  },
];

const categories = [
  { id: 'overall', name: 'Overall', icon: 'trophy' },
  { id: 'safety', name: 'Safety', icon: 'shield' },
  { id: 'cleanliness', name: 'Cleanliness', icon: 'sparkles' },
  { id: 'amenities', name: 'Amenities', icon: 'construct' },
  { id: 'community', name: 'Community', icon: 'people' },
];

export default function NeighborhoodRankingsScreen() {
  const { theme } = useTheme();
  const { addToFavorites, isFavorite } = useFavorites();
  const [selectedCategory, setSelectedCategory] = useState('overall');

  const styles = getStyles(theme);

  const getSortedRankings = () => {
    const sorted = [...rankingsData].sort((a, b) => {
      if (selectedCategory === 'overall') {
        return b.score - a.score;
      }
      return b[selectedCategory] - a[selectedCategory];
    });
    return sorted;
  };

  const handleNeighborhoodPress = (neighborhood) => {
    Alert.alert(
      neighborhood.name,
      `Score: ${neighborhood.score}/10\n\n${neighborhood.description}\n\nPopulation: ${neighborhood.population}\nArea: ${neighborhood.area}`,
      [
        { text: 'View Details', onPress: () => Alert.alert('Details', 'Detailed view coming soon!') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const toggleFavorite = (neighborhood) => {
    if (isFavorite(neighborhood.id)) {
      Alert.alert('Remove from Favorites', 'Neighborhood removed from favorites');
    } else {
      addToFavorites({
        id: neighborhood.id.toString(),
        type: 'location',
        title: neighborhood.name,
        subtitle: `Rank #${neighborhood.rank}`,
        location: neighborhood.name,
      });
      Alert.alert('Added to Favorites', 'Neighborhood added to favorites');
    }
  };

  const renderNeighborhoodCard = (neighborhood, index) => (
    <TouchableOpacity
      key={neighborhood.id}
      style={styles.neighborhoodCard}
      onPress={() => handleNeighborhoodPress(neighborhood)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.rankContainer}>
          <Text style={styles.rankNumber}>{neighborhood.rank}</Text>
          <Text style={styles.rankLabel}>Rank</Text>
        </View>
        <View style={styles.neighborhoodInfo}>
          <Text style={styles.neighborhoodName}>{neighborhood.name}</Text>
          <View style={styles.scoreContainer}>
            <Ionicons name="star" size={16} color="#f59e0b" />
            <Text style={styles.scoreText}>{neighborhood.score}/10</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(neighborhood)}
        >
          <Ionicons
            name={isFavorite(neighborhood.id) ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorite(neighborhood.id) ? '#ef4444' : '#9ca3af'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.metric}>
          <Ionicons name="shield" size={14} color="#10b981" />
          <Text style={styles.metricText}>Safety: {neighborhood.safety}</Text>
        </View>
        <View style={styles.metric}>
          <Ionicons name="sparkles" size={14} color="#3b82f6" />
          <Text style={styles.metricText}>Clean: {neighborhood.cleanliness}</Text>
        </View>
        <View style={styles.metric}>
          <Ionicons name="construct" size={14} color="#f59e0b" />
          <Text style={styles.metricText}>Amenities: {neighborhood.amenities}</Text>
        </View>
        <View style={styles.metric}>
          <Ionicons name="people" size={14} color="#8b5cf6" />
          <Text style={styles.metricText}>Community: {neighborhood.community}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Ionicons name="location" size={14} color="#6b7280" />
          <Text style={styles.statText}>{neighborhood.area}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="people" size={14} color="#6b7280" />
          <Text style={styles.statText}>{neighborhood.population}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="shield" size={14} color="#6b7280" />
          <Text style={styles.statText}>{neighborhood.policeStations} Police</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="medical" size={14} color="#6b7280" />
          <Text style={styles.statText}>{neighborhood.hospitals} Hospitals</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Neighborhood Rankings</Text>
        <Text style={styles.headerSubtitle}>
          Top-rated areas in Karachi based on safety, cleanliness, and community
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

      {/* Rankings List */}
      <ScrollView style={styles.rankingsContainer} showsVerticalScrollIndicator={false}>
        {getSortedRankings().map((neighborhood, index) => 
          renderNeighborhoodCard(neighborhood, index)
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
  rankingsContainer: {
    flex: 1,
    padding: 16,
  },
  neighborhoodCard: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankContainer: {
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3b82f6',
  },
  rankLabel: {
    fontSize: 10,
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  neighborhoodInfo: {
    flex: 1,
  },
  neighborhoodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 4,
  },
  favoriteButton: {
    padding: 4,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  metricText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  statText: {
    fontSize: 11,
    color: '#9ca3af',
    marginLeft: 4,
  },
}); 