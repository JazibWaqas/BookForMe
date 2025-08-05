import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeProvider';
import { useNavigation } from '@react-navigation/native';

export default function Header({ title, showMenuButton = true, showExploreButtons = true }) {
  const { colors, spacing, fontSize } = useTheme();
  const navigation = useNavigation();

  const exploreButtons = [
    { id: 'Rankings', icon: 'trending-up', label: 'Rankings' },
    { id: 'Property', icon: 'business', label: 'Property' },
    { id: 'Listings', icon: 'location', label: 'Listings' },
  ];

  const styles = StyleSheet.create({
    header: {
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    logo: {
      width: 32,
      height: 32,
      backgroundColor: colors.primary,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: spacing.sm,
    },
    logoIcon: {
      width: 16,
      height: 16,
      backgroundColor: 'white',
      borderRadius: 8,
    },
    titleSection: {
      marginLeft: spacing.sm,
    },
    title: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: colors.text,
    },
    subtitle: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
    },
    exploreSection: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    exploreButton: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
    },
    exploreButtonText: {
      color: 'white',
      fontSize: fontSize.sm,
      fontWeight: '500',
      marginLeft: 4,
    },
  });

  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        {showMenuButton && (
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        
        <View style={styles.logo}>
          <View style={styles.logoIcon} />
        </View>
        
        <View style={styles.titleSection}>
          <Text style={styles.title}>KHI Safe</Text>
          <Text style={styles.subtitle}>Karachi Neighborhood Safety</Text>
        </View>
      </View>

      {showExploreButtons && (
        <View style={styles.exploreSection}>
          {exploreButtons.map((button, index) => (
            <TouchableOpacity
              key={button.id}
              style={[
                styles.exploreButton,
                {
                  backgroundColor: index === 0 ? '#10B981' : index === 1 ? colors.primary : '#8B5CF6',
                }
              ]}
              onPress={() => navigation.navigate(button.id)}
            >
              <Ionicons name={button.icon} size={16} color="white" />
              <Text style={styles.exploreButtonText}>{button.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}