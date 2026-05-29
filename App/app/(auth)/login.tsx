import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { authService } from '../../services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showError } from '../../utils/feedback';

WebBrowser.maybeCompleteAuthSession();

const GoogleIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </Svg>
);

export default function LoginScreen() {
  const router = useRouter();
  const [role, setRole] = useState<'customer' | 'vendor'>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '330764738815-dq8dstvtsruk6rd25tpmm32632lm1igo.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const { id_token } = response.params;
      handleGoogleCallback(id_token);
    } else if (response.type === 'error') {
      setGoogleLoading(false);
      showError('Google sign-in failed', response.error?.message || 'Please try again.');
    } else if (response.type === 'cancel' || response.type === 'dismiss') {
      setGoogleLoading(false);
    }
  }, [response]);

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) {
      next.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Enter a valid email address';
    }
    if (!password) {
      next.password = 'Password is required';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await authService.login(email, password);
      if (result.success && result.user && result.token) {
        const userRole = result.user.role || 'customer';
        await AsyncStorage.setItem('userRole', userRole);
        if (userRole === 'customer') {
          router.replace('/(tabs)/home');
        } else if (userRole === 'admin') {
          router.replace('/admin-dashboard');
        } else {
          router.replace('/vendor-dashboard');
        }
      } else {
        showError('Login failed', result.error || 'Please check your credentials and try again.');
      }
    } catch (error: any) {
      showError('Something went wrong', error.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCallback = async (idToken: string) => {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const { user: firebaseUser } = await signInWithCredential(auth, credential);
      const result = await authService.loginWithGoogleToken({
        email: firebaseUser.email!,
        name: firebaseUser.displayName || 'Google User',
        uid: firebaseUser.uid,
      });
      if (result.success && result.user) {
        const userRole = result.user.role || 'customer';
        if (userRole === 'admin') {
          router.replace('/admin-dashboard');
        } else if (userRole === 'vendor') {
          router.replace('/vendor-dashboard');
        } else {
          router.replace('/(tabs)/home');
        }
      } else {
        showError('Sign-in failed', result.error || 'Please try again.');
      }
    } catch (error: any) {
      showError('Google sign-in failed', error.message || 'Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    await promptAsync();
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
          {/* ── Brand Header ── */}
          <View style={styles.header}>
            <Ionicons name="flash" size={22} color={COLORS.primary} style={styles.logoMark} />
            <Text style={styles.logo}>BookForMe</Text>
            <Text style={styles.tagline}>Karachi's Premier Sports Booking</Text>
          </View>

          {/* ── Form Card ── */}
          <View style={styles.card}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Choose your role and sign in</Text>

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

            {/* Form Fields */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedField === 'email' && styles.inputWrapperFocused,
                  !!errors.email && styles.inputWrapperError,
                ]}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={focusedField === 'email' ? COLORS.primary : COLORS.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="your@email.com"
                    placeholderTextColor={COLORS.textMuted}
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
                    }}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="Email"
                    accessibilityHint="Enter the email address linked to your account"
                  />
                </View>
                {!!errors.email && (
                  <Text style={styles.fieldError} accessibilityLiveRegion="polite">
                    {errors.email}
                  </Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Password</Text>
                  <TouchableOpacity>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>
                <View style={[
                  styles.inputWrapper,
                  focusedField === 'password' && styles.inputWrapperFocused,
                  !!errors.password && styles.inputWrapperError,
                ]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={focusedField === 'password' ? COLORS.primary : COLORS.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter password"
                    placeholderTextColor={COLORS.textMuted}
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                    }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="Password"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={18}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                {!!errors.password && (
                  <Text style={styles.fieldError} accessibilityLiveRegion="polite">
                    {errors.password}
                  </Text>
                )}
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
              style={styles.loginButtonWrap}
            >
              <LinearGradient
                colors={loading ? ['#007A4D', '#005C3A'] : ['#00D084', '#00A866']}
                style={styles.loginButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Text>
                {!loading && (
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={styles.loginArrow} />
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Google Button removed to prevent broken sign-in flow on web/mobile */}

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.linkText}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 40 }} />
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
    paddingBottom: 28,
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
  inputContainer: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  forgotText: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
    color: COLORS.primary,
    opacity: 0.9,
  },

  // ── Login Button ──
  loginButtonWrap: {
    shadowColor: '#00D084',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
  loginButton: {
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  loginArrow: {
    marginLeft: 8,
  },

  // ── Divider ──
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // ── Google Button ──
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  googleButtonText: {
    fontSize: 15,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },

  // ── Footer ──
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
