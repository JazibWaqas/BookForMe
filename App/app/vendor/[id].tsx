import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { format, addDays } from 'date-fns';
import { Vendor } from '../../types';
import {
  lockSlot,
  formatSlotTime,
  formatPrice,
  formatCountdown
} from '../../services/bookings';
import { ResourceGroup, SlotDetails } from '../../types/booking';
import Button from '../../components/ui/Button';
import { COLORS } from '../../constants/colors';
import { getVendorImage } from '../../constants/vendorImages';
import { getCourtImage } from '../../constants/images';
import { useVendor, useAvailableSlotsOptimized } from '../../hooks/useQueries';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function VendorDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<SlotDetails | null>(null);
  const [lockedSlotId, setLockedSlotId] = useState<string | null>(null);
  const [lockExpiry, setLockExpiry] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'amenities' | 'reviews' | 'location'>('amenities');
  const [lockingSlot, setLockingSlot] = useState<string | null>(null);
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lockedSlotIdRef = useRef<string | null>(lockedSlotId);

  // Use React Query for vendor and slots - automatic caching and refetching
  const { data: vendor, isLoading: vendorLoading } = useVendor(id as string);
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const { 
    data: resourceGroups = [], 
    isLoading: slotsLoading,
    refetch: refetchSlots 
  } = useAvailableSlotsOptimized(
    id as string, 
    dateStr, 
    true, // enabled
    !lockedSlotId // autoRefetch - only when no slot is locked
  );

  const loading = vendorLoading;

  // Keep ref in sync with state
  useEffect(() => {
    lockedSlotIdRef.current = lockedSlotId;
  }, [lockedSlotId]);

  // Check slot status when data refetches - only clear if slot becomes unavailable
  useEffect(() => {
    if (!lockedSlotId || !resourceGroups.length) return;
    
    let slotFound = false;
    let slotBooked = false;
    let slotStillLocked = false;
    let foundSlot: SlotDetails | null = null;

    resourceGroups.forEach(group => {
      const slot = group.slots.find((s: SlotDetails) => s.id === lockedSlotId);
      if (slot) {
        slotFound = true;
        foundSlot = slot;
        if (slot.status === 'locked') slotStillLocked = true;
        if (slot.status === 'booked' || slot.status === 'confirmed') slotBooked = true;
      }
    });

    // Only update selectedSlot if we found the slot and it's still locked
    // This prevents clearing selection when data refetches
    if (foundSlot && slotStillLocked && !selectedSlot) {
      setSelectedSlot(foundSlot);
    }

    // Only clear if slot is definitively booked/unavailable
    if (slotFound && (slotBooked || (!slotStillLocked && foundSlot?.status !== 'available'))) {
      setLockedSlotId(null);
      setSelectedSlot(null);
      setLockExpiry(null);
      setCountdown(0);
    }
  }, [resourceGroups, lockedSlotId]);

  // Auto-expand first resource when data loads
  useEffect(() => {
    if (resourceGroups.length > 0 && expandedResources.size === 0) {
      setExpandedResources(new Set([resourceGroups[0].resource_id]));
    }
  }, [resourceGroups]);

  // Countdown timer for locked slot
  useEffect(() => {
    if (lockExpiry) {
      const updateCountdown = () => {
        const now = new Date();
        const diff = lockExpiry.getTime() - now.getTime();
        const seconds = Math.max(0, Math.floor(diff / 1000));
        setCountdown(seconds);

        if (seconds === 0) {
          handleLockExpired();
        }
      };

      updateCountdown();
      countdownIntervalRef.current = setInterval(updateCountdown, 1000);
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [lockExpiry]);

  const handleSlotClick = async (slot: SlotDetails) => {
    if (slot.status !== 'available') return;

    // If clicking the same slot, do nothing
    if (selectedSlot?.id === slot.id) return;

    // If another slot is already locked, confirm before changing
    if (lockedSlotId && lockedSlotId !== slot.id) {
      Alert.alert(
        'Change Selection?',
        'You already have a slot reserved. Selecting a new slot will release your current reservation.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Change Slot',
            onPress: () => lockNewSlot(slot),
            style: 'destructive'
          }
        ]
      );
      return;
    }

    // Lock the slot
    await lockNewSlot(slot);
  };

  const lockNewSlot = async (slot: SlotDetails) => {
    try {
      setLockingSlot(slot.id);
      const result = await lockSlot(slot.id);

      if (result.success && result.hold_expires_at) {
        // Set slot as selected immediately for instant UI feedback
        setSelectedSlot(slot);
        setLockedSlotId(slot.id);
        setLockExpiry(new Date(result.hold_expires_at));
        
        // React Query will auto-refetch in background (45s interval)
        // No need to manually refetch - let it happen naturally
      } else {
        Alert.alert('Slot Unavailable', result.error || 'This slot is no longer available. Please select another.');
        refetchSlots(); // Only refetch on error
      }
    } catch (error) {
      console.error('Error locking slot:', error);
      Alert.alert('Error', 'Failed to reserve slot. Please try again.');
    } finally {
      setLockingSlot(null);
    }
  };

  const handleLockExpired = () => {
    Alert.alert(
      'Reservation Expired',
      'Your slot reservation has expired. Please select a slot again.',
      [{
        text: 'OK', onPress: () => {
          setSelectedSlot(null);
          setLockedSlotId(null);
          setLockExpiry(null);
          setCountdown(0);
          refetchSlots();
        }
      }]
    );
  };

  const handleConfirmBooking = () => {
    if (!selectedSlot || !vendor || !lockedSlotId) return;

    router.push({
      pathname: '/vendor/booking',
      params: {
        slotId: lockedSlotId,
        vendorId: vendor.id,
        vendorName: vendor.name || vendor.business_name || '',
        courtName: selectedSlot.resource_name || 'Court',
        date: selectedSlot.date,
        startTime: selectedSlot.start_time,
        endTime: selectedSlot.end_time,
        price: selectedSlot.price.toString(),
        holdExpiresAt: lockExpiry?.toISOString() || '',
      },
    });
  };

  const toggleResourceExpanded = (resourceId: string) => {
    setExpandedResources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resourceId)) {
        newSet.delete(resourceId);
      } else {
        newSet.add(resourceId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading venue...</Text>
      </View>
    );
  }

  if (!vendor) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Venue not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{vendor.name || vendor.business_name || 'Unknown'}</Text>
          <Text style={styles.subtitle}>{vendor.area || vendor.location || ''}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Single Vendor Image */}
        <Image
          source={getVendorImage(vendor.id)}
          style={styles.venueImage}
          resizeMode="cover"
        />

        {/* Venue Info */}
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

        {/* Booking Section */}
        <View style={styles.card}>
          <View style={styles.bookingHeader}>
            <View>
              <Text style={styles.bookingTitle}>Book Your Slot</Text>
              <Text style={styles.bookingSubtitle}>Select date & time</Text>
            </View>
          </View>

          <View style={styles.bookingContent}>
            {/* Date Picker */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.datePicker}
              contentContainerStyle={styles.datePickerContent}
            >
              {Array.from({ length: 14 }, (_, i) => addDays(new Date(), i)).map((date, index) => {
                const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.dateCard, isSelected && styles.dateCardActive]}
                    onPress={() => !lockedSlotId && setSelectedDate(date)}
                    disabled={!!lockedSlotId}
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

            {/* Slots by Resource */}
            {slotsLoading ? (
              <View style={styles.loadingSlots}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading available slots...</Text>
              </View>
            ) : resourceGroups.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No slots available for this date</Text>
                <Text style={styles.emptySubtext}>Try selecting a different date</Text>
              </View>
            ) : (
              resourceGroups.map((resource) => (
                <View key={resource.resource_id} style={styles.resourceSection}>
                  <TouchableOpacity
                    style={styles.resourceHeader}
                    onPress={() => toggleResourceExpanded(resource.resource_id)}
                  >
                    <View>
                      <Text style={styles.resourceName}>{resource.resource_name}</Text>
                      <Text style={styles.resourceSubtext}>
                        {resource.availableCount} slot{resource.availableCount !== 1 ? 's' : ''} available
                      </Text>
                    </View>
                    <Text style={styles.expandIcon}>
                      {expandedResources.has(resource.resource_id) ? '▼' : '▶'}
                    </Text>
                  </TouchableOpacity>

                  {expandedResources.has(resource.resource_id) && (
                    <View style={styles.slotsGrid}>
                      {resource.slots.map((slot) => {
                        // Check if this slot is selected/locked by current user
                        const isSelectedByUser = lockedSlotId === slot.id;
                        const isSelected = selectedSlot?.id === slot.id || isSelectedByUser;
                        
                        // Slot is locked by someone else if status is 'locked' and it's not our locked slot
                        const isLockedByOthers = slot.status === 'locked' && !isSelectedByUser;
                        const isBooked = slot.status === 'booked' || slot.status === 'confirmed';
                        const isLocking = lockingSlot === slot.id;

                        return (
                          <TouchableOpacity
                            key={slot.id}
                            style={[
                              styles.slotCard,
                              isSelected && styles.slotCardSelected,
                              (isBooked || isLockedByOthers) && styles.slotCardDisabled,
                            ]}
                            onPress={() => handleSlotClick(slot)}
                            disabled={isBooked || isLockedByOthers || isLocking}
                          >
                            {isLocking ? (
                              <ActivityIndicator size="small" color={COLORS.primary} />
                            ) : (
                              <>
                                {slot.status === 'available' && !isSelected && (
                                  <View style={styles.availableDot} />
                                )}
                                <Text style={[
                                  styles.slotTime,
                                  isSelected && styles.slotTimeSelected,
                                  (isBooked || isLockedByOthers) && styles.slotTimeDisabled,
                                ]}>
                                  {formatSlotTime(slot.start_time, slot.end_time)}
                                </Text>
                                <Text style={[
                                  styles.slotPrice,
                                  isSelected && styles.slotPriceSelected,
                                ]}>
                                  {formatPrice(slot.price)}
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              ))
            )}

            {/* Locked Slot Timer */}
            {selectedSlot && lockedSlotId && (
              <View style={styles.timerCard}>
                <Text style={styles.timerLabel}>Slot Reserved</Text>
                <Text style={styles.timerText}>{formatCountdown(countdown)}</Text>
                <Text style={styles.timerSubtext}>Complete booking before time expires</Text>
              </View>
            )}

            {/* Confirm Button */}
            <Button
              title={selectedSlot ? "Proceed to Payment" : "Select a Slot"}
              onPress={handleConfirmBooking}
              disabled={!selectedSlot || !lockedSlotId}
              variant="secondary"
            />
          </View>
        </View>

        {/* Tabs */}
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

        <View style={{ height: 120 }} />
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
    gap: 12,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 14,
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
  loadingSlots: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptySubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  resourceSection: {
    marginBottom: 16,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resourceName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  resourceSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  expandIcon: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  slotCard: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    position: 'relative',
    minHeight: 70,
    justifyContent: 'center',
  },
  slotCardSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  slotCardDisabled: {
    opacity: 0.4,
  },
  availableDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  slotTime: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  slotTimeSelected: {
    color: '#92400E',
  },
  slotTimeDisabled: {
    textDecorationLine: 'line-through',
  },
  slotPrice: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  slotPriceSelected: {
    color: '#92400E',
  },
  timerCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  timerLabel: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  timerText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F59E0B',
  },
  timerSubtext: {
    fontSize: 11,
    color: '#92400E',
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
