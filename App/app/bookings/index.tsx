import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { COLORS } from '../../constants/colors';

type BookingStatus = 'locked' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface Booking {
    id: string;
    vendorName: string;
    category: string;
    date: string;
    time: string;
    amount: number;
    status: BookingStatus;
    lockExpiresAt?: Date;
    paymentUploaded?: boolean;
}

export default function MyBookingsScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [countdown, setCountdown] = useState<{ [key: string]: number }>({});

    // Mock bookings data
    const [bookings] = useState<Booking[]>([
        {
            id: 'BK001',
            vendorName: 'Elite Padel Club',
            category: 'Padel Court',
            date: 'Dec 1, 2024',
            time: '6:00 PM',
            amount: 1500,
            status: 'locked',
            lockExpiresAt: new Date(Date.now() + 8 * 60 * 1000), // 8 minutes from now
            paymentUploaded: false,
        },
        {
            id: 'BK002',
            vendorName: 'City Sports Complex',
            category: 'Futsal Court',
            date: 'Dec 2, 2024',
            time: '8:00 PM',
            amount: 2000,
            status: 'pending',
            paymentUploaded: true,
        },
        {
            id: 'BK003',
            vendorName: 'Golden Court',
            category: 'Padel Court',
            date: 'Dec 3, 2024',
            time: '7:00 PM',
            amount: 1800,
            status: 'confirmed',
        },
        {
            id: 'BK004',
            vendorName: 'DHA Sports Arena',
            category: 'Cricket Pitch',
            date: 'Nov 25, 2024',
            time: '5:00 PM',
            amount: 3000,
            status: 'completed',
        },
    ]);

    // Countdown timer for locked slots
    useEffect(() => {
        const interval = setInterval(() => {
            const newCountdown: { [key: string]: number } = {};

            bookings.forEach((booking) => {
                if (booking.status === 'locked' && booking.lockExpiresAt) {
                    const remaining = Math.max(0, Math.floor((booking.lockExpiresAt.getTime() - Date.now()) / 1000));
                    newCountdown[booking.id] = remaining;
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

    const getStatusColor = (status: BookingStatus) => {
        switch (status) {
            case 'locked':
                return COLORS.warning;
            case 'pending':
                return COLORS.primary;
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

    const getStatusText = (status: BookingStatus) => {
        switch (status) {
            case 'locked':
                return 'SLOT LOCKED';
            case 'pending':
                return 'PENDING APPROVAL';
            case 'confirmed':
                return 'CONFIRMED';
            case 'completed':
                return 'COMPLETED';
            case 'cancelled':
                return 'CANCELLED';
            default:
                return (status as string).toUpperCase();
        }
    };

    const upcomingBookings = bookings.filter(b =>
        b.status === 'locked' || b.status === 'pending' || b.status === 'confirmed'
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
                        Upcoming ({upcomingBookings.length})
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

            <ScrollView style={styles.content}>
                {displayBookings.length === 0 ? (
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
                                <Text style={styles.bookingId}>#{booking.id}</Text>
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
                            <Text style={styles.vendorName}>{booking.vendorName}</Text>
                            <Text style={styles.category}>{booking.category}</Text>

                            <View style={styles.detailsRow}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Date</Text>
                                    <Text style={styles.detailValue}>{booking.date}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Time</Text>
                                    <Text style={styles.detailValue}>{booking.time}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Amount</Text>
                                    <Text style={styles.amountValue}>PKR {booking.amount}</Text>
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View style={styles.actions}>
                                {booking.status === 'locked' && !booking.paymentUploaded && (
                                    <Button
                                        title="Upload Payment"
                                        onPress={() => router.push({
                                            pathname: '/payment/upload',
                                            params: {
                                                bookingId: booking.id,
                                                vendorName: booking.vendorName,
                                                amount: booking.amount.toString(),
                                                date: booking.date,
                                                time: booking.time,
                                            },
                                        })}
                                        variant="secondary"
                                    />
                                )}

                                {booking.status === 'pending' && (
                                    <View style={styles.pendingInfo}>
                                        <Text style={styles.pendingText}>
                                            ✓ Payment uploaded. Waiting for vendor confirmation...
                                        </Text>
                                    </View>
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
    },
    bookingId: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
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
});
