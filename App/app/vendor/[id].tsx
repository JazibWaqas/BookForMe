import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput
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
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Skeleton, { SkeletonGroup } from '../../components/ui/Skeleton';
import { COLORS, RADIUS, SPACING } from '../../constants/colors';
import { getVendorImage } from '../../constants/vendorImages';
import { getCourtImage } from '../../constants/images';
import { useVendor, useAvailableSlotsOptimized } from '../../hooks/useQueries';
import { apiClient, API_ENDPOINTS } from '../../config/api';
import { showError, showSuccess, showInfo } from '../../utils/feedback';
import { authService } from '../../services/auth';
import { db } from '../../services/firebase';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Review = {
  id: string;
  user_name?: string;
  rating: number;
  title?: string;
  content?: string;
  created_at?: string | null;
};

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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [slotChangeTarget, setSlotChangeTarget] = useState<SlotDetails | null>(null);

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

  const normalizeReviewDate = (value: any): string | null => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value.toDate === 'function') return value.toDate().toISOString();
    if (typeof value.seconds === 'number') return new Date(value.seconds * 1000).toISOString();
    return null;
  };

  const loadReviewsFromFirestore = useCallback(async (vendorId: string) => {
    const snap = await getDocs(query(collection(db, 'reviews'), where('vendor_id', '==', vendorId)));
    const rows: any[] = [];
    const userIds = new Set<string>();

    snap.forEach((reviewDoc) => {
      const data = reviewDoc.data() || {};
      const status = String(data.status || 'published').toLowerCase();
      if (status !== 'published' && status !== 'approved') return;
      if (data.user_id) userIds.add(String(data.user_id));
      rows.push({ id: reviewDoc.id, ...data });
    });

    const users = new Map<string, any>();
    await Promise.all(
      Array.from(userIds).map(async (uid) => {
        try {
          const userSnap = await getDoc(doc(db, 'users', uid));
          if (userSnap.exists()) users.set(uid, userSnap.data());
        } catch {
          // Ignore user hydration failures; the review itself is still useful.
        }
      })
    );

    const normalized = rows
      .map((row) => {
        const user = users.get(row.user_id) || {};
        return {
          id: row.id,
          user_name: user.name || user.display_name || user.email || 'Customer',
          rating: Number(row.rating) || 0,
          title: row.title || '',
          content: row.content || '',
          created_at: normalizeReviewDate(row.created_at),
        };
      })
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

    setReviews(normalized);
  }, []);

  const loadReviews = useCallback(async () => {
    if (!id) return;
    setReviewsLoading(true);
    try {
      const res = await apiClient.get(API_ENDPOINTS.vendors.reviews(id as string));
      if (res.data?.success) {
        setReviews(Array.isArray(res.data.reviews) ? res.data.reviews : []);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      try {
        await loadReviewsFromFirestore(id as string);
      } catch (fallbackError) {
        console.error('Firestore reviews fallback failed:', fallbackError);
      }
    } finally {
      setReviewsLoading(false);
    }
  }, [id, loadReviewsFromFirestore]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

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
        if (slot.status === 'pending' || slot.status === 'confirmed') slotBooked = true;
      }
    });

    // Only update selectedSlot if we found the slot and it's still locked
    // This prevents clearing selection when data refetches
    if (foundSlot && slotStillLocked && !selectedSlot) {
      setSelectedSlot(foundSlot);
    }

    // Check if slot's date matches the current UI date
    const isShowingSameDate = selectedSlot && selectedSlot.date === format(selectedDate, 'yyyy-MM-dd');

    // Only clear if slot is definitively booked/unavailable OR if it disappeared perfectly from the current day's payload
    if (
      (isShowingSameDate && !slotFound) ||
      (foundSlot && (slotBooked || (!slotStillLocked && (foundSlot as SlotDetails).status !== 'available')))
    ) {
      setLockedSlotId(null);
      setSelectedSlot(null);
      setLockExpiry(null);
      setCountdown(0);
    }
  }, [resourceGroups, lockedSlotId, selectedDate, selectedSlot]);

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
      setSlotChangeTarget(slot);
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
        showError('Slot unavailable', result.error || 'This slot is no longer available. Please select another.');
        refetchSlots(); // Only refetch on error
      }
    } catch (error) {
      console.error('Error locking slot:', error);
      showError('Could not reserve slot', 'Please try again.');
    } finally {
      setLockingSlot(null);
    }
  };

  const handleLockExpired = () => {
    showInfo('Reservation expired', 'Please select a slot again.');
    setSelectedSlot(null);
    setLockedSlotId(null);
    setLockExpiry(null);
    setCountdown(0);
    refetchSlots();
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

  const submitReview = async () => {
    if (!vendor) return;
    const content = reviewContent.trim();
    const title = reviewTitle.trim();
    if (!content) {
      showError('Review is empty', 'Share a quick note about your experience.');
      return;
    }
    setReviewSubmitting(true);
    const resetReviewForm = () => {
      setReviewModalVisible(false);
      setReviewRating(5);
      setReviewTitle('');
      setReviewContent('');
    };
    const postViaFirestore = async () => {
      const user = await authService.getCurrentUser();
      if (!user?.id) {
        throw new Error('Please log in before writing a review.');
      }
      const ref = await addDoc(collection(db, 'reviews'), {
        vendor_id: vendor.id,
        user_id: user.id,
        slot_id: null,
        rating: reviewRating,
        title,
        content,
        status: 'published',
        created_at: serverTimestamp(),
      });
      setReviews((prev) => [
        {
          id: ref.id,
          user_name: user.name || 'You',
          rating: reviewRating,
          title,
          content,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      try {
        await updateDoc(doc(db, 'vendors', vendor.id), {
          rating_sum: increment(reviewRating),
          rating_count: increment(1),
          review_count: increment(1),
        });
      } catch {
        // Review is posted even if aggregate counters are backend-owned.
      }
    };

    try {
      const res = await apiClient.post(API_ENDPOINTS.vendors.reviews(vendor.id), {
        rating: reviewRating,
        title,
        content,
      });
      if (res.data?.success) {
        showSuccess('Review posted', 'Thanks for helping other players choose.');
        resetReviewForm();
        loadReviews();
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        try {
          await postViaFirestore();
          showSuccess('Review posted', 'Thanks for helping other players choose.');
          resetReviewForm();
          return;
        } catch (fallbackError: any) {
          showError('Review failed', fallbackError?.message || 'Could not post your review.');
          return;
        }
      }
      const message = error?.response?.status === 401
        ? 'Please log in before writing a review.'
        : error?.response?.data?.detail || 'Could not post your review.';
      showError('Review failed', message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const formatReviewDate = (value?: string | null) => {
    if (!value) return '';
    try {
      return format(new Date(value), 'MMM d');
    } catch {
      return '';
    }
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
      <View style={styles.container}>
        <SkeletonGroup>
          {/* Hero image */}
          <Skeleton width="100%" height={260} borderRadius={0} />
          {/* Body */}
          <View style={{ padding: SPACING.xl, gap: SPACING.md }}>
            <Skeleton width="70%" height={26} />
            <Skeleton width="50%" height={14} />
            <Skeleton width="100%" height={1} style={{ marginVertical: SPACING.md }} />
            <Skeleton width="40%" height={16} />
            <View style={{ flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm }}>
              <Skeleton width={92} height={88} borderRadius={RADIUS.md} />
              <Skeleton width={92} height={88} borderRadius={RADIUS.md} />
              <Skeleton width={92} height={88} borderRadius={RADIUS.md} />
            </View>
            <Skeleton width="100%" height={1} style={{ marginVertical: SPACING.md }} />
            <Skeleton width="35%" height={14} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm }}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} width={78} height={36} borderRadius={RADIUS.sm} />
              ))}
            </View>
          </View>
        </SkeletonGroup>
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
            <Text style={styles.infoText}>
              ★ {vendor.rating || (vendor as any).average_rating || 4.9} ({vendor.review_count || reviews.length || 0} reviews)
            </Text>
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
                        const isBooked = slot.status === 'pending' || slot.status === 'confirmed';
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
              <View style={styles.reviewsWrap}>
                <TouchableOpacity
                  style={styles.writeReviewButton}
                  onPress={() => setReviewModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.writeReviewText}>Write a review</Text>
                </TouchableOpacity>

                {reviewsLoading ? (
                  <View style={styles.reviewsLoading}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.placeholderText}>Loading reviews...</Text>
                  </View>
                ) : reviews.length === 0 ? (
                  <Text style={styles.placeholderText}>No reviews yet. Be the first to review this venue.</Text>
                ) : (
                  reviews.map((review) => (
                    <View key={review.id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <Text style={styles.reviewAuthor}>{review.user_name || 'Customer'}</Text>
                        <Text style={styles.reviewRating}>{'★'.repeat(Math.max(1, Math.min(5, review.rating || 0)))}</Text>
                      </View>
                      <View style={styles.reviewMetaRow}>
                        {!!review.title && <Text style={styles.reviewTitle}>{review.title}</Text>}
                        {!!formatReviewDate(review.created_at) && (
                          <Text style={styles.reviewDate}>{formatReviewDate(review.created_at)}</Text>
                        )}
                      </View>
                      {!!review.content && <Text style={styles.reviewContent}>{review.content}</Text>}
                    </View>
                  ))
                )}
              </View>
            )}
            {activeTab === 'location' && (
              <Text style={styles.addressText}>{vendor.address}</Text>
            )}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal visible={reviewModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.reviewModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write a Review</Text>
              <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                <Text style={styles.modalClose}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Rating</Text>
            <View style={styles.ratingPicker}>
              {[1, 2, 3, 4, 5].map((value) => (
                <TouchableOpacity key={value} onPress={() => setReviewRating(value)} style={styles.starButton}>
                  <Text style={[styles.starText, value <= reviewRating && styles.starTextActive]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Title</Text>
            <TextInput
              value={reviewTitle}
              onChangeText={setReviewTitle}
              placeholder="Short summary"
              placeholderTextColor={COLORS.textMuted}
              style={styles.reviewInput}
            />

            <Text style={styles.modalLabel}>Review</Text>
            <TextInput
              value={reviewContent}
              onChangeText={setReviewContent}
              placeholder="How was the court, staff, and booking experience?"
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
              style={[styles.reviewInput, styles.reviewTextArea]}
            />

            <Button
              title="Post Review"
              onPress={submitReview}
              loading={reviewSubmitting}
              variant="secondary"
            />
          </View>
        </View>
      </Modal>
      <ConfirmDialog
        visible={!!slotChangeTarget}
        title="Change Selection?"
        message="You already have a slot reserved. Selecting a new slot will release your current reservation."
        confirmLabel="Change Slot"
        destructive
        onCancel={() => setSlotChangeTarget(null)}
        onConfirm={() => {
          const target = slotChangeTarget;
          setSlotChangeTarget(null);
          if (target) lockNewSlot(target);
        }}
      />
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
    marginHorizontal: -20,
    marginTop: -20,
    marginBottom: 20,
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
    borderColor: 'rgba(255,255,255,0.1)',
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
    borderColor: 'rgba(255,255,255,0.1)',
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
  reviewsWrap: {
    gap: 12,
  },
  writeReviewButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  writeReviewText: {
    color: COLORS.textDark,
    fontSize: 13,
    fontWeight: '700',
  },
  reviewsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: COLORS.backgroundLight,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  reviewAuthor: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  reviewRating: {
    fontSize: 12,
    color: '#F59E0B',
    letterSpacing: 1,
  },
  reviewMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 6,
  },
  reviewTitle: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  reviewContent: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 19,
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  reviewModal: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 10,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalClose: {
    fontSize: 28,
    color: COLORS.textMuted,
    lineHeight: 30,
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginTop: 4,
  },
  ratingPicker: {
    flexDirection: 'row',
    gap: 2,
  },
  starButton: {
    paddingRight: 8,
    paddingVertical: 2,
  },
  starText: {
    fontSize: 30,
    color: COLORS.border,
  },
  starTextActive: {
    color: '#F59E0B',
  },
  reviewInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14,
  },
  reviewTextArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  addressText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
