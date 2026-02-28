import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Modal, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { authService } from '../../services/auth';
import { apiClient, API_ENDPOINTS, API_BASE_URL } from '../../config/api';

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
                if (user && user.vendor_id && bookingId) {
                    const vendorId = user.vendor_id;
                    
                    // OPTIMIZED: Fetch single booking directly instead of all bookings
                    const res = await apiClient.get(API_ENDPOINTS.vendors.booking(vendorId, bookingId));
                    if (res.data.success && res.data.booking) {
                        setBooking(res.data.booking);
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
                    <Ionicons name="chevron-back" size={24} color="#FFF" />
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
                    <View style={styles.premiumCard}>
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
                    </View>

                    {/* Booking Details */}
                    <View style={styles.premiumCard}>
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
                    </View>

                    {/* Payment Information */}
                    <View style={styles.premiumCard}>
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
                                            <Ionicons name="checkmark-circle" size={12} color="#00EA77" style={{ marginRight: 2 }} />
                                            <Text style={styles.verifiedText}>Uploaded</Text>
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
                    </View>

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
                                style={styles.rejectButton}
                                textStyle={styles.rejectButtonText}
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
                            <Ionicons name="close" size={24} color="#FFF" />
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
        backgroundColor: '#0F172A', // Extremely dark blue/gray
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        backgroundColor: '#0F172A',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerPlaceholder: {
        width: 44,
        height: 44,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: -0.5,
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
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
        borderRadius: 20,
        borderWidth: 1,
    },
    statusBadgePending: {
        borderColor: 'rgba(245, 158, 11, 0.4)',
        backgroundColor: 'rgba(245, 158, 11, 0.05)',
    },
    statusBadgeConfirmed: {
        borderColor: 'rgba(0, 234, 119, 0.4)',
        backgroundColor: 'rgba(0, 234, 119, 0.05)',
    },
    statusBadgeCancelled: {
        borderColor: 'rgba(239, 68, 68, 0.4)',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
    },
    statusTextPending: {
        color: '#F59E0B',
    },
    statusTextConfirmed: {
        color: '#00EA77',
    },
    statusTextCancelled: {
        color: '#EF4444',
    },
    bookingId: {
        fontSize: 14,
        fontWeight: '700',
        color: '#9CA3AF', // slate gray
        letterSpacing: 1,
    },
    premiumCard: {
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.03)',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 16,
        letterSpacing: -0.2,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoLabel: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
        textAlign: 'right',
        flex: 1,
        marginLeft: 16,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginVertical: 16,
    },
    paymentBreakdown: {
        gap: 8,
    },
    amountValue: {
        fontSize: 16,
        fontWeight: '900',
        color: '#00EA77',
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
        marginBottom: 12,
    },
    screenshotTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: 'rgba(0, 234, 119, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0, 234, 119, 0.3)',
    },
    verifiedText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#00EA77',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    uploadedTime: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 12,
    },
    screenshotPreview: {
        height: 240,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
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
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        paddingVertical: 16,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    screenshotOverlayText: {
        fontSize: 13,
        color: '#FFF',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    actionButtons: {
        gap: 12,
        marginTop: 8,
    },
    rejectButton: {
        paddingVertical: 16,
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        borderRadius: 16,
        alignItems: 'center',
    },
    rejectButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#EF4444',
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
        backgroundColor: 'rgba(15, 23, 42, 0.98)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalClose: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 44,
        height: 44,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
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
