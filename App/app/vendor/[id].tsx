import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import { Vendor } from '../../types';
import { getVendorById } from '../../services/vendors';
import TimeSlotPicker from '../../components/TimeSlotPicker';
import Button from '../../components/ui/Button';

export default function VendorDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots] = useState<string[]>([
    '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '18:00', '19:00'
  ]);
  const [bookedSlots] = useState<string[]>(['17:00']);
  const [activeTab, setActiveTab] = useState<'amenities' | 'reviews' | 'location'>('amenities');

  useEffect(() => {
    if (id) {
      loadVendor();
    }
  }, [id]);

  const loadVendor = async () => {
    const data = await getVendorById(id as string);
    setVendor(data);
  };

  const handleConfirmBooking = () => {
    if (!selectedTime || !vendor) return;
    
    router.push({
      pathname: '/vendor/booking',
      params: {
        vendorId: vendor.id,
        vendorName: vendor.business_name,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        slotId: 'slot_' + selectedTime.replace(':', ''),
      },
    });
  };

  if (!vendor) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{vendor.business_name}</Text>
          <Text style={styles.subtitle}>{vendor.category} • {vendor.location}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>Venue Photo / Slider</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>⭐ {vendor.rating || 4.9} (201 reviews)</Text>
            <Text style={styles.infoText}>5.2 km away</Text>
          </View>
          <Text style={styles.description}>
            {vendor.description || 'Luxury sports facility with premium amenities and extended operating hours.'}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>OPEN 6:00 AM - 11:00 PM</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.bookingHeader}>
            <View>
              <Text style={styles.bookingTitle}>Book Your Slot</Text>
              <Text style={styles.bookingSubtitle}>Select date & time</Text>
            </View>
            <View>
              <Text style={styles.priceText}>{vendor.price_range || 'PKR 1200/hr'}</Text>
              <Text style={styles.priceSubtext}>+ taxes</Text>
            </View>
          </View>

          <View style={styles.bookingContent}>
            <TimeSlotPicker
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onDateChange={setSelectedDate}
              onTimeChange={setSelectedTime}
              availableSlots={availableSlots}
              bookedSlots={bookedSlots}
            />
            
            <Button
              title={`Confirm Booking (${vendor.price_range || 'PKR 1250'})`}
              onPress={handleConfirmBooking}
              disabled={!selectedTime}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.tabBar}>
            {(['amenities', 'reviews', 'location'] as const).map((tab, index) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, index === 2 && styles.tabLast]}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.tabContent}>
            {activeTab === 'amenities' && (
              <View style={styles.amenitiesGrid}>
                {(vendor.amenities || ['Parking', 'WiFi', 'AC Courts', 'Coaching Available']).map((amenity) => (
                  <View key={amenity} style={styles.amenityBadge}>
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            )}
            {activeTab === 'reviews' && (
              <Text style={styles.placeholderText}>Reviews coming soon...</Text>
            )}
            {activeTab === 'location' && (
              <Text style={styles.addressText}>{vendor.address}</Text>
            )}
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#4b5563',
  },
  backButton: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: '#4b5563',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: '#d1d5db',
    fontSize: 18,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f9fafb',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  imagePlaceholder: {
    height: 192,
    borderWidth: 2,
    borderColor: '#4b5563',
    borderRadius: 16,
    backgroundColor: '#1f1f1f',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#1f1f1f',
    borderWidth: 2,
    borderColor: '#4b5563',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  description: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#6b7280',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#e5e7eb',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bookingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f9fafb',
  },
  bookingSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  priceText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'right',
  },
  priceSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
  },
  bookingContent: {
    borderWidth: 1,
    borderColor: '#4b5563',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#4b5563',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#4b5563',
  },
  tabLast: {
    borderRightWidth: 0,
  },
  tabText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#f9fafb',
    fontWeight: '600',
  },
  tabContent: {
    paddingTop: 12,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#6b7280',
    borderRadius: 8,
  },
  amenityText: {
    fontSize: 12,
    color: '#e5e7eb',
  },
  placeholderText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  addressText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
