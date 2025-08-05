import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeProvider';
import Header from '../components/Header';

export default function PropertyInsights() {
  const { colors, spacing, fontSize, borderRadius } = useTheme();

  const insights = [
    { label: 'Avg. Property Price', value: 'Rs. 2.8M', icon: 'home', trend: '+5.2%' },
    { label: 'Rental Yield', value: '7.8%', icon: 'trending-up', trend: '+0.3%' },
    { label: 'Crime Rate', value: 'Low', icon: 'shield', trend: '-12%' },
    { label: 'Infrastructure', value: 'Excellent', icon: 'build', trend: '+8%' },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.md,
    },
    insightCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    insightHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    insightIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.sm,
    },
    insightLabel: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
    },
    insightValue: {
      fontSize: fontSize.xl,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    insightTrend: {
      fontSize: fontSize.sm,
      color: colors.success,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Property Insights" />
      <ScrollView style={styles.content}>
        {insights.map((insight, index) => (
          <View key={index} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <View style={styles.insightIcon}>
                <Ionicons name={insight.icon} size={20} color={colors.primary} />
              </View>
              <Text style={styles.insightLabel}>{insight.label}</Text>
            </View>
            <Text style={styles.insightValue}>{insight.value}</Text>
            <Text style={styles.insightTrend}>{insight.trend}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}