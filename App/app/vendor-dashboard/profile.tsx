import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, TextInput, Switch, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../../constants/colors';
import { authService } from '../../services/auth';
import { apiClient, API_ENDPOINTS } from '../../config/api';

const DAYS: { key: string; label: string }[] = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

const SPORT_OPTIONS = [
  { id: 'padel', label: 'Padel' },
  { id: 'futsal', label: 'Futsal' },
  { id: 'cricket', label: 'Cricket' },
  { id: 'pickleball', label: 'Pickleball' },
];

const AREA_OPTIONS = ['DHA', 'Clifton', 'Gulshan', 'Bahria Town', 'Korangi'];

const PAYMENT_TYPES = [
  { id: 'jazzcash', label: 'JazzCash' },
  { id: 'easypaisa', label: 'EasyPaisa' },
  { id: 'bank', label: 'Bank' },
];

type Resource = { id: string; name: string; capacity: number; active: boolean };
type Service = { id: string; name: string; sport_type: string; duration_min: number; pricing: { base: number } };
type PaymentAccount = { id: string; type: string; account_number: string; account_title: string; bank_name: string | null; is_default: boolean };
type OperatingHours = Record<string, { open: string; close: string }>;

function SectionCard({ icon, title, children }: { icon: keyof typeof Ionicons.glyphMap; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconWrap}>
          <Ionicons name={icon} size={15} color={COLORS.primary} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

function StyledInput({
  value, onChangeText, placeholder, keyboardType, multiline, numberOfLines, autoCapitalize,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  numberOfLines?: number;
  autoCapitalize?: any;
}) {
  return (
    <TextInput
      style={[styles.input, multiline && { height: 72, textAlignVertical: 'top', paddingTop: 10 }]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textMuted}
      keyboardType={keyboardType || 'default'}
      multiline={multiline}
      numberOfLines={numberOfLines}
      autoCapitalize={autoCapitalize || 'sentences'}
    />
  );
}

function SaveBtn({ onPress, loading, label = 'Save changes' }: { onPress: () => void; loading: boolean; label?: string }) {
  return (
    <TouchableOpacity style={styles.sectionSaveBtn} onPress={onPress} disabled={loading} activeOpacity={0.8}>
      {loading
        ? <ActivityIndicator size="small" color={COLORS.textDark} />
        : <Text style={styles.sectionSaveBtnText}>{label}</Text>}
    </TouchableOpacity>
  );
}

export default function VendorProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [vendorId, setVendorId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [area, setArea] = useState('DHA');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [hours, setHours] = useState<OperatingHours>({
    mon: { open: '07:00', close: '00:00' },
    tue: { open: '07:00', close: '00:00' },
    wed: { open: '07:00', close: '00:00' },
    thu: { open: '07:00', close: '00:00' },
    fri: { open: '07:00', close: '00:00' },
    sat: { open: '08:00', close: '00:00' },
    sun: { open: '08:00', close: '00:00' },
  });

  const [resources, setResources] = useState<Resource[]>([]);
  const [resourceSaving, setResourceSaving] = useState<Record<string, boolean>>({});
  const [services, setServices] = useState<Service[]>([]);
  const [serviceSaving, setServiceSaving] = useState<Record<string, boolean>>({});
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [accountSaving, setAccountSaving] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user?.vendor_id) return;
      const vId = user.vendor_id;
      setVendorId(vId);

      const [vRes, rRes, sRes, pRes] = await Promise.allSettled([
        apiClient.get(API_ENDPOINTS.vendors.get(vId)),
        apiClient.get(API_ENDPOINTS.vendors.resources(vId)),
        apiClient.get(API_ENDPOINTS.vendors.services(vId)),
        apiClient.get(API_ENDPOINTS.vendors.paymentAccounts(vId)),
      ]);

      if (vRes.status === 'fulfilled' && vRes.value.data.success) {
        const v = vRes.value.data.vendor;
        setBusinessName(v.name || v.business_name || '');
        setPhone(v.phone || '');
        setWhatsapp(v.whatsapp_number || v.phone || '');
        setEmail(v.email || user.email || '');
        setArea(v.area || 'DHA');
        setAddress(v.address || '');
        setDescription(v.description || '');
        if (typeof v.lat === 'number') setLat(v.lat);
        if (typeof v.lng === 'number') setLng(v.lng);
        if (v.operating_hours && Object.keys(v.operating_hours).length > 0) setHours(v.operating_hours);
      }

      if (rRes.status === 'fulfilled' && rRes.value.data.success) {
        setResources((rRes.value.data.resources || []).map((r: any) => ({
          id: r.id, name: r.name || '', capacity: Number(r.capacity) || 4, active: r.active !== false,
        })));
      }

      if (sRes.status === 'fulfilled' && sRes.value.data.success) {
        setServices((sRes.value.data.services || []).map((s: any) => ({
          id: s.id, name: s.name || '', sport_type: s.sport_type || 'padel',
          duration_min: Number(s.duration_min) || 60, pricing: { base: Number(s.pricing?.base) || 0 },
        })));
      }

      if (pRes.status === 'fulfilled' && pRes.value.data.success) {
        setAccounts((pRes.value.data.accounts || []).map((a: any) => ({
          id: a.id, type: a.type || 'jazzcash', account_number: a.account_number || '',
          account_title: a.account_title || '', bank_name: a.bank_name || null, is_default: Boolean(a.is_default),
        })));
      }
    } catch (e) {
      console.error('Profile load error:', e);
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveVenue = async () => {
    if (!vendorId || !businessName.trim() || !phone.trim() || !address.trim()) {
      Alert.alert('Required fields', 'Business name, phone, and address cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: businessName.trim(), phone: phone.trim(), whatsapp_number: whatsapp.trim(),
        email: email.trim(), area, address: address.trim(), description: description.trim(),
        operating_hours: hours,
      };
      if (lat != null && lng != null) { body.lat = lat; body.lng = lng; }
      await apiClient.patch(API_ENDPOINTS.vendors.patch(vendorId), body);
      await AsyncStorage.removeItem('vendorProfile');
      Alert.alert('Saved', 'Venue info updated.');
    } catch { Alert.alert('Error', 'Could not save. Try again.'); }
    finally { setSaving(false); }
  };

  const saveResource = async (r: Resource) => {
    if (!vendorId) return;
    setResourceSaving((p) => ({ ...p, [r.id]: true }));
    try {
      await apiClient.patch(API_ENDPOINTS.vendors.updateResource(vendorId, r.id), {
        name: r.name.trim(), capacity: r.capacity, active: r.active,
      });
    } catch { Alert.alert('Error', 'Could not update court.'); }
    finally { setResourceSaving((p) => ({ ...p, [r.id]: false })); }
  };

  const saveService = async (s: Service) => {
    if (!vendorId) return;
    setServiceSaving((p) => ({ ...p, [s.id]: true }));
    try {
      await apiClient.patch(API_ENDPOINTS.vendors.updateService(vendorId, s.id), {
        name: s.name.trim(), base_price: s.pricing.base, duration_min: s.duration_min,
      });
    } catch { Alert.alert('Error', 'Could not update pricing.'); }
    finally { setServiceSaving((p) => ({ ...p, [s.id]: false })); }
  };

  const saveAccount = async (a: PaymentAccount) => {
    if (!vendorId) return;
    setAccountSaving((p) => ({ ...p, [a.id]: true }));
    try {
      await apiClient.patch(API_ENDPOINTS.vendors.updatePaymentAccount(vendorId, a.id), {
        type: a.type, account_number: a.account_number.trim(),
        account_title: a.account_title.trim(), bank_name: a.bank_name || null, is_default: a.is_default,
      });
    } catch { Alert.alert('Error', 'Could not update payment account.'); }
    finally { setAccountSaving((p) => ({ ...p, [a.id]: false })); }
  };

  const getLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Allow location to pin your venue.'); return; }
      const loc = await Location.getCurrentPositionAsync({});
      setLat(loc.coords.latitude);
      setLng(loc.coords.longitude);
      const [res] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      if (res) {
        const formatted = [res.street, res.city, res.region].filter(Boolean).join(', ');
        if (formatted) setAddress(formatted);
      }
    } catch { Alert.alert('Error', 'Could not get GPS location.'); }
    finally { setLocating(false); }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign out', 'You will be signed out.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: async () => { await authService.logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  if (initializing) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  const bottomPad = Math.max(insets.bottom, 16) + 32;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['rgba(0,208,132,0.12)', 'transparent']}
        style={[styles.headerGradient, { paddingTop: insets.top }]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Venue settings</Text>
            <Text style={styles.headerSub}>{businessName || 'Your venue'}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Venue ── */}
        <SectionCard icon="business-outline" title="Venue">
          <FieldLabel label="Business name" />
          <StyledInput value={businessName} onChangeText={setBusinessName} placeholder="As shown to customers" />

          <FieldLabel label="Area" />
          <View style={styles.chipRow}>
            {AREA_OPTIONS.map((a) => (
              <TouchableOpacity key={a} style={[styles.chip, area === a && styles.chipActive]} onPress={() => setArea(a)}>
                <Text style={[styles.chipText, area === a && styles.chipTextActive]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <FieldLabel label="Street address" />
          <StyledInput value={address} onChangeText={setAddress} placeholder="Full address customers can find" multiline numberOfLines={2} />

          <TouchableOpacity style={styles.ghostBtn} onPress={getLocation} disabled={locating}>
            {locating
              ? <ActivityIndicator size="small" color={COLORS.primary} />
              : <>
                  <Ionicons name="location-outline" size={15} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.ghostBtnText}>{lat != null ? 'Update GPS pin' : 'Pin from GPS'}</Text>
                </>}
          </TouchableOpacity>
          {lat != null && (
            <Text style={styles.coordsText}>{lat.toFixed(5)}, {lng?.toFixed(5)}</Text>
          )}

          <FieldLabel label="Description" />
          <StyledInput value={description} onChangeText={setDescription} placeholder="What makes your venue stand out" multiline numberOfLines={3} />
        </SectionCard>

        {/* ── Contact ── */}
        <SectionCard icon="call-outline" title="Contact">
          <FieldLabel label="Phone" />
          <StyledInput value={phone} onChangeText={setPhone} placeholder="+92…" keyboardType="phone-pad" />

          <FieldLabel label="WhatsApp" />
          <View style={styles.inlineHint}>
            <StyledInput value={whatsapp} onChangeText={setWhatsapp} placeholder="+92… (used by AI booking agent)" keyboardType="phone-pad" />
          </View>

          <FieldLabel label="Email" />
          <StyledInput value={email} onChangeText={setEmail} placeholder="For admin and receipts" keyboardType="email-address" autoCapitalize="none" />
        </SectionCard>

        {/* ── Operating hours ── */}
        <SectionCard icon="time-outline" title="Operating hours">
          <View style={styles.hoursGrid}>
            {DAYS.map(({ key, label }) => {
              const day = hours[key] || { open: '08:00', close: '00:00' };
              return (
                <View key={key} style={styles.hoursRow}>
                  <Text style={styles.dayLabel}>{label}</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={day.open}
                    onChangeText={(t) => setHours((h) => ({ ...h, [key]: { ...h[key], open: t } }))}
                    placeholder="08:00"
                    placeholderTextColor={COLORS.textMuted}
                  />
                  <Text style={styles.timeDash}>–</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={day.close}
                    onChangeText={(t) => setHours((h) => ({ ...h, [key]: { ...h[key], close: t } }))}
                    placeholder="00:00"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              );
            })}
          </View>
          <Text style={styles.hint}>00:00 = midnight close. Affects slot generation.</Text>
        </SectionCard>

        {/* Primary save for venue + hours */}
        <View style={{ paddingHorizontal: 16, marginTop: 4 }}>
          <TouchableOpacity style={styles.primaryBtn} onPress={saveVenue} disabled={saving} activeOpacity={0.85}>
            {saving
              ? <ActivityIndicator color={COLORS.textDark} size="small" />
              : <>
                  <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.textDark} style={{ marginRight: 8 }} />
                  <Text style={styles.primaryBtnText}>Save venue info</Text>
                </>}
          </TouchableOpacity>
        </View>

        {/* ── Courts / resources ── */}
        {resources.length > 0 && (
          <SectionCard icon="grid-outline" title="Courts">
            {resources.map((r, idx) => (
              <View key={r.id} style={[styles.subCard, idx > 0 && { marginTop: 12 }]}>
                <View style={styles.subCardRow}>
                  <View style={styles.subCardDot} />
                  <Text style={styles.subCardName}>{r.name || `Court ${idx + 1}`}</Text>
                </View>
                <FieldLabel label="Display name" />
                <StyledInput
                  value={r.name}
                  onChangeText={(t) => setResources((prev) => prev.map((x) => x.id === r.id ? { ...x, name: t } : x))}
                  placeholder="Court 1"
                />
                <FieldLabel label="Max players" />
                <StyledInput
                  value={String(r.capacity)}
                  onChangeText={(t) => setResources((prev) => prev.map((x) => x.id === r.id ? { ...x, capacity: parseInt(t) || 0 } : x))}
                  keyboardType="number-pad"
                  placeholder="4"
                />
                <View style={styles.switchRow}>
                  <View>
                    <Text style={styles.switchTitle}>Visible to customers</Text>
                    <Text style={styles.switchSub}>Inactive courts won't appear in booking</Text>
                  </View>
                  <Switch
                    value={r.active}
                    onValueChange={(v) => setResources((prev) => prev.map((x) => x.id === r.id ? { ...x, active: v } : x))}
                    trackColor={{ false: COLORS.surfaceHighlight, true: COLORS.primary }}
                    thumbColor="#FFF"
                  />
                </View>
                <SaveBtn onPress={() => saveResource(r)} loading={!!resourceSaving[r.id]} label="Save court" />
              </View>
            ))}
          </SectionCard>
        )}

        {/* ── Pricing / services ── */}
        {services.length > 0 && (
          <SectionCard icon="pricetag-outline" title="Pricing">
            {services.map((s, idx) => (
              <View key={s.id} style={[styles.subCard, idx > 0 && { marginTop: 12 }]}>
                <View style={styles.priceHeader}>
                  <Text style={styles.subCardName}>{s.sport_type.charAt(0).toUpperCase() + s.sport_type.slice(1)}</Text>
                  <View style={styles.priceBadge}>
                    <Text style={styles.priceBadgeText}>PKR {s.pricing.base.toLocaleString()}</Text>
                  </View>
                </View>
                <FieldLabel label="Service name" />
                <StyledInput
                  value={s.name}
                  onChangeText={(t) => setServices((prev) => prev.map((x) => x.id === s.id ? { ...x, name: t } : x))}
                  placeholder="Court booking"
                />
                <FieldLabel label="Base price (PKR per session)" />
                <StyledInput
                  value={String(s.pricing.base)}
                  onChangeText={(t) => setServices((prev) => prev.map((x) => x.id === s.id ? { ...x, pricing: { base: parseInt(t) || 0 } } : x))}
                  keyboardType="number-pad"
                  placeholder="2000"
                />
                <FieldLabel label="Session duration (minutes)" />
                <StyledInput
                  value={String(s.duration_min)}
                  onChangeText={(t) => setServices((prev) => prev.map((x) => x.id === s.id ? { ...x, duration_min: parseInt(t) || 60 } : x))}
                  keyboardType="number-pad"
                  placeholder="60"
                />
                <SaveBtn onPress={() => saveService(s)} loading={!!serviceSaving[s.id]} label="Save pricing" />
              </View>
            ))}
          </SectionCard>
        )}

        {/* ── Payment accounts ── */}
        {accounts.length > 0 && (
          <SectionCard icon="card-outline" title="Payment accounts">
            {accounts.map((a, idx) => (
              <View key={a.id} style={[styles.subCard, idx > 0 && { marginTop: 12 }]}>
                <View style={styles.accountHeader}>
                  <View style={[styles.accountTypePill, a.type === 'jazzcash' ? styles.pillJazz : a.type === 'easypaisa' ? styles.pillEasy : styles.pillBank]}>
                    <Text style={styles.accountTypePillText}>{a.type === 'jazzcash' ? 'JazzCash' : a.type === 'easypaisa' ? 'EasyPaisa' : 'Bank'}</Text>
                  </View>
                  {a.is_default && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>

                <FieldLabel label="Type" />
                <View style={styles.chipRow}>
                  {PAYMENT_TYPES.map((pt) => (
                    <TouchableOpacity
                      key={pt.id}
                      style={[styles.chip, a.type === pt.id && styles.chipActive]}
                      onPress={() => setAccounts((prev) => prev.map((x) => x.id === a.id ? { ...x, type: pt.id } : x))}
                    >
                      <Text style={[styles.chipText, a.type === pt.id && styles.chipTextActive]}>{pt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <FieldLabel label="Account number / IBAN" />
                <StyledInput
                  value={a.account_number}
                  onChangeText={(t) => setAccounts((prev) => prev.map((x) => x.id === a.id ? { ...x, account_number: t } : x))}
                  placeholder="03xx-xxxxxxx"
                  keyboardType="default"
                />

                <FieldLabel label="Account title" />
                <StyledInput
                  value={a.account_title}
                  onChangeText={(t) => setAccounts((prev) => prev.map((x) => x.id === a.id ? { ...x, account_title: t } : x))}
                  placeholder="Shown on payment screen"
                />

                {a.type === 'bank' && (
                  <>
                    <FieldLabel label="Bank name" />
                    <StyledInput
                      value={a.bank_name || ''}
                      onChangeText={(t) => setAccounts((prev) => prev.map((x) => x.id === a.id ? { ...x, bank_name: t } : x))}
                      placeholder="e.g. Meezan Bank"
                    />
                  </>
                )}

                <View style={styles.switchRow}>
                  <View>
                    <Text style={styles.switchTitle}>Default account</Text>
                    <Text style={styles.switchSub}>Shown first to customers on checkout</Text>
                  </View>
                  <Switch
                    value={a.is_default}
                    onValueChange={(v) => setAccounts((prev) => prev.map((x) => x.id === a.id ? { ...x, is_default: v } : x))}
                    trackColor={{ false: COLORS.surfaceHighlight, true: COLORS.primary }}
                    thumbColor="#FFF"
                  />
                </View>
                <SaveBtn onPress={() => saveAccount(a)} loading={!!accountSaving[a.id]} label="Save account" />
              </View>
            ))}
          </SectionCard>
        )}

        {/* Sign out */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.error} style={{ marginRight: 8 }} />
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const C = COLORS;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },

  headerGradient: { paddingBottom: 0 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 16, paddingTop: 12,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.surfaceRaised, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: C.text, letterSpacing: -0.5, textAlign: 'center' },
  headerSub: { fontSize: 13, color: C.textMuted, textAlign: 'center', marginTop: 1 },

  card: {
    backgroundColor: C.surface, borderRadius: 18, marginHorizontal: 16, marginTop: 14,
    padding: 18, borderWidth: 1, borderColor: C.border, ...SHADOWS.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  cardIconWrap: {
    width: 30, height: 30, borderRadius: 9, backgroundColor: C.primaryGlow,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: C.text, letterSpacing: -0.3 },

  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase',
    letterSpacing: 0.7, marginBottom: 6, marginTop: 14,
  },
  input: {
    backgroundColor: C.surfaceRaised, borderRadius: 10, borderWidth: 1, borderColor: C.border,
    color: C.text, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontWeight: '500',
  },
  inlineHint: {},
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 2 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: C.borderStrong, backgroundColor: C.surfaceRaised,
  },
  chipActive: { borderColor: C.primary, backgroundColor: 'rgba(0,208,132,0.1)' },
  chipText: { fontSize: 13, color: C.textSecondary, fontWeight: '600' },
  chipTextActive: { color: C.primary, fontWeight: '700' },

  ghostBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    marginTop: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: C.borderStrong, backgroundColor: C.surfaceRaised,
  },
  ghostBtnText: { fontSize: 13, color: C.primary, fontWeight: '600' },
  coordsText: { fontSize: 11, color: C.textMuted, fontFamily: 'monospace', marginTop: 6 },

  hoursGrid: { gap: 0 },
  hoursRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  dayLabel: { width: 38, fontSize: 13, fontWeight: '700', color: C.textSecondary },
  timeInput: {
    flex: 1, backgroundColor: C.surfaceRaised, borderRadius: 8, borderWidth: 1,
    borderColor: C.border, color: C.text, paddingHorizontal: 10,
    paddingVertical: 7, fontSize: 13, textAlign: 'center', fontWeight: '600',
  },
  timeDash: { color: C.textMuted, fontSize: 14, paddingHorizontal: 8 },
  hint: { fontSize: 11, color: C.textMuted, marginTop: 10, lineHeight: 16 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 14, backgroundColor: C.primary, marginTop: 14,
    ...SHADOWS.primaryGlow,
  },
  primaryBtnText: { color: C.textDark, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },

  subCard: {
    backgroundColor: C.surfaceRaised, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  subCardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  subCardDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary, marginRight: 8,
  },
  subCardName: { fontSize: 13, fontWeight: '700', color: C.text },

  priceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  priceBadge: { backgroundColor: 'rgba(0,208,132,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  priceBadgeText: { fontSize: 12, color: C.primary, fontWeight: '700' },

  accountHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  accountTypePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pillJazz: { backgroundColor: 'rgba(244, 63, 94, 0.12)' },
  pillEasy: { backgroundColor: 'rgba(16, 185, 129, 0.12)' },
  pillBank: { backgroundColor: 'rgba(96, 165, 250, 0.12)' },
  accountTypePillText: { fontSize: 12, color: C.textSecondary, fontWeight: '700' },
  defaultBadge: { backgroundColor: 'rgba(0,208,132,0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  defaultBadgeText: { fontSize: 11, color: C.primary, fontWeight: '700' },

  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border,
  },
  switchTitle: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2 },
  switchSub: { fontSize: 11, color: C.textMuted },

  sectionSaveBtn: {
    marginTop: 14, paddingVertical: 11, borderRadius: 10, backgroundColor: C.primaryGlow,
    borderWidth: 1, borderColor: 'rgba(0,208,132,0.3)', alignItems: 'center',
  },
  sectionSaveBtnText: { color: C.primary, fontSize: 13, fontWeight: '700' },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,69,58,0.3)',
    backgroundColor: 'rgba(255,69,58,0.06)',
  },
  signOutText: { color: C.error, fontSize: 15, fontWeight: '700' },
});
