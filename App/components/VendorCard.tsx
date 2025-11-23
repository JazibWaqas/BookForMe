import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Vendor } from '../types';
import Card from './ui/Card';

interface VendorCardProps {
  vendor: Vendor;
  onPress: () => void;
  onBookPress?: () => void;
}

export default function VendorCard({ vendor, onPress, onBookPress }: VendorCardProps) {
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.name}>{vendor.business_name}</Text>
          <Text style={styles.meta}>{vendor.category} • {vendor.location}</Text>
        </View>
        {vendor.rating && (
          <View style={styles.rating}>
            <Text style={styles.ratingText}>⭐ {vendor.rating}</Text>
          </View>
        )}
      </View>
      <View style={styles.footer}>
        <Text style={styles.price}>{vendor.price_range || 'PKR 1200/hr'}</Text>
        {onBookPress && (
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              onBookPress();
            }}
            style={styles.bookButton}
          >
            <Text style={styles.bookText}>Book</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f9fafb',
  },
  meta: {
    fontSize: 12,
    color: '#6b7280',
  },
  rating: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#6b7280',
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f9fafb',
  },
  bookButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#6b7280',
    borderRadius: 8,
  },
  bookText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f9fafb',
  },
});
