import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Modal, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { COLORS } from '../../constants/colors';
import { authService } from '../../services/auth';
import { apiClient, API_ENDPOINTS, API_BASE_URL } from '../../config/api';

// Simple in-memory cache for vendor bookings
const bookingsCache: { [vendorId: string]: { bookings: any[]; timestamp: number } } = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Screenshot paths are stored as "/uploads/payments/filename.jpg" in Firestore.
// Prepend the backend base URL to make them loadable in the app.
const resolveScreenshotUrl = (url?: string): string | null => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
};

export default function BookingDetailScreen() {
    const router = useRouter();
    const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

    const [showScreenshot, setShowScreenshot] = useState(false);
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const fetchBookingDetails = async () => {
            try {
                const user = await authService.getCurrentUser();
                if (user && user.vendor_id) {
                    const vendorId = user.vendor_id;
                    let bookings: any[] = [];

                    // Check cache first
                    const cached = bookingsCache[vendorId];
                    const now = Date.now();
                    if (cached && (now - cached.timestamp) < CACHE_TTL) {
                        // Use cached bookings
                        bookings = cached.bookings;
                        // Show cached data immediately
                        const foundBooking = bookings.find((b: any) => b.id === bookingId);
                        if (foundBooking) {
                            setBooking(foundBooking);
                        }
                    }

                    // Always fetch fresh data in background
                    const res = await apiClient.get(API_ENDPOINTS.vendors.bookings(vendorId));
                    if (res.data.success) {
                        bookings = res.data.bookings || [];
                        // Update cache
                        bookingsCache[vendorId] = { bookings, timestamp: Date.now() };
                        // Update UI with fresh data
                        const foundBooking = bookings.find((b: any) => b.id === bookingId);
                        setBooking(foundBooking);
                    }
                }
            } catch (error) {
                console.error('Error fetching booking detail:', error);
            } finally {
                setLoading(false);
            }
        };

        if (bookingId) {
            fetchBookingDetails();
        }
    }, [bookingId]);

    const handleApprove = async () => {
        if (!booking) return;
        setActionLoading(true);
        try {
            const user = await authService.getCurrentUser();
            if (user && user.vendor_id) {
                const res = await apiClient.post(API_ENDPOINTS.vendors.approveSlot(user.vendor_id, booking.id));
                if (res.data.success) {
                    setBooking({ ...booking, status: 'confirmed' });
                }
            }
        } catch (error) {
            console.error('Error approving booking:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!booking) return;
        setActionLoading(true);
        try {
            const user = await authService.getCurrentUser();
            if (user && user.vendor_id) {
                const res = await apiClient.post(API_ENDPOINTS.vendors.rejectSlot(user.vendor_id, booking.id));
                if (res.data.success) {
                    setBooking({ ...booking, status: 'cancelled' });
                }
            }
        } catch (error) {
            console.error('Error rejecting booking:', error);
        } finally {
            setActionLoading(false);
        }
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

    // Simple screenshot URL resolution - only works for app bookings with Firestore payment doc
    const screenshotUrl = booking?.payment?.screenshot_url
        ? resolveScreenshotUrl(booking.payment.screenshot_url)
        : null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Booking Details</Text>
                <View style={styles.headerPlaceholder} />
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : !booking ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: COLORS.text }}>Booking not found</Text>
                </View>
            ) : (
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
                                {(booking.status || '').toUpperCase()}
                            </Text>
                        </View>
                        <Text style={styles.bookingId}>#{booking.id?.slice(-8)}</Text>
                    </View>

                    {/* Customer Information */}
                    <Card>
                        <Text style={styles.cardTitle}>Customer Information</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Name:</Text>
                            <Text style={styles.infoValue}>{booking.customer_name || 'Customer'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Phone:</Text>
                            <Text style={styles.infoValue}>{booking.customer_phone || booking.user_id || 'N/A'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Email:</Text>
                            <Text style={styles.infoValue}>N/A</Text>
                        </View>
                    </Card>

                    {/* Booking Details */}
                    <Card>
                        <Text style={styles.cardTitle}>Booking Details</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Date:</Text>
                            <Text style={styles.infoValue}>{booking.date || 'N/A'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Time:</Text>
                            <Text style={styles.infoValue}>{booking.time || 'N/A'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Court:</Text>
                            <Text style={styles.infoValue}>
                                {booking.resource_id
                                    ? (() => {
                                        const p = booking.resource_id.split('_');
                                        return p.length >= 2
                                            ? `${p[p.length - 2].charAt(0).toUpperCase() + p[p.length - 2].slice(1)} ${p[p.length - 1]}`
                                            : booking.resource_id;
                                    })()
                                    : 'N/A'}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Source:</Text>
                            <Text style={styles.infoValue}>
                                {booking.booking_source === 'whatsapp' || booking.booking_source === 'whatsapp_ai' ? '📱 WhatsApp Agent'
                                    : booking.booking_source === 'walk-in' ? '🚶 Walk-in'
                                        : booking.booking_source === 'app' ? '📲 Mobile App'
                                            : booking.booking_source || 'N/A'}
                            </Text>
                        </View>
                    </Card>

                    {/* Payment Information */}
                    <Card>
                        <Text style={styles.cardTitle}>Payment Information</Text>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Method:</Text>
                            <Text style={styles.infoValue}>{getPaymentMethodText(booking.payment?.method || 'wallet')}</Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.paymentBreakdown}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Total Amount:</Text>
                                <Text style={styles.amountValue}>PKR {booking.payment?.amount_claimed || booking.amount || booking.price || 0}</Text>
                            </View>
                        </View>

                        {/* Payment Screenshot - only for app bookings with Firestore payment doc */}
                        {screenshotUrl ? (
                            <>
                                <View style={styles.divider} />
                                <View style={styles.screenshotSection}>
                                    <View style={styles.screenshotHeader}>
                                        <Text style={styles.screenshotTitle}>Payment Screenshot</Text>
                                        <View style={styles.verifiedBadge}>
                                            <Text style={styles.verifiedText}>✓ Uploaded</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.screenshotPreview}
                                        onPress={() => setShowScreenshot(true)}
                                    >
                                        <Image
                                            source={{ uri: screenshotUrl }}
                                            style={styles.screenshotImage}
                                            resizeMode="cover"
                                        />
                                        <View style={styles.screenshotOverlay}>
                                            <Text style={styles.screenshotOverlayText}>Tap to view full size</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : booking.booking_source === 'whatsapp' || booking.booking_source === 'whatsapp_ai' ? (
                            <>
                                <View style={styles.divider} />
                                <View style={[styles.verifiedBadge, { padding: 12, borderRadius: 10 }]}>
                                    <Text style={[styles.verifiedText, { fontSize: 13 }]}>
                                        ✅ Payment verified by AI Agent via OCR
                                    </Text>
                                </View>
                            </>
                        ) : null}
                    </Card>

                    {/* Action Buttons */}
                    {booking.status === 'pending' && (
                        <View style={styles.actionButtons}>
                            <Button
                                title="Approve Booking"
                                onPress={handleApprove}
                                loading={actionLoading}
                            />
                            <Button
                                title="Reject"
                                variant="outline"
                                onPress={handleReject}
                                style={styles.rejectButton}
                                textStyle={styles.rejectButtonText}
                                loading={actionLoading}
                            />
                        </View>
                    )}

                    {(booking.status === 'confirmed' || booking.status === 'completed') && (
                        <View style={[styles.actionButtons, { marginTop: 20 }]}>
                            <Button
                                title="Force Cancel Booking"
                                onPress={handleReject}
                                style={{ backgroundColor: COLORS.error, borderColor: COLORS.error }}
                                textStyle={{ color: COLORS.surface }}
                                loading={actionLoading}
                            />
                        </View>
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}

            {/* Screenshot Full Screen Modal */}
            {screenshotUrl && (
                <Modal
                    visible={showScreenshot}
                    transparent={true}
                    animationType="fade"
                >
                    <View style={styles.modalContainer}>
                        <TouchableOpacity
                            style={styles.modalClose}
                            onPress={() => setShowScreenshot(false)}
                        >
                            <Text style={styles.modalCloseText}>Close ✕</Text>
                        </TouchableOpacity>
                        <Image
                            source={{ uri: screenshotUrl }}
                            style={styles.fullScreenImage}
                            resizeMode="contain"
                        />
                    </View>
                </Modal>
            )}
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
    headerPlaceholder: {
        width: 40,
        height: 40,
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
        backgroundColor: 'rgba(74, 222,  128, 0.2)',
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
