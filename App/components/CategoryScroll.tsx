import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Category } from '../types';

interface CategoryScrollProps {
  categories: Category[];
  onCategoryPress: (category: Category) => void;
}

export default function CategoryScroll({ categories, onCategoryPress }: CategoryScrollProps) {
  return (
    <ScrollView 
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          onPress={() => onCategoryPress(category)}
          style={styles.categoryCard}
        >
          <Text style={styles.categoryName}>{category.name}</Text>
          <Text style={styles.categoryCount}>{category.count} venues</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryCard: {
    width: 140,
    height: 112,
    borderWidth: 2,
    borderColor: '#4b5563',
    borderRadius: 12,
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#1f1f1f',
    marginRight: 12,
  },
  categoryName: {
    fontWeight: '600',
    fontSize: 14,
    color: '#e5e7eb',
  },
  categoryCount: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
