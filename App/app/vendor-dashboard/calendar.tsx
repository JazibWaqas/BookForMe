import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, TextInput, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
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

// Format date as YYYY-MM-DD
const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0];
};

// Format date as YYYYMMDD (for slot ID construction matching the seeder format)
const formatDateCompact = (date: Date) => {
  return date.toISOString().split('T')[0].replace(/-/g, '');
};

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
  const [selectedSlot, setSelectedSlot] = useState<{ time: string, resource: string } | null>(null);
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

  // Set up 3-second Auto Polling (Ghost Sync)
  useEffect(() => {
    if (!vendorId) return;

    const intervalId = setInterval(() => {
      fetchGridData(vendorId, formatDate(currentDate));
    }, 3000);

    return () => clearInterval(intervalId);
  }, [vendorId, currentDate, fetchGridData]);

  // Handle Date Navigation
  const changeDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
    if (vendorId) {
      // Show loading only when manually shifting date so we don't flash on auto-poll
      setLoading(true);
      fetchGridData(vendorId, formatDate(newDate)).finally(() => setLoading(false));
    }
  };

  // Helper to find specific slot status
  const getSlotDetails = (time: string, resourceId: string) => {
    return gridData.find(s => s.time === time && s.resource_id === resourceId);
  };

  const handleSlotPress = (time: string, resource: string, slot?: any) => {
    if (slot && slot.status === 'available') {
      // Pre-seeded slot that is open — open walk-in modal
      setSelectedSlot({ time, resource });
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
      const hour = selectedSlot.time.split(':')[0]; // "08" from "08:00"
      const dateCompact = formatDateCompact(currentDate); // "20260225"
      const slotId = `${dateCompact}_${hour}_${vendorId}_${selectedSlot.resource}`;

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
          <Text style={styles.monthNav}>←</Text>
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateNavButton}>
          <Text style={styles.monthNav}>→</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal bounces={false} style={styles.horizontalScroll}>
        <View>
          {/* Grid Header (Columns) */}
          <View style={styles.gridHeaderRow}>
            <View style={styles.timeHeaderCell} />
            {resources.map((res, index) => {
              // Create a cleaner display name for "ace_court_1" -> "1"
              const cleanName = res.split('_').pop() || String(index + 1);
              return (
                <View key={res} style={styles.courtHeaderCell}>
                  <Text style={styles.courtHeaderText}>Court {cleanName}</Text>
                </View>
              );
            })}
          </View>

          {/* Grid Body */}
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
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
                  let cellText = 'AVAILABLE';
                  let statusLabel = '';

                  if (slot) {
                    if (slot.status === 'available') {
                      // Green — tap to walk-in
                      cellStyle = styles.slotAvailable;
                      cellText = 'AVAILABLE';
                    } else if (slot.status === 'locked' || slot.status === 'pending') {
                      cellStyle = styles.slotPending;
                      cellText = 'AWAITING PAYMENT';
                    } else if (slot.status === 'confirmed' || slot.status === 'completed') {
                      cellStyle = styles.slotConfirmed;
                      cellText = slot.customer_name || 'BOOKED';
                      statusLabel = slot.booking_source === 'whatsapp' ? '📱 WA' : slot.booking_source === 'walk-in' ? '🚶 WI' : '📲 APP';
                    } else if (slot.status === 'blocked') {
                      cellStyle = styles.slotBlocked;
                      cellText = 'BLOCKED';
                    }
                  } else {
                    // No document at all — outside seeded date range
                    cellText = 'NO SLOT';
                    cellStyle = [styles.slotAvailable, { backgroundColor: '#E5E7EB' }];
                  }

                  return (
                    <TouchableOpacity
                      key={`${time}-${res}`}
                      style={[styles.slotCell, cellStyle]}
                      activeOpacity={0.7}
                      onPress={() => handleSlotPress(time, res, slot)}
                    >
                      <Text style={styles.slotCellText}>
                        {cellText}
                      </Text>
                      {statusLabel ? (
                        <Text style={styles.slotSourceText}>{statusLabel}</Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
            <View style={{ height: 100 }} />
          </ScrollView>
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
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Amount (PKR)</Text>
              <TextInput
                style={styles.input}
                value={walkInAmount}
                onChangeText={setWalkInAmount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.label}>Mark as Paid</Text>
              <Switch
                value={walkInPaid}
                onValueChange={setWalkInPaid}
                trackColor={{ false: '#767577', true: COLORS.primary }}
              />
            </View>

            <Button
              title="Confirm Walk-In"
              onPress={submitWalkIn}
              loading={submitting}
              style={{ marginTop: 20 }}
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
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)'
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 6,
  },
  liveText: {
    color: Object.is(COLORS.primary, '#000000') ? '#4ADE80' : COLORS.primary, // Make sure it pops
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1
  },
  backText: {
    color: COLORS.textSecondary,
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dateNavButton: {
    padding: 10,
  },
  monthNav: {
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: 'bold'
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  horizontalScroll: {
    flex: 1,
  },
  gridHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.backgroundLight,
    paddingVertical: 10,
  },
  timeHeaderCell: {
    width: 70,
  },
  courtHeaderCell: {
    width: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courtHeaderText: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  gridRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  timeAxisCell: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingVertical: 20,
    backgroundColor: COLORS.backgroundLight,
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  slotCell: {
    width: 140,
    height: 60,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotAvailable: {
    backgroundColor: '#A7F3D0', // Solid light green
  },
  slotPending: {
    backgroundColor: '#FDE047', // Solid yellow
  },
  slotConfirmed: {
    backgroundColor: '#FCA5A5', // Solid light red
  },
  slotBlocked: {
    backgroundColor: '#E5E7EB', // Solid light gray
  },
  slotCellText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937', // Dark gray for high contrast on all solid backgrounds
    textAlign: 'center',
  },
  slotSourceText: {
    fontSize: 10,
    color: '#4B5563', // Slightly lighter dark gray
    marginTop: 4,
    fontWeight: '700'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
    fontWeight: '600',
  },
  closeModalText: {
    fontSize: 24,
    color: COLORS.textSecondary,
    padding: 10,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  }
});
