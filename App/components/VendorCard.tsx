import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Vendor } from '../types';
import Card from './ui/Card';
import { getVendorImage } from '../constants/vendorImages';
import { COLORS } from '../constants/colors';

interface VendorCardProps {
  vendor: Vendor;
  onPress: () => void;
  onBookPress?: () => void;
}

export default function VendorCard({ vendor, onPress, onBookPress }: VendorCardProps) {
  const vendorName = vendor.name || vendor.business_name || 'Unknown';
  const vendorArea = vendor.area || vendor.location || '';
  const imageSource = getVendorImage(vendor.id);

  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <Image
        source={imageSource}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{vendorName}</Text>
            <Text style={styles.meta}>{vendorArea}</Text>
          </View>
          {vendor.rating && (
            <View style={styles.rating}>
              <Text style={styles.ratingText}>⭐ {vendor.rating}</Text>
            </View>
          )}
        </View>
        <View style={styles.footer}>
          <Text style={styles.price}>View Pricing →</Text>
          {onBookPress && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onBookPress();
              }}
              style={styles.bookButton}
            >
              <Text style={styles.bookText}>Book Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.surface,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  rating: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  bookButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  bookText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
});
