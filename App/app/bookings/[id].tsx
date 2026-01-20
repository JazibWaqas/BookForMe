import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { format } from 'date-fns';
import QRCode from 'react-native-qrcode-svg';

export default function BookingDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Parse params or use defaults
    const booking = {
        id: params.id as string || 'UNKNOWN',
        vendorName: params.vendorName as string || 'Unknown Venue',
        category: params.category as string || 'Sports Court',
        date: params.date as string || new Date().toISOString(),
        time: params.time as string || '',
        price: params.price as string || '0',
        status: params.status as string || 'confirmed',
        location: params.location as string || 'Karachi, Pakistan',
        courtNumber: params.courtNumber as string || 'Court 1'
    };

    const formatDate = (dateStr: string) => {
        try {
            return format(new Date(dateStr), 'EEEE, MMMM d, yyyy');
        } catch {
            return dateStr;
        }
    };

    const formatTime = (timeStr: string) => {
        try {
            if (!timeStr) return '';
            if (timeStr.includes('T')) {
                const timePart = timeStr.split('T')[1].split('+')[0];
                const [hours, minutes] = timePart.split(':');
                const hour = parseInt(hours);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const displayHour = hour % 12 || 12;
                return `${displayHour}:${minutes} ${ampm}`;
            }
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return COLORS.success;
            case 'completed': return COLORS.textMuted;
            case 'cancelled': return COLORS.error;
            case 'pending': return COLORS.primary;
            default: return COLORS.textMuted;
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ticket Details</Text>
                <TouchableOpacity style={styles.shareButton} onPress={() => Alert.alert('Share', 'Sharing ticket...')}>
                    <Ionicons name="share-outline" size={24} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.ticketContainer}>
                    {/* Upper Section (Main Info) */}
                    <View style={styles.ticketUpper}>
                        <View style={styles.vendorHeader}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="tennisball" size={24} color="#FFFFFF" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.vendorName}>{booking.vendorName}</Text>
                                <Text style={styles.category}>{booking.category}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
                                <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                                    {booking.status.toUpperCase()}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.detailsGrid}>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>DATE</Text>
                                <Text style={styles.detailValue}>{formatDate(booking.date)}</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>TIME</Text>
                                <Text style={styles.detailValue}>{formatTime(booking.time)}</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>COURT</Text>
                                <Text style={styles.detailValue}>{booking.courtNumber}</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>PRICE</Text>
                                <Text style={[styles.detailValue, { color: COLORS.primary }]}>PKR {booking.price}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Middle Section (Cutout Effect) */}
                    <View style={styles.ticketMiddle}>
                        <View style={styles.circleLeft} />
                        <View style={styles.dashedLine} />
                        <View style={styles.circleRight} />
                    </View>

                    {/* Lower Section (QR Code) */}
                    <View style={styles.ticketLower}>
                        <View style={styles.qrContainer}>
                            <QRCode
                                value={`BOOKING:${booking.id}`}
                                size={120}
                            />
                        </View>
                        <Text style={styles.qrLabel}>Scan this at the venue</Text>
                        <Text style={styles.bookingId}>ID: #{booking.id.slice(-8).toUpperCase()}</Text>

                        <View style={styles.locationContainer}>
                            <Ionicons name="location-outline" size={16} color={COLORS.textMuted} />
                            <Text style={styles.locationText}>{booking.location}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.actionsContainer}>
                    <Button
                        title="Get Directions"
                        variant="secondary"
                        onPress={() => Alert.alert('Maps', 'Opening maps...')}
                        icon={<Ionicons name="map-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />}
                    />
                    {booking.status === 'confirmed' && (
                        <Button
                            title="Cancel Booking"
                            variant="outline"
                            onPress={() => Alert.alert('Cancel', 'Cancellation policy applies. Contact support.')}
                            style={{ marginTop: 12, borderColor: COLORS.error }}
                            textStyle={{ color: COLORS.error }}
                        />
                    )}
                </View>

                <View style={{ height: 40 }} />
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
        paddingBottom: 16,
    },
    backButton: {
        padding: 8,
    },
    shareButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    ticketContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        overflow: 'hidden',
        marginTop: 20,
        marginBottom: 24,
        // Shadow
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    ticketUpper: {
        padding: 24,
    },
    vendorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    vendorName: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    category: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginBottom: 20,
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
    },
    detailItem: {
        width: '45%',
    },
    detailLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginBottom: 4,
        fontWeight: '600',
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    ticketMiddle: {
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        position: 'relative',
        zIndex: 10,
    },
    dashedLine: {
        height: 1,
        flex: 1,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        marginHorizontal: 30, // Space for circles
    },
    circleLeft: {
        position: 'absolute',
        left: -15,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: COLORS.background,
    },
    circleRight: {
        position: 'absolute',
        right: -15,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: COLORS.background,
    },
    ticketLower: {
        padding: 24,
        alignItems: 'center',
        backgroundColor: COLORS.surface,
    },
    qrContainer: {
        padding: 16,
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 16,
    },
    qrLabel: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginBottom: 4,
    },
    bookingId: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 16,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: 8,
        backgroundColor: COLORS.backgroundLight,
        borderRadius: 100,
        paddingHorizontal: 16,
    },
    locationText: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    actionsContainer: {
        marginBottom: 20,
    }
});
