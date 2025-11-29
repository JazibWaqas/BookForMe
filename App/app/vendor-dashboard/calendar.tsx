import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Card from '../../components/ui/Card';
import { COLORS } from '../../constants/colors';

export default function VendorCalendarScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(15);

  const dates = Array.from({ length: 30 }, (_, i) => i + 1);

  const bookings = [
    { time: '09:00 AM', customer: 'Ahmed Khan', court: 'Court 1', source: 'App' },
    { time: '10:00 AM', customer: 'Sara Ali', court: 'Court 2', source: 'WhatsApp' },
    { time: '11:00 AM', customer: 'Bilal Shah', court: 'Court 1', source: 'Manual' },
    { time: '02:00 PM', customer: 'Fatima Malik', court: 'Court 2', source: 'App' },
    { time: '04:00 PM', customer: 'Hassan Raza', court: 'Court 1', source: 'App' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.monthHeader}>
          <TouchableOpacity>
            <Text style={styles.monthNav}>←</Text>
          </TouchableOpacity>
          <Text style={styles.monthText}>November 2025</Text>
          <TouchableOpacity>
            <Text style={styles.monthNav}>→</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          style={styles.dateScroll}
        >
          {dates.map((date) => (
            <TouchableOpacity
              key={date}
              onPress={() => setSelectedDate(date)}
              style={[styles.dateCard, selectedDate === date && styles.dateCardActive]}
            >
              <Text style={[styles.dateDay, selectedDate === date && styles.dateDayActive]}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date % 7]}
              </Text>
              <Text style={[styles.dateNumber, selectedDate === date && styles.dateNumberActive]}>
                {date}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Filter by source:</Text>
          <View style={styles.filterChips}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>All</Text>
            </View>
            <View style={styles.chipOutline}>
              <Text style={styles.chipTextOutline}>App</Text>
            </View>
            <View style={styles.chipOutline}>
              <Text style={styles.chipTextOutline}>WhatsApp</Text>
            </View>
            <View style={styles.chipOutline}>
              <Text style={styles.chipTextOutline}>Manual</Text>
            </View>
          </View>
        </View>

        <Card>
          <Text style={styles.cardTitle}>Bookings for Nov {selectedDate}</Text>
          <Text style={styles.cardSubtitle}>{bookings.length} bookings scheduled</Text>

          {bookings.map((booking, index) => (
            <View key={index} style={styles.bookingRow}>
              <View style={styles.timeBlock}>
                <Text style={styles.timeText}>{booking.time}</Text>
              </View>
              <View style={styles.bookingInfo}>
                <Text style={styles.customerName}>{booking.customer}</Text>
                <Text style={styles.courtInfo}>{booking.court}</Text>
              </View>
              <View style={styles.sourceBadge}>
                <Text style={styles.sourceText}>{booking.source}</Text>
              </View>
            </View>
          ))}
        </Card>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    paddingVertical: 20,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  monthNav: {
    fontSize: 20,
    color: COLORS.textSecondary,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  dateScroll: {
    paddingLeft: 20,
    marginBottom: 20,
  },
  dateCard: {
    width: 60,
    paddingVertical: 12,
    marginRight: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    alignItems: 'center',
  },
  dateCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  dateDay: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  dateDayActive: {
    color: COLORS.primary,
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  dateNumberActive: {
    color: COLORS.primary,
  },
  filterRow: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  chipOutline: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipTextOutline: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  timeBlock: {
    width: 80,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  bookingInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  courtInfo: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
  },
  sourceText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
});

