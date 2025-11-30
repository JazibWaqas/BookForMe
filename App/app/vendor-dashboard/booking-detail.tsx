import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { COLORS } from '../../constants/colors';

interface BookingDetail {
    id: string;
    customer: {
        name: string;
        phone: string;
        email: string;
    };
    date: string;
    time: string;
    court: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    payment: {
        method: 'wallet' | 'card' | 'venue';
        total: number;
        upfront: number;
        remaining: number;
        screenshot?: string;
        verified: boolean;
        uploadedAt?: string;
    };
    bookedAt: string;
}

export default function BookingDetailScreen() {
    const router = useRouter();
    const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

    const [showScreenshot, setShowScreenshot] = useState(false);

    // Mock booking data - in real app, fetch from API
    const booking: BookingDetail = {
        id: bookingId || 'BK003',
        customer: {
            name: 'Bilal Shah',
            phone: '+92 300 1234567',
            email: 'bilal.shah@email.com',
        },
        date: 'Nov 24, 2024',
        time: '2:00 PM - 3:00 PM',
        court: 'Court 1 - Padel',
        status: 'pending',
        payment: {
            method: 'wallet',
            total: 1425,
            upfront: 1425,
            remaining: 0,
            screenshot: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400', // Mock screenshot
            verified: true,
            uploadedAt: '10 minutes ago',
        },
        bookedAt: '2 hours ago',
    };

    const handleApprove = () => {
        // In real app: API call to approve booking
        router.back();
    };

    const handleReject = () => {
        // In real app: API call to reject booking
        router.back();
    };

    const getPaymentMethodText = (method: string) => {
        switch (method) {
            case 'wallet':
                return 'Digital Wallet (JazzCash/EasyPaisa)';
            case 'card':
                return 'Bank Transfer';
            case 'venue':
                return 'Pay at Venue';
            default:
                return method;
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Booking Details</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView style={styles.content}>
                {/* Status Badge */}
                <View style={styles.statusContainer}>
                    <View style={[
                        styles.statusBadge,
                        booking.status === 'pending' && styles.statusBadgePending,
                        booking.status === 'confirmed' && styles.statusBadgeConfirmed,
                        booking.status === 'cancelled' && styles.statusBadgeCancelled,
                    ]}>
                        <Text style={[
                            styles.statusText,
                            booking.status === 'pending' && styles.statusTextPending,
                            booking.status === 'confirmed' && styles.statusTextConfirmed,
                            booking.status === 'cancelled' && styles.statusTextCancelled,
                        ]}>
                            {booking.status.toUpperCase()}
                        </Text>
                    </View>
                    <Text style={styles.bookingId}>#{booking.id}</Text>
                </View>

                {/* Customer Information */}
                <Card>
                    <Text style={styles.cardTitle}>Customer Information</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Name:</Text>
                        <Text style={styles.infoValue}>{booking.customer.name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Phone:</Text>
                        <Text style={styles.infoValue}>{booking.customer.phone}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Email:</Text>
                        <Text style={styles.infoValue}>{booking.customer.email}</Text>
                    </View>
                </Card>

                {/* Booking Details */}
                <Card>
                    <Text style={styles.cardTitle}>Booking Details</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Date:</Text>
                        <Text style={styles.infoValue}>{booking.date}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Time:</Text>
                        <Text style={styles.infoValue}>{booking.time}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Court:</Text>
                        <Text style={styles.infoValue}>{booking.court}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Booked:</Text>
                        <Text style={styles.infoValue}>{booking.bookedAt}</Text>
                    </View>
                </Card>

                {/* Payment Information */}
                <Card>
                    <Text style={styles.cardTitle}>Payment Information</Text>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Method:</Text>
                        <Text style={styles.infoValue}>{getPaymentMethodText(booking.payment.method)}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.paymentBreakdown}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Total Amount:</Text>
                            <Text style={styles.amountValue}>PKR {booking.payment.total}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Upfront Payment:</Text>
                            <Text style={styles.amountPaid}>PKR {booking.payment.upfront}</Text>
                        </View>
                        {booking.payment.remaining > 0 && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Remaining:</Text>
                                <Text style={styles.amountRemaining}>PKR {booking.payment.remaining}</Text>
                            </View>
                        )}
                    </View>

                    {/* Payment Screenshot */}
                    {booking.payment.screenshot && (
                        <>
                            <View style={styles.divider} />

                            <View style={styles.screenshotSection}>
                                <View style={styles.screenshotHeader}>
                                    <Text style={styles.screenshotTitle}>Payment Screenshot</Text>
                                    {booking.payment.verified && (
                                        <View style={styles.verifiedBadge}>
                                            <Text style={styles.verifiedText}>✓ AI Verified</Text>
                                        </View>
                                    )}
                                </View>

                                <Text style={styles.uploadedTime}>Uploaded {booking.payment.uploadedAt}</Text>

                                <TouchableOpacity
                                    style={styles.screenshotPreview}
                                    onPress={() => setShowScreenshot(true)}
                                >
                                    <Image
                                        source={{ uri: booking.payment.screenshot }}
                                        style={styles.screenshotImage}
                                        resizeMode="cover"
                                    />
                                    <View style={styles.screenshotOverlay}>
                                        <Text style={styles.screenshotOverlayText}>Tap to view full size</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </Card>

                {/* Action Buttons */}
                {booking.status === 'pending' && (
                    <View style={styles.actionButtons}>
                        <Button
                            title="Approve Booking"
                            onPress={handleApprove}
                            variant="secondary"
                        />
                        <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
                            <Text style={styles.rejectButtonText}>Reject Booking</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {booking.status === 'confirmed' && (
                    <View style={styles.confirmedInfo}>
                        <Text style={styles.confirmedText}>
                            ✓ This booking has been confirmed
                        </Text>
                    </View>
                )}

                <View style={{ height: 32 }} />
            </ScrollView>

            {/* Full Screen Screenshot Modal */}
            <Modal
                visible={showScreenshot}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowScreenshot(false)}
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.modalClose}
                        onPress={() => setShowScreenshot(false)}
                    >
                        <Text style={styles.modalCloseText}>✕ Close</Text>
                    </TouchableOpacity>
                    <Image
                        source={{ uri: booking.payment.screenshot }}
                        style={styles.fullScreenImage}
                        resizeMode="contain"
                    />
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
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    statusContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    statusBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 2,
    },
    statusBadgePending: {
        borderColor: COLORS.warning,
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
    },
    statusBadgeConfirmed: {
        borderColor: COLORS.success,
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
    },
    statusBadgeCancelled: {
        borderColor: COLORS.error,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    statusTextPending: {
        color: COLORS.warning,
    },
    statusTextConfirmed: {
        color: COLORS.success,
    },
    statusTextCancelled: {
        color: COLORS.error,
    },
    bookingId: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    infoLabel: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'right',
        flex: 1,
        marginLeft: 16,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 16,
    },
    paymentBreakdown: {
        gap: 8,
    },
    amountValue: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
    },
    amountPaid: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.success,
    },
    amountRemaining: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.warning,
    },
    screenshotSection: {
        marginTop: 8,
    },
    screenshotHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    screenshotTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    verifiedBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: 'rgba(74, 222, 128, 0.2)',
        borderRadius: 6,
    },
    verifiedText: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.success,
    },
    uploadedTime: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 12,
    },
    screenshotPreview: {
        height: 300,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    screenshotImage: {
        width: '100%',
        height: '100%',
    },
    screenshotOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingVertical: 12,
        alignItems: 'center',
    },
    screenshotOverlayText: {
        fontSize: 12,
        color: COLORS.text,
        fontWeight: '600',
    },
    actionButtons: {
        gap: 12,
        marginTop: 8,
    },
    rejectButton: {
        paddingVertical: 14,
        borderWidth: 2,
        borderColor: COLORS.error,
        borderRadius: 12,
        alignItems: 'center',
    },
    rejectButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.error,
    },
    confirmedInfo: {
        marginTop: 8,
        padding: 16,
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.success,
    },
    confirmedText: {
        fontSize: 14,
        color: COLORS.success,
        textAlign: 'center',
        fontWeight: '600',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalClose: {
        position: 'absolute',
        top: 50,
        right: 20,
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        zIndex: 10,
    },
    modalCloseText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    fullScreenImage: {
        width: '100%',
        height: '80%',
    },
});
