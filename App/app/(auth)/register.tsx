import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/ui/Button';
import { COLORS } from '../../constants/colors';
import { CATEGORIES } from '../../constants/categories';
import { FONTS } from '../../constants/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showError, showSuccess } from '../../utils/feedback';

const categoryIcons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
  padel: 'tennisball',
  futsal: 'football',
  cricket: 'baseball',
  pickleball: 'tennisball-outline',
};

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
  const [focusedField, setFocusedField] = useState<string | null>(null);
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
        showError('Permission needed', 'Please grant location permissions.');
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
      showSuccess('Location captured', 'Address filled from GPS.');
    } catch (error) {
      showError('Could not get location', 'Please try again.');
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

        showSuccess(
          role === 'vendor' ? 'Vendor account created' : 'Account created',
          role === 'vendor' ? 'Your account is pending verification.' : 'Welcome to BookForMe.'
        );
        if (role === 'vendor') {
          router.replace('/vendor-dashboard');
        } else {
          router.replace('/(tabs)/home');
        }
      } else {
        showError('Registration failed', result.error || 'Failed to create account. Please try again.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      showError('Registration failed', error.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Decorative concentric arcs — court-line inspired */}
      <View style={styles.decorArc1} />
      <View style={styles.decorArc2} />
      <View style={styles.decorArcBottomRight} />

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
          {/* Brand Header */}
          <View style={styles.header}>
            <Ionicons name="flash" size={22} color={COLORS.primary} style={styles.logoMark} />
            <Text style={styles.logo}>BookForMe</Text>
            <Text style={styles.tagline}>Karachi's Premier Sports Booking</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join BookForMe today</Text>

            {/* Role Toggle */}
            <View style={styles.roleToggle}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.roleButton, role === 'customer' && styles.roleButtonActive]}
                onPress={() => setRole('customer')}
              >
                <View style={[styles.roleIconWrap, role === 'customer' && styles.roleIconWrapActive]}>
                  <Ionicons
                    name="person"
                    size={20}
                    color={role === 'customer' ? COLORS.primary : COLORS.textMuted}
                  />
                </View>
                <Text style={[styles.roleText, role === 'customer' && styles.roleTextActive]}>
                  Customer
                </Text>
                <Text style={[styles.roleSubtext, role === 'customer' && styles.roleSubtextActive]}>
                  Book venues
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.roleButton, role === 'vendor' && styles.roleButtonActive]}
                onPress={() => setRole('vendor')}
              >
                <View style={[styles.roleIconWrap, role === 'vendor' && styles.roleIconWrapActive]}>
                  <Ionicons
                    name="business"
                    size={20}
                    color={role === 'vendor' ? COLORS.primary : COLORS.textMuted}
                  />
                </View>
                <Text style={[styles.roleText, role === 'vendor' && styles.roleTextActive]}>
                  Vendor
                </Text>
                <Text style={[styles.roleSubtext, role === 'vendor' && styles.roleSubtextActive]}>
                  Manage bookings
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {role === 'customer' ? (
                <>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="person-outline" size={16} color={COLORS.primary} style={styles.sectionIcon} />
                    <Text style={styles.sectionTitle}>Account Details</Text>
                  </View>

                  {/* Customer Full Name */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Full Name *</Text>
                    <View style={[
                      styles.inputWrapper,
                      focusedField === 'name' && styles.inputWrapperFocused,
                      !!errors.name && styles.inputWrapperError
                    ]}>
                      <Ionicons name="person-outline" size={18} color={focusedField === 'name' ? COLORS.primary : COLORS.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter your full name"
                        placeholderTextColor={COLORS.textMuted}
                        value={name}
                        onChangeText={(t) => { setName(t); clearError('name'); }}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        autoCapitalize="words"
                        accessibilityLabel="Name"
                      />
                    </View>
                    {!!errors.name && <Text style={styles.fieldError} accessibilityLiveRegion="polite">{errors.name}</Text>}
                  </View>
                </>
              ) : (
                <>
                  {/* Vendor Section 1: Business Details */}
                  <View style={styles.sectionHeader}>
                    <Ionicons name="business-outline" size={16} color={COLORS.primary} style={styles.sectionIcon} />
                    <Text style={styles.sectionTitle}>Business details</Text>
                  </View>

                  {/* Business Name */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Business Name *</Text>
                    <View style={[
                      styles.inputWrapper,
                      focusedField === 'businessName' && styles.inputWrapperFocused,
                      !!errors.businessName && styles.inputWrapperError
                    ]}>
                      <Ionicons name="briefcase-outline" size={18} color={focusedField === 'businessName' ? COLORS.primary : COLORS.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter business name"
                        placeholderTextColor={COLORS.textMuted}
                        value={businessName}
                        onChangeText={(t) => { setBusinessName(t); clearError('businessName'); }}
                        onFocus={() => setFocusedField('businessName')}
                        onBlur={() => setFocusedField(null)}
                        autoCapitalize="words"
                        accessibilityLabel="Business name"
                      />
                    </View>
                    {!!errors.businessName && <Text style={styles.fieldError} accessibilityLiveRegion="polite">{errors.businessName}</Text>}
                  </View>

                  {/* CNIC Optional */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>CNIC (Optional)</Text>
                    <View style={[
                      styles.inputWrapper,
                      focusedField === 'cnic' && styles.inputWrapperFocused
                    ]}>
                      <Ionicons name="card-outline" size={18} color={focusedField === 'cnic' ? COLORS.primary : COLORS.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="42101-1234567-1"
                        placeholderTextColor={COLORS.textMuted}
                        value={cnic}
                        onChangeText={setCnic}
                        onFocus={() => setFocusedField('cnic')}
                        onBlur={() => setFocusedField(null)}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  {/* Sports Category Scrollable Pills */}
                  <View style={styles.categoryContainer}>
                    <Text style={styles.label}>Category *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                      {CATEGORIES.map((cat) => {
                        const isActive = category === cat.id;
                        const iconColor = isActive ? COLORS.primary : COLORS.textMuted;
                        return (
                          <TouchableOpacity
                            key={cat.id}
                            activeOpacity={0.8}
                            style={[
                              styles.categoryButton,
                              isActive && styles.categoryButtonActive,
                            ]}
                            onPress={() => setCategory(cat.id)}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Ionicons
                                name={categoryIcons[cat.id] || 'tennisball'}
                                size={15}
                                color={iconColor}
                              />
                              <Text
                                style={[
                                  styles.categoryText,
                                  isActive && styles.categoryTextActive,
                                ]}
                              >
                                {cat.name}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Business Address */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Business Address *</Text>
                    <View style={[
                      styles.inputWrapper,
                      { height: 'auto', minHeight: 54, paddingVertical: 12 },
                      focusedField === 'address' && styles.inputWrapperFocused,
                      !!errors.address && styles.inputWrapperError
                    ]}>
                      <Ionicons name="location-outline" size={18} color={focusedField === 'address' ? COLORS.primary : COLORS.textMuted} style={[styles.inputIcon, { marginTop: 2 }]} />
                      <TextInput
                        style={[styles.textInput, { height: 'auto' }]}
                        placeholder="Enter business address"
                        placeholderTextColor={COLORS.textMuted}
                        value={address}
                        onChangeText={(t) => { setAddress(t); clearError('address'); }}
                        onFocus={() => setFocusedField('address')}
                        onBlur={() => setFocusedField(null)}
                        multiline
                        accessibilityLabel="Business address"
                      />
                    </View>
                    {!!errors.address && <Text style={styles.fieldError} accessibilityLiveRegion="polite">{errors.address}</Text>}
                  </View>

                  {/* Capture GPS Location Button */}
                  <View style={styles.locationContainer}>
                    <Button
                      title={location ? "Update Location" : "Capture Location (Optional)"}
                      onPress={getCurrentLocation}
                      variant="outline"
                      loading={locationLoading}
                      style={styles.locationButton}
                    />
                    {location && (
                      <View style={styles.locationTag}>
                        <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
                        <Text style={styles.locationText}>
                          GPS Fixed: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Business Description */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Business Description</Text>
                    <View style={[
                      styles.inputWrapper,
                      { height: 'auto', minHeight: 90, paddingVertical: 12, alignItems: 'flex-start' },
                      focusedField === 'description' && styles.inputWrapperFocused
                    ]}>
                      <Ionicons name="document-text-outline" size={18} color={focusedField === 'description' ? COLORS.primary : COLORS.textMuted} style={[styles.inputIcon, { marginTop: 2 }]} />
                      <TextInput
                        style={[styles.textInput, { height: 'auto', textAlignVertical: 'top' }]}
                        placeholder="Describe your business (optional)"
                        placeholderTextColor={COLORS.textMuted}
                        value={description}
                        onChangeText={setDescription}
                        onFocus={() => setFocusedField('description')}
                        onBlur={() => setFocusedField(null)}
                        multiline
                        numberOfLines={3}
                      />
                    </View>
                  </View>

                  <View style={styles.formDivider} />

                  {/* Vendor Section 2: Owner details */}
                  <View style={styles.sectionHeader}>
                    <Ionicons name="person-outline" size={16} color={COLORS.primary} style={styles.sectionIcon} />
                    <Text style={styles.sectionTitle}>Owner credentials</Text>
                  </View>

                  {/* Owner Full Name */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Owner Name *</Text>
                    <View style={[
                      styles.inputWrapper,
                      focusedField === 'name' && styles.inputWrapperFocused,
                      !!errors.name && styles.inputWrapperError
                    ]}>
                      <Ionicons name="person-outline" size={18} color={focusedField === 'name' ? COLORS.primary : COLORS.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter owner's full name"
                        placeholderTextColor={COLORS.textMuted}
                        value={name}
                        onChangeText={(t) => { setName(t); clearError('name'); }}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        autoCapitalize="words"
                        accessibilityLabel="Name"
                      />
                    </View>
                    {!!errors.name && <Text style={styles.fieldError} accessibilityLiveRegion="polite">{errors.name}</Text>}
                  </View>
                </>
              )}

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email *</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedField === 'email' && styles.inputWrapperFocused,
                  !!errors.email && styles.inputWrapperError
                ]}>
                  <Ionicons name="mail-outline" size={18} color={focusedField === 'email' ? COLORS.primary : COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="your@email.com"
                    placeholderTextColor={COLORS.textMuted}
                    value={email}
                    onChangeText={(t) => { setEmail(t); clearError('email'); }}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
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
                <View style={[
                  styles.inputWrapper,
                  focusedField === 'phone' && styles.inputWrapperFocused,
                  !!errors.phone && styles.inputWrapperError
                ]}>
                  <Ionicons name="call-outline" size={18} color={focusedField === 'phone' ? COLORS.primary : COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="+92 300 1234567"
                    placeholderTextColor={COLORS.textMuted}
                    value={phone}
                    onChangeText={(t) => { setPhone(t); clearError('phone'); }}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    keyboardType="phone-pad"
                    accessibilityLabel="Phone number"
                  />
                </View>
                {!!errors.phone && <Text style={styles.fieldError} accessibilityLiveRegion="polite">{errors.phone}</Text>}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password *</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedField === 'password' && styles.inputWrapperFocused,
                  !!errors.password && styles.inputWrapperError
                ]}>
                  <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'password' ? COLORS.primary : COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Create password (min 6 chars)"
                    placeholderTextColor={COLORS.textMuted}
                    value={password}
                    onChangeText={(t) => { setPassword(t); clearError('password'); }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
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
                      size={18}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                {!!errors.password && <Text style={styles.fieldError} accessibilityLiveRegion="polite">{errors.password}</Text>}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password *</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedField === 'confirmPassword' && styles.inputWrapperFocused,
                  !!errors.confirmPassword && styles.inputWrapperError
                ]}>
                  <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'confirmPassword' ? COLORS.primary : COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Re-enter password"
                    placeholderTextColor={COLORS.textMuted}
                    value={confirmPassword}
                    onChangeText={(t) => { setConfirmPassword(t); clearError('confirmPassword'); }}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
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
                      size={18}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                {!!errors.confirmPassword && <Text style={styles.fieldError} accessibilityLiveRegion="polite">{errors.confirmPassword}</Text>}
              </View>
            </View>

            {/* Submit Button */}
            <Button
              title="Sign Up"
              onPress={handleRegister}
              loading={loading}
              variant="secondary"
              style={styles.submitButton}
            />

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.linkText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },

  // ── Decorative background arcs (court-line inspired) ──
  decorArc1: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.055)',
    top: -100,
    alignSelf: 'center',
  },
  decorArc2: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.09)',
    top: -35,
    alignSelf: 'center',
  },
  decorArcBottomRight: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.04)',
    bottom: 50,
    right: -90,
  },

  // ── Scroll ──
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  // ── Brand Header ──
  header: {
    paddingTop: 64,
    paddingBottom: 20,
    alignItems: 'center',
  },
  logoMark: {
    marginBottom: 10,
  },
  logo: {
    fontSize: 32,
    fontFamily: FONTS.extrabold,
    color: COLORS.text,
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },

  // ── Form Card ──
  card: {
    marginHorizontal: 20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    backgroundColor: '#111827',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extrabold,
    color: COLORS.text,
    letterSpacing: -0.8,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginBottom: 24,
    textAlign: 'center',
  },

  // ── Role Toggle ──
  roleToggle: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 18,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    overflow: 'hidden',
  },
  roleButtonActive: {
    borderColor: 'rgba(0, 208, 132, 0.4)',
    backgroundColor: 'rgba(0, 208, 132, 0.1)',
    shadowColor: '#00D084',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 0,
  },
  roleIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 10,
  },
  roleIconWrapActive: {
    backgroundColor: 'rgba(0, 208, 132, 0.14)',
  },
  roleText: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  roleTextActive: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  roleSubtext: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  roleSubtextActive: {
    color: 'rgba(0, 208, 132, 0.7)',
  },

  // ── Form ──
  form: {
    marginBottom: 24,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionIcon: {
    opacity: 0.9,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  formDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 14,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
    color: COLORS.textSecondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 54,
  },
  inputWrapperFocused: {
    borderColor: 'rgba(0, 208, 132, 0.5)',
    backgroundColor: 'rgba(0, 208, 132, 0.03)',
  },
  inputWrapperError: {
    borderColor: COLORS.error,
    backgroundColor: 'rgba(255, 69, 58, 0.05)',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
  },
  fieldError: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.error,
  },

  // ── Category Pills ──
  categoryContainer: {
    gap: 8,
    marginVertical: 4,
  },
  categoryScroll: {
    marginHorizontal: -4,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    marginRight: 8,
  },
  categoryButtonActive: {
    borderColor: 'rgba(0, 208, 132, 0.4)',
    backgroundColor: 'rgba(0, 208, 132, 0.1)',
  },
  categoryText: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
    color: COLORS.textSecondary,
  },
  categoryTextActive: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },

  // ── Location Button & Tag ──
  locationContainer: {
    marginVertical: 4,
    gap: 10,
  },
  locationButton: {
    height: 50,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 208, 132, 0.08)',
    borderColor: 'rgba(0, 208, 132, 0.2)',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  locationText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },

  // ── Submit & Footer ──
  submitButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },
  footerText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  linkText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
});
