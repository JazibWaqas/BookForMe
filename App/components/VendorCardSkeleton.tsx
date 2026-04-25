import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Skeleton from './ui/Skeleton';
import { COLORS, RADIUS, SHADOWS } from '../constants/colors';

interface VendorCardSkeletonProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Skeleton placeholder mirroring the VendorCard layout
 * (image area + footer with price + "Book Now" pill).
 */
export default function VendorCardSkeleton({ style }: VendorCardSkeletonProps) {
  return (
    <View
      style={[styles.card, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading venue"
      accessibilityState={{ busy: true }}
    >
      {/* Image placeholder */}
      <Skeleton height={185} borderRadius={0} style={styles.image} />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.priceCol}>
          <Skeleton width={60} height={10} />
          <Skeleton width={110} height={14} style={{ marginTop: 6 }} />
        </View>
        <Skeleton width={92} height={32} borderRadius={RADIUS.md} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    ...SHADOWS.card,
  },
  image: {
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
  },
  priceCol: {
    flex: 1,
  },
});
