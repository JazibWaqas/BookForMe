import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase';
import { apiClient } from '../../config/api';
import { authService } from '../../services/auth';
import { formatSlotTime, formatPrice, formatCountdown } from '../../services/bookings';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { queryClient } from '../../providers/QueryProvider';
import { COLORS } from '../../constants/colors';

type VerificationStatus = 'idle' | 'uploading' | 'verified' | 'rejected';

export default function BookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    slotId,
    vendorId,
    vendorName,
    courtName,
    date,
    startTime,
    endTime,
    price,
    holdExpiresAt
  } = useLocalSearchParams<{
    slotId: string;
    vendorId: string;
    vendorName: string;
    courtName: string;
    date: string;
    startTime: string;
    endTime: string;
    price: string;
    holdExpiresAt: string;
  }>();

  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [countdown, setCountdown] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const priceVal = Array.isArray(price) ? price[0] : price;
  const priceNum = parseFloat(priceVal || '0');
  const total = priceNum;

  // Initialize countdown from holdExpiresAt
  useEffect(() => {
    if (holdExpiresAt && !bookingConfirmed) {
      const updateCountdown = () => {
        const expiry = new Date(holdExpiresAt);
        const now = new Date();
        const diff = expiry.getTime() - now.getTime();
        const seconds = Math.max(0, Math.floor(diff / 1000));
        setCountdown(seconds);

        if (seconds === 0) {
          handleExpiry();
        }
      };

      updateCountdown();
      const timer = setInterval(updateCountdown, 1000);

      return () => clearInterval(timer);
    }
  }, [holdExpiresAt, bookingConfirmed]);

  const handleExpiry = () => {
    Alert.alert(
      'Reservation Expired',
      'Your slot reservation has expired. Please select a slot again.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

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
      setVerificationStatus('idle');
    }
  };

  const handleUploadPayment = async () => {
    if (!screenshot) {
      Alert.alert('No Image', 'Please select a payment screenshot first.');
      return;
    }

    if (!slotId) {
      Alert.alert('Error', 'Slot ID is missing');
      return;
    }

    setVerificationStatus('uploading');
    setLoading(true);

    try {
      const user = await authService.getCurrentUser();
      if (!user || !user.id) {
        Alert.alert('Error', 'Please login to continue');
        router.replace('/(auth)/login');
        return;
      }

      // Create FormData for multipart upload
      // Create FormData for multipart upload
      const formData = new FormData();

      // Add the image file
      const uriParts = screenshot.split('.');
      const fileType = uriParts[uriParts.length - 1];
      const fileName = `payment_${slotId}_${Date.now()}.${fileType}`;

      if (Platform.OS === 'web') {
        // On web, we need to convert the URI to a Blob
        const response = await fetch(screenshot);
        const blob = await response.blob();
        formData.append('file', blob, fileName);
      } else {
        // On mobile, we append the file object directly
        formData.append('file', {
          uri: screenshot,
          name: fileName,
          type: `image/${fileType}`,
        } as any);
      }

      formData.append('slot_id', slotId);
      formData.append('amount_claimed', total.toString());

      // Upload to backend
      const paymentResponse = await apiClient.post('/api/payments/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (paymentResponse.data.success) {
        setVerificationStatus('verified');
        setBookingConfirmed(true);
        
        // Force immediate refetch of slots and bookings to show updated data
        await queryClient.refetchQueries({ queryKey: ['slots'] });
        await queryClient.refetchQueries({ queryKey: ['bookings'] });
      } else {
        setVerificationStatus('rejected');
        Alert.alert('Error', paymentResponse.data.error || 'Failed to submit payment. Please try again.');
      }
    } catch (error: any) {
      console.error('Error uploading payment:', error);
      setVerificationStatus('rejected');
      Alert.alert(
        'Error',
        error.response?.data?.detail || error.message || 'Failed to upload payment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusMessage = () => {
    switch (verificationStatus) {
      case 'uploading':
        return { text: 'Uploading screenshot...', color: COLORS.textMuted };
      case 'verified':
        return { text: 'Payment uploaded! Booking confirmed.', color: COLORS.success };
      case 'rejected':
        return { text: 'Upload failed. Please try again.', color: COLORS.error };
      default:
        return { text: 'Upload your payment screenshot', color: COLORS.textMuted };
    }
  };

  const statusMsg = getStatusMessage();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {bookingConfirmed ? 'Booking Confirmed' : 'Upload Payment'}
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Booking Summary */}
        <Card>
          <Text style={styles.cardTitle}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Venue:</Text>
            <Text style={styles.summaryValue}>{vendorName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Court:</Text>
            <Text style={styles.summaryValue}>{courtName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date:</Text>
            <Text style={styles.summaryValue}>{date}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Time:</Text>
            <Text style={styles.summaryValue}>{formatSlotTime(startTime, endTime)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </Card>

        {/* Countdown Timer */}
        {!bookingConfirmed && (
          <Card style={styles.countdownCard}>
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownLabel}>Slot Reserved For:</Text>
              <Text style={styles.countdownText}>{formatCountdown(countdown)}</Text>
              <Text style={styles.countdownSubtext}>Complete payment before time expires</Text>
            </View>
          </Card>
        )}

        {/* Payment Upload */}
        {!bookingConfirmed && (
          <>
            <Card>
              <Text style={styles.cardTitle}>Payment Instructions</Text>
              <Text style={styles.instructionText}>
                1. Transfer <Text style={{ fontWeight: '700', color: COLORS.primary }}>{formatPrice(total)}</Text> to the vendor's account:
              </Text>
              <View style={{ backgroundColor: COLORS.backgroundLight, padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border }}>
                <Text style={{ fontFamily: 'monospace', fontSize: 13, color: COLORS.text, marginBottom: 4 }}>Bank: Meezan Bank</Text>
                <Text style={{ fontFamily: 'monospace', fontSize: 13, color: COLORS.text, marginBottom: 4 }}>Title: {vendorName}</Text>
                <Text style={{ fontFamily: 'monospace', fontSize: 13, color: COLORS.text }}>Account: 0101-0101234567</Text>
              </View>
              <Text style={styles.instructionText}>
                2. Take a screenshot of the transaction receipt.
              </Text>
              <Text style={styles.instructionText}>
                3. Upload the payment proof below to confirm your booking.
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
                  <Text style={styles.uploadText}>Tap to select screenshot</Text>
                  <Text style={styles.uploadSubtext}>JPG, PNG supported</Text>
                </TouchableOpacity>
              )}

              {/* Status Indicator */}
              {verificationStatus !== 'idle' && (
                <View style={styles.statusContainer}>
                  <View style={[
                    styles.statusIndicator,
                    verificationStatus === 'uploading' && styles.statusUploading,
                    verificationStatus === 'verified' && styles.statusVerified,
                    verificationStatus === 'rejected' && styles.statusRejected,
                  ]}>
                    {verificationStatus === 'uploading' && <Text style={styles.statusIcon}>⬆</Text>}
                    {verificationStatus === 'verified' && <Text style={styles.statusIcon}>✓</Text>}
                    {verificationStatus === 'rejected' && <Text style={styles.statusIcon}>✗</Text>}
                  </View>
                  <Text style={[styles.statusText, { color: statusMsg.color }]}>
                    {statusMsg.text}
                  </Text>
                </View>
              )}
            </Card>

            <Button
              title={verificationStatus === 'verified' ? 'Payment Verified ✓' : 'Verify Payment'}
              onPress={handleUploadPayment}
              disabled={!screenshot || verificationStatus === 'uploading' || verificationStatus === 'verified'}
              loading={verificationStatus === 'uploading'}
              variant="secondary"
            />

            {verificationStatus === 'rejected' && (
              <TouchableOpacity onPress={pickImage} style={styles.retryButton}>
                <Text style={styles.retryText}>Upload Different Screenshot</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Confirmation */}
        {bookingConfirmed && (
          <>
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Text style={styles.successIconText}>✓</Text>
              </View>
              <Text style={styles.successTitle}>Booking Confirmed!</Text>
              <Text style={styles.successMessage}>
                Your payment has been uploaded. Your slot is successfully booked!
              </Text>
            </View>

            <Card>
              <Text style={styles.cardTitle}>What's Next?</Text>
              <Text style={styles.nextStepText}>
                • Check "My Bookings" for details
              </Text>
              <Text style={styles.nextStepText}>
                • Arrive at the venue on time
              </Text>
              <Text style={styles.nextStepText}>
                • Have a great game!
              </Text>
            </Card>

            <Button
              title="View My Bookings"
              onPress={() => router.push('/bookings')}
              variant="secondary"
            />

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/(tabs)/home')}
            >
              <Text style={styles.secondaryButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </>
        )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
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
    fontSize: 18,
    color: COLORS.textSecondary,
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
    fontWeight: '500',
    color: COLORS.text,
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
    fontWeight: '700',
    color: COLORS.primary,
  },
  countdownCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  countdownContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  countdownLabel: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  countdownText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F59E0B',
    marginVertical: 4,
  },
  countdownSubtext: {
    fontSize: 11,
    color: '#92400E',
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '500',
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
  },
  changeButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 8,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusUploading: {
    backgroundColor: COLORS.primary + '20',
  },
  statusVerified: {
    backgroundColor: COLORS.success + '20',
  },
  statusRejected: {
    backgroundColor: COLORS.error + '20',
  },
  statusIcon: {
    fontSize: 16,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  retryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  retryText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successIconText: {
    fontSize: 40,
    color: COLORS.success,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  nextStepText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 80,
  },
  secondaryButtonText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
