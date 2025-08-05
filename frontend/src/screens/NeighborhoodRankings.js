import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeProvider';
import Header from '../components/Header';

export default function NeighborhoodRankings() {
  const { colors, spacing, fontSize, borderRadius } = useTheme();

  const rankings = [
    { name: 'DHA Phase 6', score: 95, rank: 1, trend: 'up' },
    { name: 'Clifton Block 4', score: 92, rank: 2, trend: 'up' },
    { name: 'Gulshan-e-Iqbal', score: 88, rank: 3, trend: 'stable' },
    { name: 'North Nazimabad', score: 85, rank: 4, trend: 'down' },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.md,
    },
    rankingItem: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    rank: {
      fontSize: fontSize.xl,
      fontWeight: 'bold',
      color: colors.primary,
      marginRight: spacing.md,
      width: 40,
    },
    areaInfo: {
      flex: 1,
    },
    areaName: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
    },
    score: {
      fontSize: fontSize.lg,
      fontWeight: 'bold',
      color: colors.success,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Area Rankings" />
      <ScrollView style={styles.content}>
        {rankings.map((area) => (
          <View key={area.rank} style={styles.rankingItem}>
            <Text style={styles.rank}>#{area.rank}</Text>
            <View style={styles.areaInfo}>
              <Text style={styles.areaName}>{area.name}</Text>
            </View>
            <Text style={styles.score}>{area.score}%</Text>
            <Ionicons
              name={area.trend === 'up' ? 'trending-up' : area.trend === 'down' ? 'trending-down' : 'remove'}
              size={20}
              color={area.trend === 'up' ? colors.success : area.trend === 'down' ? colors.error : colors.textMuted}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}