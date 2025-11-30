import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format, addDays } from 'date-fns';
import { Vendor } from '../../types';
import { getVendorById } from '../../services/vendors';
import TimeSlotPicker from '../../components/TimeSlotPicker';
import Button from '../../components/ui/Button';
import { COLORS } from '../../constants/colors';
import { getCourtImage } from '../../constants/images';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function VendorDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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
        {/* Image Slider */}
        <View style={styles.imageSliderContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const slideIndex = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
              setCurrentImageIndex(slideIndex);
            }}
            scrollEventThrottle={16}
          >
            {[0, 1, 2, 3].map((index) => (
              <Image
                key={index}
                source={{ uri: getCourtImage(vendor.category, index) }}
                style={styles.venueImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          {/* Pagination Dots */}
          <View style={styles.paginationDots}>
            {[0, 1, 2, 3].map((index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentImageIndex === index && styles.dotActive,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>★ {vendor.rating || 4.9} (201 reviews)</Text>
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
            {/* Horizontal Date Picker */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.datePicker}
              contentContainerStyle={styles.datePickerContent}
            >
              {Array.from({ length: 7 }, (_, i) => addDays(new Date(), i)).map((date, index) => {
                const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.dateCard, isSelected && styles.dateCardActive]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text style={[styles.dateMonth, isSelected && styles.dateTextActive]}>
                      {format(date, 'MMM')}
                    </Text>
                    <Text style={[styles.dateDay, isSelected && styles.dateTextActive]}>
                      {format(date, 'dd')}
                    </Text>
                    <Text style={[styles.dateWeekday, isSelected && styles.dateTextActive]}>
                      {format(date, 'EEE')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Time Slots Grid */}
            <View style={styles.slotsGrid}>
              {availableSlots.map((time) => {
                const isBooked = bookedSlots.includes(time);
                const isSelected = selectedTime === time;
                return (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.slotCard,
                      isSelected && styles.slotCardSelected,
                      isBooked && styles.slotCardBooked,
                    ]}
                    onPress={() => !isBooked && setSelectedTime(time)}
                    disabled={isBooked}
                  >
                    {!isBooked && <View style={styles.slotDot} />}
                    <Text style={[
                      styles.slotTime,
                      isSelected && styles.slotTimeSelected,
                      isBooked && styles.slotTimeBooked,
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

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
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.textMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.backgroundLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: COLORS.textSecondary,
    fontSize: 18,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  imageSliderContainer: {
    height: 240,
    marginHorizontal: -20,
    marginTop: -20,
    marginBottom: 20,
    position: 'relative',
  },
  venueImage: {
    width: SCREEN_WIDTH,
    height: 240,
  },
  paginationDots: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
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
    color: COLORS.textMuted,
  },
  description: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: COLORS.textSecondary,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bookingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  bookingSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  priceText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  priceSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  bookingContent: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  datePicker: {
    marginBottom: 16,
  },
  datePickerContent: {
    gap: 12,
  },
  dateCard: {
    width: 70,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  dateCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  dateWeekday: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  dateTextActive: {
    color: COLORS.textDark,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  slotCard: {
    width: '22%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    position: 'relative',
  },
  slotCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  slotCardBooked: {
    opacity: 0.4,
  },
  slotDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  slotTime: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  slotTimeSelected: {
    color: COLORS.textDark,
    fontWeight: '600',
  },
  slotTimeBooked: {
    textDecorationLine: 'line-through',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  tabLast: {
    borderRightWidth: 0,
  },
  tabText: {
    fontSize: 14,
    textAlign: 'center',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.text,
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
    borderColor: COLORS.borderLight,
    borderRadius: 8,
  },
  amenityText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  placeholderText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
