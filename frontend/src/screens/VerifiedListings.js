import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeProvider';
import Header from '../components/Header';

export default function VerifiedListings() {
  const { colors, spacing, fontSize, borderRadius } = useTheme();

  const listings = [
    {
      id: 1,
      title: 'DHA Phase 5 Apartment',
      price: 'Rs. 85,000/month',
      location: 'Block L, DHA Phase 5',
      verified: true,
    },
    {
      id: 2,
      title: 'Clifton Sea View House',
      price: 'Rs. 4.2 Cr',
      location: 'Clifton Block 4',
      verified: true,
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.md,
    },
    listingCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    listingTitle: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    listingPrice: {
      fontSize: fontSize.lg,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    listingLocation: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.success + '20',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      alignSelf: 'flex-start',
    },
    verifiedText: {
      fontSize: fontSize.xs,
      color: colors.success,
      marginLeft: spacing.xs,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Verified Listings" />
      <ScrollView style={styles.content}>
        {listings.map((listing) => (
          <View key={listing.id} style={styles.listingCard}>
            <Text style={styles.listingTitle}>{listing.title}</Text>
            <Text style={styles.listingPrice}>{listing.price}</Text>
            <Text style={styles.listingLocation}>{listing.location}</Text>
            {listing.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}