import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { COLORS } from '../../constants/colors';
import { CATEGORIES } from '../../constants/categories';
import { authService } from '../../services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegisterScreen() {
  const router = useRouter();
  const [role, setRole] = useState<'customer' | 'vendor'>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Vendor-specific fields
  const [businessName, setBusinessName] = useState('');
  const [cnic, setCnic] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('padel');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    businessName?: string;
    address?: string;
  }>({});

  const clearError = (field: keyof typeof errors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = role === 'vendor' ? 'Owner name is required' : 'Full name is required';

    if (!email.trim()) {
      next.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Enter a valid email address';
    }

    if (!phone.trim()) {
      next.phone = 'Phone number is required';
    }

    if (!password) {
      next.password = 'Password is required';
    } else if (password.length < 6) {
      next.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      next.confirmPassword = 'Please confirm your password';
    } else if (password && confirmPassword !== password) {
      next.confirmPassword = 'Passwords do not match';
    }

    if (role === 'vendor') {
      if (!businessName.trim()) next.businessName = 'Business name is required';
      if (!address.trim()) next.address = 'Business address is required';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

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
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const { authService } = await import('../../services/auth');
      const result = await authService.register(email, password, name, phone, role);

      if (result.success && result.user) {
        // Store vendor data if vendor registration
        if (role === 'vendor' && result.user.id) {
          const vendorData = {
            businessName,
            ownerName: name,
            email,
            phone,
            cnic,
            category,
            address,
            location: location!,
            description,
          };
          await AsyncStorage.setItem('vendorProfile', JSON.stringify(vendorData));

          // Create vendor document in Firestore
          const { authService } = await import('../../services/auth');
          await authService.createVendorProfile(vendorData, result.user.id);
        }

        Alert.alert(
          'Success!',
          role === 'vendor'
            ? 'Vendor account created successfully! Your account is pending verification.'
            : 'Account created successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                if (role === 'vendor') {
                  router.replace('/vendor-dashboard');
                } else {
                  router.replace('/(tabs)/home');
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Registration Failed', result.error || 'Failed to create account. Please try again.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Error', error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.background, COLORS.backgroundLight]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join BookForMe today</Text>

            <View style={styles.roleToggle}>
              <TouchableOpacity
                style={[styles.roleButton, role === 'customer' && styles.roleButtonActive]}
                onPress={() => setRole('customer')}
              >
                <Ionicons
                  name="person"
                  size={24}
                  color={role === 'customer' ? COLORS.primary : COLORS.textMuted}
                />
                <Text style={[styles.roleText, role === 'customer' && styles.roleTextActive]}>
                  Customer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, role === 'vendor' && styles.roleButtonActive]}
                onPress={() => setRole('vendor')}
              >
                <Ionicons
                  name="business"
                  size={24}
                  color={role === 'vendor' ? COLORS.primary : COLORS.textMuted}
                />
                <Text style={[styles.roleText, role === 'vendor' && styles.roleTextActive]}>
                  Vendor
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              {/* Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{role === 'vendor' ? "Owner Name *" : "Full Name *"}</Text>
                <View style={[styles.inputWrapper, !!errors.name && styles.inputWrapperError]}>
                  <Ionicons name="person-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your name"
                    placeholderTextColor={COLORS.textMuted}
                    value={name}
                    onChangeText={(t) => { setName(t); clearError('name'); }}
                    autoCapitalize="words"
                    accessibilityLabel="Name"
                  />
                </View>
                {!!errors.name && <Text style={styles.fieldError} accessibilityLiveRegion="polite">{errors.name}</Text>}
              </View>

              {role === 'vendor' && (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Business Name *</Text>
                    <View style={[styles.inputWrapper, !!errors.businessName && styles.inputWrapperError]}>
                      <Ionicons name="briefcase-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter business name"
                        placeholderTextColor={COLORS.textMuted}
                        value={businessName}
                        onChangeText={(t) => { setBusinessName(t); clearError('businessName'); }}
                        autoCapitalize="words"
                        accessibilityLabel="Business name"
                      />
                    </View>
                    {!!errors.businessName && <Text style={styles.fieldError} accessibilityLiveRegion="polite">{errors.businessName}</Text>}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>CNIC (Optional)</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="card-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="42101-1234567-1"
                        placeholderTextColor={COLORS.textMuted}
                        value={cnic}
                        onChangeText={setCnic}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

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

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Business Address *</Text>
                    <View style={[styles.inputWrapper, { height: 'auto', minHeight: 52, paddingVertical: 12 }, !!errors.address && styles.inputWrapperError]}>
                      <Ionicons name="location-outline" size={20} color={COLORS.textMuted} style={[styles.inputIcon, { marginTop: 2 }]} />
                      <TextInput
                        style={[styles.textInput, { height: 'auto' }]}
                        placeholder="Enter business address"
                        placeholderTextColor={COLORS.textMuted}
                        value={address}
                        onChangeText={(t) => { setAddress(t); clearError('address'); }}
                        multiline
                        accessibilityLabel="Business address"
                      />
                    </View>
                    {!!errors.address && <Text style={styles.fieldError} accessibilityLiveRegion="polite">{errors.address}</Text>}
                  </View>

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

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Business Description</Text>
                    <View style={[styles.inputWrapper, { height: 'auto', minHeight: 80, paddingVertical: 12, alignItems: 'flex-start' }]}>
                      <Ionicons name="document-text-outline" size={20} color={COLORS.textMuted} style={[styles.inputIcon, { marginTop: 2 }]} />
                      <TextInput
                        style={[styles.textInput, { height: 'auto', textAlignVertical: 'top' }]}
                        placeholder="Describe your business (optional)"
                        placeholderTextColor={COLORS.textMuted}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                      />
                    </View>
                  </View>
                </>
              )}

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email *</Text>
                <View style={[styles.inputWrapper, !!errors.email && styles.inputWrapperError]}>
                  <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="your@email.com"
                    placeholderTextColor={COLORS.textMuted}
                    value={email}
                    onChangeText={(t) => { setEmail(t); clearError('email'); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="Email"
                  />
                </View>
                {!!errors.email && <Text style={styles.fieldError} accessibilityLiveRegion="polite">{errors.email}</Text>}
              </View>

              {/* Phone Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number *</Text>
                <View style={[styles.inputWrapper, !!errors.phone && styles.inputWrapperError]}>
                  <Ionicons name="call-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="+92 300 1234567"
                    placeholderTextColor={COLORS.textMuted}
                    value={phone}
                    onChangeText={(t) => { setPhone(t); clearError('phone'); }}
                    keyboardType="phone-pad"
                    accessibilityLabel="Phone number"
                  />
                </View>
                {!!errors.phone && <Text style={styles.fieldError} accessibilityLiveRegion="polite">{errors.phone}</Text>}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password *</Text>
                <View style={[styles.inputWrapper, !!errors.password && styles.inputWrapperError]}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Create password (min 6 chars)"
                    placeholderTextColor={COLORS.textMuted}
                    value={password}
                    onChangeText={(t) => { setPassword(t); clearError('password'); }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    accessibilityLabel="Password"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                {!!errors.password && <Text style={styles.fieldError} accessibilityLiveRegion="polite">{errors.password}</Text>}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password *</Text>
                <View style={[styles.inputWrapper, !!errors.confirmPassword && styles.inputWrapperError]}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Re-enter password"
                    placeholderTextColor={COLORS.textMuted}
                    value={confirmPassword}
                    onChangeText={(t) => { setConfirmPassword(t); clearError('confirmPassword'); }}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    accessibilityLabel="Confirm password"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                    accessibilityRole="button"
                    accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                {!!errors.confirmPassword && <Text style={styles.fieldError} accessibilityLiveRegion="polite">{errors.confirmPassword}</Text>}
              </View>
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

            <View style={{ height: 60 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
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
    borderColor: COLORS.border,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    gap: 8,
  },
  roleButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  roleText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  roleTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  form: {
    marginBottom: 24,
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  inputWrapperError: {
    borderColor: COLORS.error,
    backgroundColor: 'rgba(255, 69, 58, 0.06)',
  },
  fieldError: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '500',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  linkText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  categoryContainer: {
    marginBottom: 16,
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
