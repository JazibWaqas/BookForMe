import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export type SlotStatus = 'available' | 'booked' | 'locked';

export interface TimeSlot {
    id: string;
    time: string;
    startTime: string;
    endTime: string;
    status: SlotStatus;
    price: number;
    isPeak: boolean;
    lockedBy?: string;
    lockedUntil?: Date;
}

interface AvailabilityCalendarProps {
    vendorId: string;
    selectedDate: Date;
    onSlotSelect: (slots: TimeSlot[]) => void;
    allowMultiSelect?: boolean;
}

export default function AvailabilityCalendar({
    vendorId,
    selectedDate,
    onSlotSelect,
    allowMultiSelect = false,
}: AvailabilityCalendarProps) {
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

    const generateSlots = (): TimeSlot[] => {
        const slots: TimeSlot[] = [];
        const hours = [
            '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
            '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
            '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
        ];

        hours.forEach((hour, index) => {
            const nextHour = hours[index + 1] || '00:00';
            const hourNum = parseInt(hour.split(':')[0]);

            const isPeak = (hourNum >= 6 && hourNum <= 9) || (hourNum >= 18 && hourNum <= 22);
            const basePrice = 1000;
            const peakMultiplier = 1.5;
            const price = isPeak ? basePrice * peakMultiplier : basePrice;

            let status: SlotStatus = 'available';
            if (Math.random() > 0.7) {
                status = Math.random() > 0.5 ? 'booked' : 'locked';
            }

            slots.push({
                id: `slot-${hour}`,
                time: hour,
                startTime: hour,
                endTime: nextHour,
                status,
                price,
                isPeak,
            });
        });

        return slots;
    };

    const slots = generateSlots();

    const handleSlotPress = (slot: TimeSlot) => {
        if (slot.status !== 'available') return;

        if (allowMultiSelect) {
            const isSelected = selectedSlots.includes(slot.id);
            let newSelection: string[];

            if (isSelected) {
                newSelection = selectedSlots.filter(id => id !== slot.id);
            } else {
                newSelection = [...selectedSlots, slot.id];
            }

            setSelectedSlots(newSelection);
            const selectedSlotObjects = slots.filter(s => newSelection.includes(s.id));
            onSlotSelect(selectedSlotObjects);
        } else {
            setSelectedSlots([slot.id]);
            onSlotSelect([slot]);
        }
    };

    const getSlotStyle = (slot: TimeSlot) => {
        const isSelected = selectedSlots.includes(slot.id);

        if (isSelected) return styles.slotSelected;

        switch (slot.status) {
            case 'available': return styles.slotAvailable;
            case 'booked': return styles.slotBooked;
            case 'locked': return styles.slotLocked;
            default: return styles.slotAvailable;
        }
    };

    const getSlotTextStyle = (slot: TimeSlot) => {
        const isSelected = selectedSlots.includes(slot.id);

        if (isSelected) return styles.slotTextSelected;

        switch (slot.status) {
            case 'available': return styles.slotTextAvailable;
            case 'booked': return styles.slotTextBooked;
            case 'locked': return styles.slotTextLocked;
            default: return styles.slotTextAvailable;
        }
    };

    const getTotalPrice = () => {
        return slots
            .filter(s => selectedSlots.includes(s.id))
            .reduce((sum, slot) => sum + slot.price, 0);
    };

    const getTotalHours = () => selectedSlots.length;

    return (
        <View style={styles.container}>
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, styles.legendAvailable]} />
                    <Text style={styles.legendText}>Available</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, styles.legendBooked]} />
                    <Text style={styles.legendText}>Booked</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, styles.legendLocked]} />
                    <Text style={styles.legendText}>Locked</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, styles.legendPeak]} />
                    <Text style={styles.legendText}>Peak</Text>
                </View>
            </View>

            <ScrollView style={styles.slotsContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.slotsGrid}>
                    {slots.map((slot) => (
                        <TouchableOpacity
                            key={slot.id}
                            style={[styles.slot, getSlotStyle(slot)]}
                            onPress={() => handleSlotPress(slot)}
                            disabled={slot.status !== 'available'}
                            activeOpacity={0.7}
                        >
                            <View style={styles.slotContent}>
                                {slot.isPeak && slot.status === 'available' && (
                                    <View style={styles.peakBadge}>
                                        <Text style={styles.peakBadgeText}>PEAK</Text>
                                    </View>
                                )}
                                <Text style={[styles.slotTime, getSlotTextStyle(slot)]}>
                                    {slot.time}
                                </Text>
                                <Text style={[styles.slotPrice, getSlotTextStyle(slot)]}>
                                    PKR {slot.price}
                                </Text>
                                {slot.status === 'booked' && (
                                    <Text style={styles.slotStatus}>Booked</Text>
                                )}
                                {slot.status === 'locked' && (
                                    <Text style={styles.slotStatus}>Locked</Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {selectedSlots.length > 0 && (
                <View style={styles.summary}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>
                            {getTotalHours()} hour{getTotalHours() > 1 ? 's' : ''} selected
                        </Text>
                        <Text style={styles.summaryTotal}>PKR {getTotalPrice()}</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        paddingHorizontal: 8,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        marginBottom: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    legendAvailable: {
        backgroundColor: COLORS.success,
    },
    legendBooked: {
        backgroundColor: COLORS.error,
    },
    legendLocked: {
        backgroundColor: COLORS.warning,
    },
    legendPeak: {
        backgroundColor: COLORS.primary,
    },
    legendText: {
        fontSize: 11,
        color: COLORS.textMuted,
        fontWeight: '500',
    },
    slotsContainer: {
        flex: 1,
    },
    slotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    slot: {
        width: '48%',
        aspectRatio: 2,
        borderRadius: 12,
        borderWidth: 2,
        padding: 12,
        justifyContent: 'center',
    },
    slotAvailable: {
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        borderColor: COLORS.success,
    },
    slotBooked: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: COLORS.error,
        opacity: 0.6,
    },
    slotLocked: {
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        borderColor: COLORS.warning,
        opacity: 0.6,
    },
    slotSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    slotContent: {
        alignItems: 'center',
        gap: 4,
    },
    slotTime: {
        fontSize: 16,
        fontWeight: '700',
    },
    slotPrice: {
        fontSize: 12,
        fontWeight: '600',
    },
    slotTextAvailable: {
        color: COLORS.success,
    },
    slotTextBooked: {
        color: COLORS.error,
    },
    slotTextLocked: {
        color: COLORS.warning,
    },
    slotTextSelected: {
        color: COLORS.textDark,
    },
    slotStatus: {
        fontSize: 10,
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 2,
    },
    peakBadge: {
        position: 'absolute',
        top: 6,
        left: 6,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    peakBadgeText: {
        fontSize: 8,
        fontWeight: '700',
        color: COLORS.textDark,
        letterSpacing: 0.5,
    },
    summary: {
        marginTop: 16,
        padding: 16,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    summaryTotal: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.primary,
    },
});
