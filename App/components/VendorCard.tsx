import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Vendor } from '../types';
import { getVendorImage } from '../constants/vendorImages';
import { COLORS, SHADOWS, RADIUS } from '../constants/colors';
import { FONTS } from '../constants/typography';

interface VendorCardProps {
  vendor: Vendor;
  onPress: () => void;
  onBookPress?: () => void;
}

// Helper to retrieve vendor price dynamically
const getDisplayPrice = (vendor: Vendor) => {
  if (vendor.price_range) return vendor.price_range;
  return '2,000'; // Global fallback if a vendor has no price set in db
};

export default function VendorCard({ vendor, onPress, onBookPress }: VendorCardProps) {
  const vendorName = vendor.name || vendor.business_name || 'Unknown';
  const vendorArea = vendor.area || vendor.location || '';
  const imageSource = getVendorImage(vendor.id);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.card}
      activeOpacity={0.88}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${vendorName}${vendorArea ? `, ${vendorArea}` : ''}, from PKR ${getDisplayPrice(vendor)} per hour`}
      accessibilityHint="Double tap to view venue details"
    >
      {/* ── Image with full gradient overlay ── */}
      <View style={styles.imageContainer}>
        <Image
          source={imageSource}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Gradient overlay — text lives on top of image */}
        <LinearGradient
          colors={['transparent', 'rgba(8,9,15,0.7)', 'rgba(8,9,15,0.97)']}
          locations={[0.3, 0.65, 1.0]}
          style={styles.imageOverlay}
        >
          {/* Rating badge — top right corner */}
          {vendor.rating && (
            <View
              style={styles.ratingBadge}
              accessible
              accessibilityRole="text"
              accessibilityLabel={`Rating ${vendor.rating} out of 5`}
            >
              <Ionicons name="star" size={11} color={COLORS.accent} />
              <Text style={styles.ratingText}>{vendor.rating}</Text>
            </View>
          )}

          {/* Venue name & location on the image */}
          <View style={styles.overlayContent}>
            <Text style={styles.name} numberOfLines={1}>{vendorName}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} />
              <Text style={styles.meta}>{vendorArea}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* ── Bottom action strip ── */}
      <View style={styles.footer}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>From</Text>
          <Text style={styles.priceValue}>PKR {getDisplayPrice(vendor)}</Text>
          <Text style={styles.priceUnit}>/hr</Text>
        </View>
        {onBookPress && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onBookPress();
            }}
            style={styles.bookButton}
            activeOpacity={0.8}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`Book ${vendorName}`}
            accessibilityHint="Double tap to start the booking flow"
          >
            <Text style={styles.bookText}>Book Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
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
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 185,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surfaceRaised,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    padding: 14,
    justifyContent: 'flex-end',
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(8,9,15,0.65)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,159,10,0.3)',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  overlayContent: {
    gap: 5,
  },
  name: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },

  // ── Footer ──
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  priceUnit: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '400',
  },
  bookButton: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    ...SHADOWS.primaryGlow,
  },
  bookText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
    letterSpacing: 0.2,
  },
});
