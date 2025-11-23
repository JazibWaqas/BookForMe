import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function BookingScreen() {
  const router = useRouter();
  const { vendorId, vendorName, date, time, slotId } = useLocalSearchParams<{
    vendorId: string;
    vendorName: string;
    date: string;
    time: string;
    slotId: string;
  }>();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet' | 'venue'>('card');
  const [loading, setLoading] = useState(false);

  const basePrice = 1250;
  const bookingFee = 50;
  const tax = 125;
  const total = basePrice + bookingFee + tax;

  const handleConfirmPayment = async () => {
    if (!name || !phone || !email) {
      Alert.alert('Missing Info', 'Please fill in all customer details');
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Booking Confirmed!',
        `Your ${vendorName} slot for ${date} at ${time} has been booked.`,
        [
          {
            text: 'OK',
            onPress: () => router.push('/(tabs)/home'),
          },
        ]
      );
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Booking</Text>
      </View>

      <ScrollView style={styles.content}>
        <Card>
          <Text style={styles.cardTitle}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Venue:</Text>
            <Text style={styles.summaryValue}>{vendorName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date:</Text>
            <Text style={styles.summaryValue}>{date}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Time:</Text>
            <Text style={styles.summaryValue}>{time}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service:</Text>
            <Text style={styles.summaryValue}>Padel Court</Text>
          </View>
        </Card>

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
          <Text style={styles.cardTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Base Price:</Text>
            <Text style={styles.summaryValue}>PKR {basePrice}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Booking Fee:</Text>
            <Text style={styles.summaryValue}>PKR {bookingFee}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax (10%):</Text>
            <Text style={styles.summaryValue}>PKR {tax}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>PKR {total}</Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Payment Method</Text>
          <View style={styles.paymentOptions}>
            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'card' && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod('card')}
            >
              <Text style={[styles.paymentText, paymentMethod === 'card' && styles.paymentTextActive]}>
                💳 Card
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'wallet' && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod('wallet')}
            >
              <Text style={[styles.paymentText, paymentMethod === 'wallet' && styles.paymentTextActive]}>
                👛 Wallet
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'venue' && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod('venue')}
            >
              <Text style={[styles.paymentText, paymentMethod === 'venue' && styles.paymentTextActive]}>
                🏢 Pay at Venue
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Button
          title={`Confirm & Pay PKR ${total}`}
          onPress={handleConfirmPayment}
          loading={loading}
          variant="secondary"
        />

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#4b5563',
  },
  backButton: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: '#4b5563',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: '#d1d5db',
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f9fafb',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  summaryValue: {
    fontSize: 14,
    color: '#e5e7eb',
  },
  formGroup: {
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#4b5563',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f9fafb',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ade80',
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentOption: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#4b5563',
    borderRadius: 12,
    alignItems: 'center',
  },
  paymentOptionActive: {
    borderColor: '#4ade80',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  paymentText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  paymentTextActive: {
    color: '#4ade80',
    fontWeight: '600',
  },
});

