import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { format, addDays } from 'date-fns';

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
  bookedSlots
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
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
          <View style={styles.dateRow}>
            {dates.map((date, index) => {
              const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => onDateChange(date)}
                  style={[styles.dateButton, isSelected && styles.dateButtonSelected]}
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
              >
                <Text style={[
                  styles.timeText,
                  isBooked && styles.timeTextBooked,
                  isSelected && styles.timeTextSelected,
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateButton: {
    height: 32,
    borderWidth: 1,
    borderColor: '#4b5563',
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButtonSelected: {
    borderColor: '#6b7280',
    backgroundColor: '#4b5563',
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  dateTextSelected: {
    color: '#f9fafb',
    fontWeight: '600',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeButton: {
    height: 36,
    borderWidth: 2,
    borderColor: '#4b5563',
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeButtonBooked: {
    borderColor: '#374151',
    opacity: 0.5,
  },
  timeButtonSelected: {
    borderColor: '#6b7280',
    backgroundColor: '#4b5563',
  },
  timeText: {
    fontSize: 12,
    color: '#d1d5db',
  },
  timeTextBooked: {
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },
  timeTextSelected: {
    color: '#f9fafb',
    fontWeight: '600',
  },
});
