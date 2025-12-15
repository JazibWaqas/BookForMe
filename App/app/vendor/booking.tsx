import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase';
import { apiClient, API_ENDPOINTS } from '../../config/api';
import { authService } from '../../services/auth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { COLORS } from '../../constants/colors';

type BookingStep = 'details' | 'payment' | 'confirmed';
type VerificationStatus = 'idle' | 'uploading' | 'analyzing' | 'verified' | 'rejected';

export default function BookingScreen() {
  const router = useRouter();
  const { vendorId, vendorName, date, time, slotId } = useLocalSearchParams<{
    vendorId: string;
    vendorName: string;
    date: string;
    time: string;
    slotId: string;
  }>();

  const [step, setStep] = useState<BookingStep>('details');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet' | 'venue'>('wallet');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [countdown, setCountdown] = useState(600); // 10 minutes in seconds
  const [loading, setLoading] = useState(false);

  const basePrice = 1250;
  const bookingFee = 50;
  const tax = 125;
  const total = basePrice + bookingFee + tax;

  // Countdown timer
  useEffect(() => {
    if (step === 'payment' && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            Alert.alert(
              'Time Expired',
              'Your slot reservation has expired. Please try booking again.',
              [{ text: 'OK', onPress: () => router.back() }]
            );
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [step, countdown]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLockSlot = async () => {
    if (!name || !phone || !email) {
      Alert.alert('Missing Info', 'Please fill in all customer details');
      return;
    }

    if (!slotId) {
      Alert.alert('Error', 'Slot ID is missing');
      return;
    }

    setLoading(true);

    try {
      const user = await authService.getCurrentUser();
      if (!user || !user.id) {
        Alert.alert('Error', 'Please login to continue');
        router.replace('/(auth)/login');
        return;
      }

      const response = await apiClient.post(`/api/slots/${slotId}/lock`);

      if (response.data.success) {
        const expiresInMinutes = response.data.expires_in_minutes || 10;
        setCountdown(expiresInMinutes * 60);
        setStep('payment');
      } else {
        Alert.alert('Error', response.data.error || 'Failed to lock slot. Please try again.');
      }
    } catch (error: any) {
      console.error('Error locking slot:', error);
      Alert.alert(
        'Error',
        error.response?.data?.detail || error.message || 'Failed to lock slot. Please try again.'
      );
    } finally {
      setLoading(false);
    }
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

      const filename = `payments/${user.id}/${slotId}_${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);

      const response = await fetch(screenshot);
      const blob = await response.blob();

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      const paymentResponse = await apiClient.post('/api/payments', {
        slot_id: slotId,
        screenshot_url: downloadURL,
        amount_claimed: total
      });

      if (paymentResponse.data.success) {
        setVerificationStatus('verified');
        setTimeout(() => {
          setStep('confirmed');
        }, 1500);
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 'details' ? 'Confirm Booking' : step === 'payment' ? 'Upload Payment' : 'Booking Confirmed'}
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content}>
        {/* Booking Summary - Always visible */}
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
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>PKR {total}</Text>
          </View>
        </Card>

        {/* Step 1: Customer Details */}
        {step === 'details' && (
          <>
            <Card>
              <Text style={styles.cardTitle}>Customer Details</Text>
              <View style={styles.formGroup}>
                <Input
                  label="Full Name"
                  placeholder="Enter your name"
                  value={name}
                  onChangeText={setName}
                />
              </View>
              <View style={styles.formGroup}>
                <Input
                  label="Phone Number"
                  placeholder="+92 300 1234567"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.formGroup}>
                <Input
                  label="Email"
                  placeholder="your@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />
              </View>
            </Card>

            <Card>
              <Text style={styles.cardTitle}>Payment Method</Text>
              <View style={styles.paymentOptions}>
                <TouchableOpacity
                  style={[styles.paymentOption, paymentMethod === 'wallet' && styles.paymentOptionActive]}
                  onPress={() => setPaymentMethod('wallet')}
                >
                  <Text style={[styles.paymentText, paymentMethod === 'wallet' && styles.paymentTextActive]}>
                    Digital Wallet
                  </Text>
                  <Text style={[styles.paymentSubtext, paymentMethod === 'wallet' && styles.paymentSubtextActive]}>
                    JazzCash / EasyPaisa
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.paymentOption, paymentMethod === 'card' && styles.paymentOptionActive]}
                  onPress={() => setPaymentMethod('card')}
                >
                  <Text style={[styles.paymentText, paymentMethod === 'card' && styles.paymentTextActive]}>
                    Bank Transfer
                  </Text>
                  <Text style={[styles.paymentSubtext, paymentMethod === 'card' && styles.paymentSubtextActive]}>
                    Screenshot proof
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>

            <Button
              title="Lock Slot & Proceed to Payment"
              onPress={handleLockSlot}
              loading={loading}
              variant="secondary"
            />
          </>
        )}

        {/* Step 2: Payment Upload with Countdown */}
        {step === 'payment' && (
          <>
            {/* Countdown Timer */}
            <Card style={styles.countdownCard}>
              <View style={styles.countdownContainer}>
                <Text style={styles.countdownLabel}>Slot Reserved For:</Text>
                <Text style={styles.countdownText}>⏱️ {formatCountdown(countdown)}</Text>
                <Text style={styles.countdownSubtext}>Complete payment before time expires</Text>
              </View>
            </Card>

            <Card>
              <Text style={styles.cardTitle}>Payment Instructions</Text>
              <Text style={styles.instructionText}>
                1. Transfer PKR {total} to the vendor's account
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
              {verificationStatus !== 'idle' && (
                <View style={styles.statusContainer}>
                  <View style={[
                    styles.statusIndicator,
                    verificationStatus === 'uploading' && styles.statusUploading,
                    verificationStatus === 'analyzing' && styles.statusAnalyzing,
                    verificationStatus === 'verified' && styles.statusVerified,
                    verificationStatus === 'rejected' && styles.statusRejected,
                  ]}>
                    {verificationStatus === 'uploading' && <Text style={styles.statusIcon}>⬆️</Text>}
                    {verificationStatus === 'analyzing' && <Text style={styles.statusIcon}>🔍</Text>}
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
              disabled={!screenshot || verificationStatus === 'uploading' || verificationStatus === 'analyzing' || verificationStatus === 'verified'}
              loading={verificationStatus === 'uploading' || verificationStatus === 'analyzing'}
              variant="secondary"
            />

            {verificationStatus === 'rejected' && (
              <TouchableOpacity onPress={pickImage} style={styles.retryButton}>
                <Text style={styles.retryText}>Upload Different Screenshot</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirmed' && (
          <>
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Text style={styles.successIconText}>✓</Text>
              </View>
              <Text style={styles.successTitle}>Booking Confirmed!</Text>
              <Text style={styles.successMessage}>
                Your payment has been verified. Waiting for vendor confirmation.
              </Text>
            </View>

            <Card>
              <Text style={styles.cardTitle}>What's Next?</Text>
              <Text style={styles.nextStepText}>
                • Vendor will confirm your booking within 10 minutes
              </Text>
              <Text style={styles.nextStepText}>
                • You'll receive a confirmation notification
              </Text>
              <Text style={styles.nextStepText}>
                • Check "My Bookings" to track status
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
  formGroup: {
    marginBottom: 16,
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentOption: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    alignItems: 'center',
  },
  paymentOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  paymentText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  paymentTextActive: {
    color: COLORS.primary,
  },
  paymentSubtext: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  paymentSubtextActive: {
    color: COLORS.primary,
    opacity: 0.8,
  },
  countdownCard: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: COLORS.warning,
  },
  countdownContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  countdownLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  countdownText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.warning,
    marginBottom: 4,
  },
  countdownSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
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
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    borderWidth: 3,
    borderColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successIconText: {
    fontSize: 40,
    color: COLORS.success,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  nextStepText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
});
