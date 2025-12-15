import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { COLORS } from '../../constants/colors';
import { CATEGORIES } from '../../constants/categories';
import { authService } from '../../services/auth';

export default function RegisterScreen() {
  const router = useRouter();
  const [role, setRole] = useState<'customer' | 'vendor'>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Vendor-specific fields
  const [businessName, setBusinessName] = useState('');
  const [cnic, setCnic] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('padel');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant location permissions');
        setLocationLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const newLocation = {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      };
      setLocation(newLocation);
      
      // Reverse geocode to get address
      const [addressResult] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (addressResult) {
        const formattedAddress = `${addressResult.street || ''} ${addressResult.city || ''} ${addressResult.region || ''}`.trim();
        if (formattedAddress) {
          setAddress(formattedAddress);
        }
      }
      Alert.alert('Success', 'Location captured successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    }
    setLocationLoading(false);
  };

  const handleRegister = async () => {
    if (role === 'customer') {
      if (!name || !email || !phone || !password || !confirmPassword) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
    } else {
      if (!name || !email || !phone || !password || !confirmPassword || !businessName || !address || !category) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
      // CNIC and location are optional - no validation needed
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      const result = await authService.register(email, password, name, phone, role);
      
      if (result.success && result.user && result.token) {
        if (role === 'vendor') {
          const vendorData = {
            businessName,
            ownerName: name,
            email,
            phone,
            cnic: cnic || undefined,
            category,
            address,
            location: location || undefined,
            description,
          };
          await authService.createVendorProfile(vendorData, result.user.id);
          
          Alert.alert(
            'Success!',
            'Vendor account created successfully! Your account is pending verification.',
            [
              {
                text: 'OK',
                onPress: () => {
                  router.replace('/vendor-dashboard');
                },
              },
            ]
          );
        } else {
          Alert.alert(
            'Success!',
            'Account created successfully!',
            [
              {
                text: 'OK',
                onPress: () => {
                  router.replace('/(tabs)/home');
                },
              },
            ]
          );
        }
      } else {
        Alert.alert('Registration Failed', result.error || 'Please check your information and try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.background, COLORS.backgroundLight]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join BookForMe today</Text>

        <View style={styles.roleToggle}>
          <TouchableOpacity
            style={[styles.roleButton, role === 'customer' && styles.roleButtonActive]}
            onPress={() => setRole('customer')}
          >
            <Text style={[styles.roleText, role === 'customer' && styles.roleTextActive]}>
              Customer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleButton, role === 'vendor' && styles.roleButtonActive]}
            onPress={() => setRole('vendor')}
          >
            <Text style={[styles.roleText, role === 'vendor' && styles.roleTextActive]}>
              Vendor
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Input
            label={role === 'vendor' ? "Owner Name *" : "Full Name *"}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          {role === 'vendor' && (
            <>
              <Input
                label="Business Name *"
                placeholder="Enter business name"
                value={businessName}
                onChangeText={setBusinessName}
                style={styles.input}
              />
              <Input
                label="CNIC (Optional)"
                placeholder="42101-1234567-1"
                value={cnic}
                onChangeText={setCnic}
                keyboardType="numeric"
                style={styles.input}
              />
              <View style={styles.categoryContainer}>
                <Text style={styles.label}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryButton,
                        category === cat.id && styles.categoryButtonActive,
                      ]}
                      onPress={() => setCategory(cat.id)}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          category === cat.id && styles.categoryTextActive,
                        ]}
                      >
                        {cat.icon} {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <Input
                label="Business Address *"
                placeholder="Enter business address"
                value={address}
                onChangeText={setAddress}
                style={styles.input}
                multiline
              />
              <Button
                title={location ? "Update Location" : "Capture Location (Optional)"}
                onPress={getCurrentLocation}
                variant="outline"
                loading={locationLoading}
                style={styles.locationButton}
              />
              {location && (
                <Text style={styles.locationText}>
                  Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </Text>
              )}
              <Input
                label="Business Description"
                placeholder="Describe your business (optional)"
                value={description}
                onChangeText={setDescription}
                style={styles.input}
                multiline
                numberOfLines={3}
              />
            </>
          )}
          <Input
            label="Email *"
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={styles.input}
          />
          <Input
            label="Phone Number *"
            placeholder="+92 300 1234567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={styles.input}
          />
          <Input
            label="Password *"
            placeholder="Create password (min 6 characters)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
            style={styles.input}
          />
          <Input
            label="Confirm Password *"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={true}
            style={styles.input}
          />
        </View>

        <Button
          title="Sign Up"
          onPress={handleRegister}
          loading={loading}
          variant="secondary"
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.linkText}>Login</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginBottom: 32,
  },
  roleToggle: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#4b5563',
    borderRadius: 12,
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: '#4ade80',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  roleText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  roleTextActive: {
    color: '#4ade80',
    fontWeight: '600',
  },
  form: {
    marginBottom: 24,
    gap: 16,
  },
  input: {
    marginBottom: 0,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  linkText: {
    fontSize: 14,
    color: '#4ade80',
    fontWeight: '600',
  },
  categoryContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  categoryScroll: {
    marginHorizontal: -4,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    marginRight: 8,
  },
  categoryButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  categoryText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  categoryTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  locationButton: {
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginBottom: 16,
  },
});
