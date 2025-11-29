import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { COLORS } from '../../constants/colors';

type VerificationStatus = 'idle' | 'uploading' | 'analyzing' | 'verified' | 'rejected';

export default function PaymentUploadScreen() {
    const router = useRouter();
    const { bookingId, vendorName, amount, date, time } = useLocalSearchParams<{
        bookingId: string;
        vendorName: string;
        amount: string;
        date: string;
        time: string;
    }>();

    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [status, setStatus] = useState<VerificationStatus>('idle');

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please allow access to your photos to upload payment proof.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
        });

        if (!result.canceled) {
            setScreenshot(result.assets[0].uri);
            setStatus('idle');
        }
    };

    const handleUpload = async () => {
        if (!screenshot) {
            Alert.alert('No Image', 'Please select a payment screenshot first.');
            return;
        }

        // Simulate upload and AI verification
        setStatus('uploading');

        setTimeout(() => {
            setStatus('analyzing');

            setTimeout(() => {
                // Simulate AI verification result (80% success rate for demo)
                const isVerified = Math.random() > 0.2;
                setStatus(isVerified ? 'verified' : 'rejected');

                if (isVerified) {
                    setTimeout(() => {
                        Alert.alert(
                            'Payment Verified! ✓',
                            'Your payment has been verified. Waiting for vendor confirmation.',
                            [
                                {
                                    text: 'View Booking',
                                    onPress: () => router.push('/(tabs)/profile'), // Will redirect to My Bookings
                                },
                            ]
                        );
                    }, 1500);
                }
            }, 2000);
        }, 1000);
    };

    const getStatusMessage = () => {
        switch (status) {
            case 'uploading':
                return { text: 'Uploading screenshot...', color: COLORS.textMuted };
            case 'analyzing':
                return { text: 'AI analyzing payment...', color: COLORS.primary };
            case 'verified':
                return { text: 'Payment verified! ✓', color: COLORS.success };
            case 'rejected':
                return { text: 'Verification failed. Please upload a clearer screenshot.', color: COLORS.error };
            default:
                return { text: 'Upload your payment screenshot', color: COLORS.textMuted };
        }
    };

    const statusMsg = getStatusMessage();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Upload Payment</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView style={styles.content}>
                <Card>
                    <Text style={styles.cardTitle}>Booking Summary</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Venue:</Text>
                        <Text style={styles.summaryValue}>{vendorName}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Date & Time:</Text>
                        <Text style={styles.summaryValue}>{date} at {time}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.totalLabel}>Amount to Pay:</Text>
                        <Text style={styles.totalValue}>PKR {amount}</Text>
                    </View>
                </Card>

                <Card>
                    <Text style={styles.cardTitle}>Payment Instructions</Text>
                    <Text style={styles.instructionText}>
                        1. Transfer PKR {amount} to the vendor's account
                    </Text>
                    <Text style={styles.instructionText}>
                        2. Take a screenshot of the transaction
                    </Text>
                    <Text style={styles.instructionText}>
                        3. Upload the screenshot below
                    </Text>
                    <Text style={styles.instructionText}>
                        4. Our AI will verify the payment amount
                    </Text>
                </Card>

                <Card>
                    <Text style={styles.cardTitle}>Upload Screenshot</Text>

                    {screenshot ? (
                        <View style={styles.imagePreview}>
                            <Image source={{ uri: screenshot }} style={styles.previewImage} />
                            <TouchableOpacity onPress={pickImage} style={styles.changeButton}>
                                <Text style={styles.changeButtonText}>Change Screenshot</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity onPress={pickImage} style={styles.uploadBox}>
                            <Text style={styles.uploadIcon}>📷</Text>
                            <Text style={styles.uploadText}>Tap to select screenshot</Text>
                            <Text style={styles.uploadSubtext}>JPG, PNG supported</Text>
                        </TouchableOpacity>
                    )}

                    {/* Status Indicator */}
                    {status !== 'idle' && (
                        <View style={styles.statusContainer}>
                            <View style={[
                                styles.statusIndicator,
                                status === 'uploading' && styles.statusUploading,
                                status === 'analyzing' && styles.statusAnalyzing,
                                status === 'verified' && styles.statusVerified,
                                status === 'rejected' && styles.statusRejected,
                            ]}>
                                {status === 'uploading' && <Text style={styles.statusIcon}>⬆️</Text>}
                                {status === 'analyzing' && <Text style={styles.statusIcon}>🔍</Text>}
                                {status === 'verified' && <Text style={styles.statusIcon}>✓</Text>}
                                {status === 'rejected' && <Text style={styles.statusIcon}>✗</Text>}
                            </View>
                            <Text style={[styles.statusText, { color: statusMsg.color }]}>
                                {statusMsg.text}
                            </Text>
                        </View>
                    )}
                </Card>

                <Button
                    title={status === 'verified' ? 'Payment Verified ✓' : 'Verify Payment'}
                    onPress={handleUpload}
                    disabled={!screenshot || status === 'uploading' || status === 'analyzing' || status === 'verified'}
                    loading={status === 'uploading' || status === 'analyzing'}
                    variant="secondary"
                />

                {status === 'rejected' && (
                    <TouchableOpacity onPress={pickImage} style={styles.retryButton}>
                        <Text style={styles.retryText}>Upload Different Screenshot</Text>
                    </TouchableOpacity>
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
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    summaryValue: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 12,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    totalValue: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
    },
    instructionText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 8,
        lineHeight: 20,
    },
    uploadBox: {
        height: 200,
        borderWidth: 2,
        borderColor: COLORS.border,
        borderRadius: 12,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
    },
    uploadIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    uploadText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    uploadSubtext: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    imagePreview: {
        alignItems: 'center',
    },
    previewImage: {
        width: '100%',
        height: 300,
        borderRadius: 12,
        marginBottom: 12,
    },
    changeButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderWidth: 2,
        borderColor: COLORS.border,
        borderRadius: 8,
    },
    changeButtonText: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '600',
    },
    statusContainer: {
        marginTop: 16,
        alignItems: 'center',
        gap: 8,
    },
    statusIndicator: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
    },
    statusUploading: {
        borderColor: COLORS.textMuted,
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
    },
    statusAnalyzing: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
    },
    statusVerified: {
        borderColor: COLORS.success,
        backgroundColor: 'rgba(74, 222, 128, 0.2)',
    },
    statusRejected: {
        borderColor: COLORS.error,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    statusIcon: {
        fontSize: 28,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 12,
        paddingVertical: 12,
        borderWidth: 2,
        borderColor: COLORS.error,
        borderRadius: 12,
        alignItems: 'center',
    },
    retryText: {
        fontSize: 14,
        color: COLORS.error,
        fontWeight: '600',
    },
});
