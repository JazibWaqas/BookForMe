import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { COLORS } from '../../constants/colors';

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Manage your account</Text>
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.profileCard}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <View style={styles.avatarInner} />
            </View>
            <Text style={styles.userName}>John Doe</Text>
            <Text style={styles.userEmail}>john.doe@email.com</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>450</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          {[1, 2, 3].map((i) => (
            <Card key={i} style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <Text style={styles.bookingTitle}>Elite Padel Club</Text>
                <Text style={styles.bookingStatus}>Confirmed</Text>
              </View>
              <Text style={styles.bookingDate}>Nov {i}, 2024 • 6:00 PM</Text>
              <Text style={styles.bookingPrice}>PKR 1,200</Text>
            </Card>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {[
            { label: 'Edit Profile' },
            { label: 'Notifications' },
            { label: 'Payment Methods' },
            { label: 'Help & Support' },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={styles.settingItem}>
              <Card style={styles.settingCard}>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  <Text style={styles.settingArrow}>→</Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Sign Out"
          variant="outline"
          onPress={() => router.replace('/(auth)/login')}
        />

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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.backgroundLight,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  profileCard: {
    marginBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.surface,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  avatarInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  bookingCard: {
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bookingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  bookingStatus: {
    fontSize: 12,
    color: COLORS.primary,
  },
  bookingDate: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  bookingPrice: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  settingItem: {
    marginBottom: 12,
  },
  settingCard: {
    padding: 0,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  settingArrow: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});


