import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../services/firebase';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { authService } from '../../services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [role, setRole] = useState<'customer' | 'vendor'>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

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
      Alert.alert('Google Sign-In Failed', response.error?.message || 'Please try again.');
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
    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const result = await authService.login(email, password);

      if (result.success && result.user && result.token) {
        const userRole = result.user.role || 'customer';

        // Store user role for session persistence
        await AsyncStorage.setItem('userRole', userRole);

        if (userRole === 'customer') {
          router.replace('/(tabs)/home');
        } else if (userRole === 'admin') {
          router.replace('/admin-dashboard');
        } else {
          router.replace('/vendor-dashboard');
        }
      } else {
        Alert.alert('Login Failed', result.error || 'Please check your credentials and try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred. Please try again.');
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
        Alert.alert('Sign-In Failed', result.error || 'Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Google Sign-In failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    await promptAsync();
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
          <View style={styles.header}>
            <View style={styles.logoGlow} />
            <Text style={styles.logoMark}>⚡</Text>
            <Text style={styles.logo}>BookForMe</Text>
            <Text style={styles.tagline}>Karachi's Sports Booking Platform</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Choose your role and login</Text>

            <View style={styles.roleToggle}>
              <TouchableOpacity
                activeOpacity={0.6}
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
                <Text style={[styles.roleSubtext, role === 'customer' && styles.roleSubtextActive]}>
                  Book venues
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.6}
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
                <Text style={[styles.roleSubtext, role === 'vendor' && styles.roleSubtextActive]}>
                  Manage bookings
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={[styles.inputWrapper, !!errors.email && styles.inputWrapperError]}>
                  <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="your@email.com"
                    placeholderTextColor={COLORS.textMuted}
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
                    }}
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
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputWrapper, !!errors.password && styles.inputWrapperError]}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter password"
                    placeholderTextColor={COLORS.textMuted}
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                    }}
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
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
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

              <TouchableOpacity>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Login"
              onPress={handleLogin}
              loading={loading}
              variant="secondary"
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={[styles.socialButton, styles.googleButton]}
                onPress={handleGoogleLogin}
                disabled={googleLoading || loading}
              >
                <Text style={styles.socialButtonText}>
                  {googleLoading ? 'Signing in...' : 'Continue with Google'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.linkText}>Sign up</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
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
  header: {
    paddingTop: 50,
    paddingBottom: 24,
    alignItems: 'center',
    position: 'relative',
  },
  logoGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(0, 208, 132, 0.07)',
    top: 20,
    alignSelf: 'center',
  },
  logoMark: {
    fontSize: 38,
    marginBottom: 10,
  },
  logo: {
    fontSize: 34,
    fontFamily: FONTS.extrabold,
    color: COLORS.primary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginBottom: 20,
  },
  roleToggle: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    marginBottom: 32,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  roleButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(0, 208, 132, 0.05)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  roleText: {
    fontSize: 15,
    fontFamily: FONTS.semibold,
    color: COLORS.textSecondary,
    marginBottom: 3,
  },
  roleTextActive: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  roleSubtext: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  roleSubtextActive: {
    color: COLORS.primary,
    opacity: 0.7,
  },
  form: {
    marginBottom: 20,
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 58,
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
  input: {
    marginBottom: 0,
  },
  forgotText: {
    fontSize: 14,
    color: COLORS.primary,
    opacity: 0.8,
    textAlign: 'right',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 15,
    color: COLORS.textMuted,
  },
  linkText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  socialButtons: {
    gap: 12,
    marginBottom: 12,
  },
  socialButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  googleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    height: 58,
    justifyContent: 'center',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
    borderColor: '#1877F2',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  facebookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
