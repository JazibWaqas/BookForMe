import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, TextInput, Alert, Switch, Dimensions, Animated, AppState } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '../../components/ui/Button';
import { COLORS } from '../../constants/colors';
import { authService } from '../../services/auth';
import { apiClient, API_ENDPOINTS } from '../../config/api';

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const formatTo12Hour = (time24: string) => {
  if (!time24) return '';
  const [hourStr, minStr] = time24.split(':');
  const hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minStr} ${period}`;
};

const generateTimeSlots = (open: string, close: string) => {
  const slots: string[] = [];
  let currentHour = parseInt(open.split(':')[0], 10);
  let closeHour = parseInt(close.split(':')[0], 10);

  // Handle midnight close (00:00) and overnight scenarios
  if (closeHour === 0) closeHour = 24;
  if (closeHour <= currentHour) {
    closeHour += 24;
  }

  for (let h = currentHour; h < closeHour; h++) {
    const displayHour = h % 24;
    slots.push(`${displayHour.toString().padStart(2, '0')}:00`);
  }
  return slots;
};

const localYmd = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDate = (date: Date) => localYmd(date);

const formatDateCompact = (date: Date) => localYmd(date).replace(/-/g, '');

export default function VendorCalendarScreen() {
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [gridData, setGridData] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [resources, setResources] = useState<string[]>(['1', '2', '3']); // Defaulting to 3 courts, will update dynamically based on data if possible.

  // Walk-in modal state
  const [selectedSlot, setSelectedSlot] = useState<{ time: string; resource: string; slotId?: string } | null>(null);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInAmount, setWalkInAmount] = useState('0');
  const [walkInPaid, setWalkInPaid] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchGridData = useCallback(async (vId: string, dateStr: string) => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.vendors.grid(vId, dateStr));
      if (res.data.success) {
        setGridData(res.data.slots || []);

        // Compute time slots from operating hours
        const opHours = res.data.operating_hours || {};
        const dayOfWeek = DAYS[new Date(dateStr).getDay()];
        const todayHours = opHours[dayOfWeek] || { open: '08:00', close: '23:00' };
        setTimeSlots(generateTimeSlots(todayHours.open, todayHours.close));

        // Dynamically extract unique courts/resources from the data if they exist
        const uniqueCourts = Array.from(new Set(res.data.slots.map((s: any) => s.resource_id))).filter(Boolean) as string[];
        if (uniqueCourts.length > 0) {
          // Sort courts so "1" comes before "2"
          setResources(uniqueCourts.sort((a, b) => a.localeCompare(b)));
        }
      }
    } catch (error) {
      console.error('Error fetching grid data:', error);
    }
  }, []);

  // Initial Load & Auth
  useEffect(() => {
    const initialize = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user && user.vendor_id) {
          setVendorId(user.vendor_id);
          await fetchGridData(user.vendor_id, formatDate(currentDate));
        }
      } catch (error) {
        console.error('Error initializing calendar map:', error);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    if (!vendorId) return;
    const id = setInterval(() => fetchGridData(vendorId, formatDate(currentDate)), 5000);
    return () => clearInterval(id);
  }, [vendorId, currentDate, fetchGridData]);

  useEffect(() => {
    if (!vendorId) return;
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        fetchGridData(vendorId, formatDate(currentDate));
      }
    });
    return () => sub.remove();
  }, [vendorId, currentDate, fetchGridData]);

  const initialLoadDone = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
        return;
      }
      if (vendorId) {
        fetchGridData(vendorId, formatDate(currentDate));
      }
    }, [vendorId, currentDate, fetchGridData])
  );

  // Animation value for date change
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Handle Date Navigation
  const changeDate = (days: number) => {
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0.3,
      duration: 150,
      useNativeDriver: true,
    }).start();

    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
    if (vendorId) {
      setLoading(true);
      fetchGridData(vendorId, formatDate(newDate)).finally(() => {
        setLoading(false);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    } else {
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  };

  // Calculate dynamic column width
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const TIME_COLUMN_WIDTH = 70;
  const dynamicColWidth = Math.max((SCREEN_WIDTH - TIME_COLUMN_WIDTH) / Math.max(resources.length, 1), 110);


  // Helper to find specific slot status
  const getSlotDetails = (time: string, resourceId: string) => {
    const matches = gridData.filter((s) => s.time === time && s.resource_id === resourceId);
    if (matches.length === 0) return undefined;
    if (matches.length === 1) return matches[0];
    const rank = (st: string) => {
      if (st === 'available') return 0;
      if (st === 'locked' || st === 'pending') return 1;
      if (st === 'confirmed' || st === 'completed') return 2;
      if (st === 'cancelled') return 3;
      if (st === 'blocked') return 4;
      return 5;
    };
    return [...matches].sort((a, b) => rank(a.status) - rank(b.status))[0];
  };

  const handleSlotPress = (time: string, resource: string, slot?: any) => {
    if (slot && (slot.status === 'available' || slot.status === 'cancelled')) {
      setSelectedSlot({ time, resource, slotId: slot.id });
      setWalkInName('');
      setWalkInPhone('');
      setWalkInAmount('2000');
      setWalkInPaid(true);
    } else if (!slot) {
      // No document at all (outside seeded range) — do nothing, just inform
      Alert.alert("Unavailable", "This time slot has not been generated yet. Re-seed slots from the dashboard to add it.");
    } else if (slot.status === 'confirmed' || slot.status === 'pending' || slot.status === 'locked') {
      router.push(`/vendor-dashboard/booking-detail?bookingId=${slot.id}`);
    } else if (slot.status === 'blocked') {
      Alert.alert("Blocked", "This slot is blocked for maintenance.");
    }
  };

  const submitWalkIn = async () => {
    if (!selectedSlot || !vendorId || !walkInName) {
      Alert.alert("Error", "Please provide at least a customer name.");
      return;
    }
    setSubmitting(true);
    try {
      // Construct slot ID matching the seeder format: YYYYMMDD_HH_vendorId_resourceId
      // e.g. 20260225_08_ace_padel_dha_ace_court_1
      const hour = selectedSlot.time.split(':')[0];
      const dateCompact = formatDateCompact(currentDate);
      const slotId =
        selectedSlot.slotId || `${dateCompact}_${hour}_${vendorId}_${selectedSlot.resource}`;

      const res = await apiClient.post(API_ENDPOINTS.vendors.walkIn(vendorId, slotId), {
        customer_name: walkInName,
        phone: walkInPhone,
        amount: parseFloat(walkInAmount) || 0,
        paid: walkInPaid
      });

      if (res.data.success) {
        Alert.alert("Success", "Walk-in booked successfully!");
        setSelectedSlot(null);
        fetchGridData(vendorId, formatDate(currentDate)); // refresh
      } else {
        Alert.alert("Error", res.data.error || "Could not book walk-in.");
      }
    } catch (e: any) {
      const errMsg = e?.response?.data?.detail || "An error occurred creating the walk-in.";
      Alert.alert("Error", errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && gridData.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Court Grid</Text>
        <View style={styles.headerRightToggle}>
          {/* Visual indicator that polling is active */}
          <View style={styles.pulseDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateNavButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateNavButton}>
          <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal bounces={false} style={styles.horizontalScroll}>
        <View style={{ minWidth: SCREEN_WIDTH }}>
          {/* Grid Header (Columns) */}
          <View style={styles.gridHeaderRow}>
            <View style={styles.timeHeaderCell} />
            {resources.map((res, index) => {
              // Create a cleaner display name for "ace_court_1" -> "1"
              const cleanName = res.split('_').pop() || String(index + 1);
              return (
                <View key={res} style={[styles.courtHeaderCell, { width: dynamicColWidth }]}>
                  <Text style={styles.courtHeaderText}>Court {cleanName}</Text>
                </View>
              );
            })}
          </View>

          {/* Grid Body */}
          <Animated.ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            style={{ opacity: fadeAnim }}
          >
            {timeSlots.map((time) => (
              <View key={time} style={styles.gridRow}>
                {/* Time Label */}
                <View style={styles.timeAxisCell}>
                  <Text style={styles.timeText}>{formatTo12Hour(time)}</Text>
                </View>

                {/* Court Cells */}
                {resources.map((res) => {
                  const slot = getSlotDetails(time, res);
                  let cellStyle: any = styles.slotAvailable;
                  let cellText = '';
                  let statusLabel = '';
                  let statusIcon = '';
                  let iconColor = '';
                  let textStyle: any = styles.slotCellTextEmpty;

                  if (slot) {
                    if (slot.status === 'available' || slot.status === 'cancelled') {
                      cellStyle = styles.slotAvailable;
                      cellText = '+ Available';
                      textStyle = styles.slotCellTextEmpty;
                    } else if (slot.status === 'locked' || slot.status === 'pending') {
                      cellStyle = styles.slotPending;
                      cellText = 'Awaiting Pay';
                      textStyle = styles.slotCellTextPending;
                    } else if (slot.status === 'confirmed' || slot.status === 'completed') {
                      cellStyle = styles.slotConfirmed;
                      cellText = slot.customer_name
                        ? slot.customer_name.charAt(0).toUpperCase() + slot.customer_name.slice(1)
                        : 'Booked';
                      textStyle = styles.slotCellTextBooked;
                      const source = slot.booking_source;
                      if (source === 'whatsapp' || source === 'whatsapp_ai') {
                        statusLabel = 'WhatsApp';
                        statusIcon = 'logo-whatsapp';
                        iconColor = '#4ADE80';
                      } else if (source === 'walk-in') {
                        statusLabel = 'Walk-in';
                        statusIcon = 'walk';
                        iconColor = '#60A5FA';
                      } else {
                        statusLabel = 'App Booking';
                        statusIcon = 'phone-portrait-outline';
                        iconColor = '#A78BFA';
                      }
                    } else if (slot.status === 'blocked') {
                      cellStyle = styles.slotBlocked;
                      cellText = 'Blocked';
                      textStyle = styles.slotCellTextBlocked;
                    }
                  } else {
                    cellText = '—';
                    cellStyle = styles.slotAvailable; // Match available design for outer slots
                  }

                  return (
                    <TouchableOpacity
                      key={`${time}-${res}`}
                      style={[styles.slotCellBase, { width: dynamicColWidth }, cellStyle]}
                      activeOpacity={0.7}
                      onPress={() => handleSlotPress(time, res, slot)}
                    >
                      <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={textStyle} numberOfLines={1}>
                          {cellText}
                        </Text>
                        {statusLabel ? (
                          <View style={styles.slotSourceRow}>
                            {statusIcon ? <Ionicons name={statusIcon as any} size={10} color={iconColor} style={{ marginRight: 4 }} /> : null}
                            <Text style={styles.slotSourceText}>{statusLabel}</Text>
                          </View>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
            <View style={{ height: 100 }} />
          </Animated.ScrollView>
        </View>
      </ScrollView>

      {/* Walk In Modal */}
      <Modal
        visible={!!selectedSlot}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Walk-In Booking</Text>
              <TouchableOpacity onPress={() => setSelectedSlot(null)}>
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedSlot && (
              <Text style={styles.modalSubtitle}>
                Court {selectedSlot.resource.split('_').pop()} • {formatTo12Hour(selectedSlot.time)}
              </Text>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Customer Name *</Text>
              <TextInput
                style={styles.input}
                value={walkInName}
                onChangeText={setWalkInName}
                placeholder="e.g. John Doe"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={walkInPhone}
                onChangeText={setWalkInPhone}
                keyboardType="phone-pad"
                placeholder="0300 1234567"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Amount (PKR)</Text>
              <TextInput
                style={styles.input}
                value={walkInAmount}
                onChangeText={setWalkInAmount}
                keyboardType="numeric"
                placeholder="e.g. 2500"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.label}>Mark as Paid</Text>
              <Switch
                value={walkInPaid}
                onValueChange={setWalkInPaid}
                trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: '#00EA77' }}
                thumbColor="#FFF"
              />
            </View>

            <Button
              title="Confirm Walk-In"
              onPress={submitWalkIn}
              loading={submitting}
              style={{ marginTop: 24, backgroundColor: '#00EA77' }}
              textStyle={{ color: '#111827', fontWeight: '800', fontSize: 16 }}
            />
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
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
  headerRightToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.05)', // Reduced brightness
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.15)'
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00EA77', // Glowing green
    marginRight: 6,
    shadowColor: '#00EA77',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  liveText: {
    color: '#00EA77',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1
  },
  backText: {
    color: COLORS.textSecondary,
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900', // Increased weight
    color: '#FFF',
    letterSpacing: -0.5,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dateNavButton: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  horizontalScroll: {
    flex: 1,
  },
  gridHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    paddingVertical: 12,
  },
  timeHeaderCell: {
    width: 70,
  },
  courtHeaderCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  courtHeaderText: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  gridRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  timeAxisCell: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 24,
    backgroundColor: 'transparent',
  },
  timeText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '600',
  },
  slotCellBase: {
    height: 88, // slightly taller for breathing room
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.03)', // Faint scratched glass look
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotCellInner: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  slotAvailable: {
    backgroundColor: 'rgba(0, 208, 132, 0.02)', // Subtle green empty state
    marginVertical: 6,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.15)', // Muted green dashed border
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotPending: {
    backgroundColor: '#1E293B', // Rich slate
    marginVertical: 6,
    marginHorizontal: 4,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B', // Bright amber indicator
    paddingHorizontal: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  slotConfirmed: {
    backgroundColor: '#1E293B', // Rich slate
    marginVertical: 6,
    marginHorizontal: 4,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#00EA77', // Electric green indicator
    paddingHorizontal: 12, // More breathing room 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  slotBlocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    margin: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  slotCellTextBooked: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  slotCellTextEmpty: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(0, 208, 132, 0.6)', // Subdued green
  },
  slotCellTextPending: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F59E0B',
  },
  slotCellTextBlocked: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.3)',
  },
  slotSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  slotSourceText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111827', // Deep modal background
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    padding: 24,
    paddingBottom: 48,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(0, 208, 132, 0.8)', // Subtle green for selected court/time
    marginBottom: 24,
    fontWeight: '700',
  },
  closeModalText: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.4)',
    padding: 10,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)', // Subtle inset feel
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  }
});
