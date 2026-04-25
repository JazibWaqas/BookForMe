import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { format, addDays } from 'date-fns';
import { COLORS, RADIUS, SPACING } from '../constants/colors';

interface TimeSlotPickerProps {
  selectedDate: Date;
  selectedTime: string | null;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: string) => void;
  availableSlots: string[];
  bookedSlots: string[];
}

export default function TimeSlotPicker({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  availableSlots,
  bookedSlots,
}: TimeSlotPickerProps) {
  const generateDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(new Date(), i));
    }
    return dates;
  };

  const dates = generateDates();

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.dateRow}>
            {dates.map((date, index) => {
              const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => onDateChange(date)}
                  style={[styles.dateButton, isSelected && styles.dateButtonSelected]}
                  accessible
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={format(date, 'EEEE, MMMM d')}
                >
                  <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>
                    {format(date, 'd')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Available Time Slots</Text>
        {availableSlots.length === 0 ? (
          <Text style={styles.emptyText}>No slots available for this date.</Text>
        ) : (
          <View style={styles.timeGrid}>
            {availableSlots.map((time) => {
              const isBooked = bookedSlots.includes(time);
              const isSelected = time === selectedTime;

              return (
                <TouchableOpacity
                  key={time}
                  onPress={() => !isBooked && onTimeChange(time)}
                  disabled={isBooked}
                  style={[
                    styles.timeButton,
                    isBooked && styles.timeButtonBooked,
                    isSelected && styles.timeButtonSelected,
                  ]}
                  accessible
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected, disabled: isBooked }}
                  accessibilityLabel={
                    isBooked ? `${time}, booked` : `${time}${isSelected ? ', selected' : ''}`
                  }
                >
                  <Text
                    style={[
                      styles.timeText,
                      isBooked && styles.timeTextBooked,
                      isSelected && styles.timeTextSelected,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  section: {
    gap: SPACING.sm,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    paddingVertical: SPACING.md,
  },
  dateRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dateButton: {
    height: 36,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  dateButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryGlow,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  dateTextSelected: {
    color: COLORS.text,
    fontWeight: '700',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  timeButton: {
    height: 38,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  timeButtonBooked: {
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
    opacity: 0.5,
  },
  timeButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryGlow,
  },
  timeText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  timeTextBooked: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  timeTextSelected: {
    color: COLORS.text,
    fontWeight: '700',
  },
});
