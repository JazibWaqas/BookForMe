import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Category } from '../types';
import { COLORS, RADIUS, SPACING } from '../constants/colors';

interface CategoryScrollProps {
  categories: Category[];
  onCategoryPress: (category: Category) => void;
}

export default function CategoryScroll({ categories, onCategoryPress }: CategoryScrollProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      accessibilityLabel="Sport categories"
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          onPress={() => onCategoryPress(category)}
          style={styles.categoryCard}
          activeOpacity={0.85}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`${category.name} category, ${category.count} venues`}
          accessibilityHint="Double tap to browse venues in this category"
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
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  categoryCard: {
    width: 140,
    height: 112,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADIUS.md,
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.md,
  },
  categoryName: {
    fontWeight: '600',
    fontSize: 14,
    color: COLORS.text,
  },
  categoryCount: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
