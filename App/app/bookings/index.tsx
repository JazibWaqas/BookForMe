import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Booking } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { COLORS } from '../../constants/colors';
import { format } from 'date-fns';
import { useUserBookings } from '../../hooks/useQueries';

type BookingStatus = 'locked' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

export default function MyBookingsScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [countdown, setCountdown] = useState<{ [key: string]: number }>({});
    
    // Use React Query for bookings - cached and fast
    const { data: bookings = [], isLoading: loading, isFetching } = useUserBookings();

    // No refetch on focus - prioritize speed over freshness
    // Data is invalidated after booking payment, which is what matters

    useEffect(() => {
        const interval = setInterval(() => {
            const newCountdown: { [key: string]: number } = {};
            bookings.forEach((booking) => {
                if (booking.status === 'locked') {
                    newCountdown[booking.id] = 600;
                }
            });
            setCountdown(newCountdown);
        }, 1000);
        return () => clearInterval(interval);
    }, [bookings]);

    const formatCountdown = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'locked':
                return COLORS.warning;
            case 'pending':
                return COLORS.success;
            case 'confirmed':
                return COLORS.success;
            case 'completed':
                return COLORS.textMuted;
            case 'cancelled':
                return COLORS.error;
            default:
                return COLORS.textMuted;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'locked':
                return 'SLOT LOCKED';
            case 'pending':
                return 'BOOKED';
            case 'confirmed':
                return 'BOOKED';
            case 'completed':
                return 'COMPLETED';
            case 'cancelled':
                return 'CANCELLED';
            default:
                return (status as string).toUpperCase();
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return format(date, 'MMM d, yyyy');
        } catch {
            return dateStr;
        }
    };

    const formatTime = (timeStr: string) => {
        try {
            if (!timeStr) return '';

            // If it's an ISO timestamp, extract the time part
            if (timeStr.includes('T')) {
                const timePart = timeStr.split('T')[1].split('+')[0].split('-')[0];
                const [hours, minutes] = timePart.split(':');
                const hour = parseInt(hours);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const displayHour = hour % 12 || 12;
                return `${displayHour}:${minutes} ${ampm}`;
            }

            // Simple HH:MM format
            if (timeStr.includes(':')) {
                const [hours, minutes] = timeStr.split(':');
                const hour = parseInt(hours);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const displayHour = hour % 12 || 12;
                return `${displayHour}:${minutes} ${ampm}`;
            }
            return timeStr;
        } catch {
            return timeStr;
        }
    };

    const upcomingBookings = bookings.filter(b =>
        b.status === 'pending' || b.status === 'confirmed'
    );

    const pastBookings = bookings.filter(b =>
        b.status === 'completed' || b.status === 'cancelled'
    );

    const displayBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Bookings</Text>
                <View style={styles.backButton} />
            </View>

            {/* Tabs */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
                    onPress={() => setActiveTab('upcoming')}
                >
                    <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
                        Confirmed ({upcomingBookings.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'past' && styles.tabActive]}
                    onPress={() => setActiveTab('past')}
                >
                    <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
                        Past ({pastBookings.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Show subtle loading indicator when refetching */}
            {isFetching && !loading && (
                <View style={styles.refetchingBar}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.refetchingText}>Updating...</Text>
                </View>
            )}

            <ScrollView style={styles.content}>
                {loading ? (
                    <View style={styles.emptyState}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.emptyText}>Loading bookings...</Text>
                    </View>
                ) : displayBookings.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📅</Text>
                        <Text style={styles.emptyText}>No {activeTab} bookings</Text>
                        <Text style={styles.emptySubtext}>
                            {activeTab === 'upcoming'
                                ? 'Book a court to get started!'
                                : 'Your completed bookings will appear here'}
                        </Text>
                        {activeTab === 'upcoming' && (
                            <Button
                                title="Browse Courts"
                                onPress={() => router.push('/(tabs)/home')}
                                variant="secondary"
                                style={{ marginTop: 20 }}
                            />
                        )}
                    </View>
                ) : (
                    displayBookings.map((booking) => (
                        <Card key={booking.id} style={styles.bookingCard}>
                            {/* Status Badge */}
                            <View style={styles.bookingHeader}>
                                <Text style={styles.bookingId}>Booking #{booking.id.slice(-8).toUpperCase()}</Text>
                                <View style={[styles.statusBadge, { borderColor: getStatusColor(booking.status) }]}>
                                    <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                                        {getStatusText(booking.status)}
                                    </Text>
                                </View>
                            </View>

                            {/* Countdown Timer for Locked Slots */}
                            {booking.status === 'locked' && countdown[booking.id] !== undefined && (
                                <View style={styles.countdownContainer}>
                                    <View style={styles.countdownTimer}>
                                        <Text style={styles.countdownText}>⏱️ {formatCountdown(countdown[booking.id])}</Text>
                                    </View>
                                    <Text style={styles.countdownLabel}>Time remaining to complete payment</Text>
                                </View>
                            )}

                            {/* Booking Details */}
                            <Text style={styles.vendorName}>{booking.vendor?.business_name || booking.vendor?.name || 'Unknown Vendor'}</Text>
                            <Text style={styles.category}>{booking.vendor?.category || 'Sports Court'}</Text>

                            <View style={styles.detailsRow}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Date</Text>
                                    <Text style={styles.detailValue}>{formatDate(booking.date)}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Time</Text>
                                    <Text style={styles.detailValue}>{formatTime(booking.time || booking.start_time || '')}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Amount</Text>
                                    <Text style={styles.amountValue}>PKR {booking.amount || 0}</Text>
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View style={styles.actions}>
                                {booking.status === 'locked' && (
                                    <Button
                                        title="Complete Payment"
                                        onPress={() => router.push({
                                            pathname: '/vendor/booking',
                                            params: {
                                                slotId: booking.slot_id,
                                                vendorId: booking.vendor_id,
                                                vendorName: booking.vendor?.business_name || 'Vendor',
                                                date: booking.date,
                                                time: booking.time || booking.start_time || '',
                                            },
                                        })}
                                        variant="secondary"
                                    />
                                )}



                                {booking.status === 'confirmed' && (
                                    <TouchableOpacity style={styles.viewDetailsButton}>
                                        <Text style={styles.viewDetailsText}>View Details →</Text>
                                    </TouchableOpacity>
                                )}

                                {(booking.status === 'locked' || booking.status === 'pending') && (
                                    <TouchableOpacity style={styles.cancelButton}>
                                        <Text style={styles.cancelText}>Cancel Booking</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </Card>
                    ))
                )}

                <View style={{ height: 100 }} />
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
    tabBar: {
        flexDirection: 'row',
        backgroundColor: COLORS.backgroundLight,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textMuted,
    },
    tabTextActive: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    bookingCard: {
        marginBottom: 16,
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        flexWrap: 'wrap',
        gap: 8,
    },
    bookingId: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textMuted,
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1.5,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    countdownContainer: {
        marginBottom: 12,
        padding: 12,
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.warning,
    },
    countdownTimer: {
        alignItems: 'center',
        marginBottom: 4,
    },
    countdownText: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.warning,
    },
    countdownLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    vendorName: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    category: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginBottom: 12,
    },
    detailsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    amountValue: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.primary,
    },
    actions: {
        gap: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    pendingInfo: {
        padding: 12,
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    pendingText: {
        fontSize: 13,
        color: COLORS.primary,
        textAlign: 'center',
    },
    viewDetailsButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    viewDetailsText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
    cancelButton: {
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 13,
        color: COLORS.textMuted,
        fontWeight: '500',
    },
    refetchingBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        backgroundColor: COLORS.backgroundLight,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        gap: 8,
    },
    refetchingText: {
        fontSize: 13,
        color: COLORS.textMuted,
        fontWeight: '500',
    },
});
