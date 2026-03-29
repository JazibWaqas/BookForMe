import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { authService } from '../../services/auth';
import { apiClient, API_ENDPOINTS } from '../../config/api';

// Simple in-memory cache for vendor bookings (shared with booking-detail)
const bookingsCache: { [vendorId: string]: { bookings: any[]; timestamp: number } } = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatReadableDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch { return dateStr; }
};

const formatCourtName = (resourceId?: string) => {
  if (!resourceId) return 'N/A';
  // "ace_court_1" → "Court 1"  |  "elite_pitch_2" → "Pitch 2"
  const parts = resourceId.split('_');
  if (parts.length >= 2) {
    const name = parts[parts.length - 2];
    const num = parts[parts.length - 1];
    return `${name.charAt(0).toUpperCase() + name.slice(1)} ${num}`;
  }
  return resourceId;
};

const SOURCE_LABEL: Record<string, string> = {
  whatsapp: '📱 WhatsApp',
  whatsapp_ai: '📱 WhatsApp',
  'walk-in': '🚶 Walk-in',
  app: '📲 App',
  manual: '🖊️ Manual',
};

// Vendor cares about 4 states: All / needs-action / confirmed / cancelled
type FilterType = 'all' | 'active' | 'confirmed' | 'cancelled';

const STATUS_DISPLAY: Record<string, { label: string; dot: string }> = {
  pending: { label: 'Awaiting Payment', dot: '#FBBF24' },
  locked: { label: 'Slot Held', dot: '#FBBF24' },
  confirmed: { label: 'Confirmed', dot: '#4ADE80' },
  completed: { label: 'Completed', dot: '#3B82F6' },
  cancelled: { label: 'Cancelled', dot: '#EF4444' },
  blocked: { label: 'Blocked', dot: '#6B7280' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function VendorBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  const fetchBookings = useCallback(async (silent = false, forceRefresh = false) => {
    if (!silent) setLoading(true);
    try {
      const user = await authService.getCurrentUser();
      if (user?.vendor_id) {
        const vendorId = user.vendor_id;

        // Check cache first (unless forcing refresh)
        const cached = bookingsCache[vendorId];
        const now = Date.now();
        if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_TTL) {
          // Use cached data
          setBookings(cached.bookings);
          setLoading(false);
        }

        // Always fetch fresh data in background
        const res = await apiClient.get(API_ENDPOINTS.vendors.bookings(vendorId));
        if (res.data.success) {
          const bookings = res.data.bookings || [];
          // Update cache
          bookingsCache[vendorId] = { bookings, timestamp: Date.now() };
          // Update UI
          setBookings(bookings);
        }
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Refresh whenever the screen comes back into focus
  useFocusEffect(useCallback(() => { fetchBookings(true); }, [fetchBookings]));

  const onRefresh = () => { setRefreshing(true); fetchBookings(true, true); };

  const filtered = bookings.filter((b) => {
    // Filter logic
    if (filter === 'active' && !['pending', 'locked'].includes(b.status)) return false;
    if (filter === 'confirmed' && !['confirmed', 'completed'].includes(b.status)) return false;
    if (filter === 'cancelled' && !['cancelled', 'blocked'].includes(b.status)) return false;

    // Search
    if (search) {
      const q = search.toLowerCase();
      if (
        !(b.customer_name || '').toLowerCase().includes(q) &&
        !(b.customer_phone || '').toLowerCase().includes(q) &&
        !(b.id || '').toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const FILTER_TABS: { key: FilterType; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: bookings.length },
    { key: 'active', label: 'Needs Action', count: bookings.filter(b => ['pending', 'locked'].includes(b.status)).length },
    { key: 'confirmed', label: 'Confirmed', count: bookings.filter(b => ['confirmed', 'completed'].includes(b.status)).length },
    { key: 'cancelled', label: 'Cancelled', count: bookings.filter(b => ['cancelled', 'blocked'].includes(b.status)).length },
  ];

  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Bookings</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="reload" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or phone…"
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          style={styles.searchInput}
        />
      </View>

      {/* ── Filter Tabs ── */}
      <View style={styles.tabRow}>
        {FILTER_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setFilter(tab.key)}
            style={[styles.tab, filter === tab.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>
              {tab.label}
              {tab.count !== undefined && tab.count > 0 ? ` (${tab.count})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Loading bookings…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        >
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No bookings found</Text>
              <Text style={styles.emptySub}>Pull down to refresh</Text>
            </View>
          ) : (
            filtered.map((b) => {
              const ds = STATUS_DISPLAY[b.status] ?? { label: b.status, dot: COLORS.textMuted };
              const src = SOURCE_LABEL[b.booking_source] ?? '';
              return (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => router.push(`/vendor-dashboard/booking-detail?bookingId=${b.id}`)}
                  activeOpacity={0.7}
                  style={styles.card}
                >
                  {/* Row 1: Date + Time | Status dot */}
                  <View style={styles.cardTop}>
                    <View>
                      <Text style={styles.cardDate}>{formatReadableDate(b.date)}</Text>
                      <Text style={styles.cardTime}>{b.time || '—'}</Text>
                    </View>
                    <View style={styles.statusPill}>
                      <View style={[styles.dot, { backgroundColor: ds.dot }]} />
                      <Text style={styles.statusLabel}>{ds.label}</Text>
                    </View>
                  </View>

                  {/* Row 2: Customer name */}
                  <Text style={styles.customerName}>{b.customer_name || 'Customer'}</Text>
                  {b.customer_phone ? <Text style={styles.customerPhone}>{b.customer_phone}</Text> : null}

                  {/* Row 3: Tags */}
                  <View style={styles.tagRow}>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>🏟 {formatCourtName(b.resource_id)}</Text>
                    </View>
                    <View style={[styles.tag, styles.tagGreen]}>
                      <Text style={[styles.tagText, { color: '#00EA77' }]}>
                        PKR {b.price || b.amount || 0}
                      </Text>
                    </View>
                    {src ? (
                      <View style={[styles.tag, styles.tagPurple]}>
                        <Text style={[styles.tagText, { color: '#A78BFA' }]}>{src}</Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles (dark theme to match app) ────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  refreshBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Search
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginHorizontal: 16, marginTop: 16, marginBottom: 8,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#FFF', paddingVertical: 14, fontWeight: '500' },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16, paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    borderWidth: 1, borderColor: 'transparent',
  },
  tabActive: { backgroundColor: '#00EA77', borderColor: '#00EA77' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },
  tabTextActive: { color: '#111827', fontWeight: '800' },

  // List
  list: { flex: 1, paddingHorizontal: 16 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80, gap: 12 },
  loaderText: { fontSize: 14, color: COLORS.textMuted },

  empty: { alignItems: 'center', paddingTop: 70 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: COLORS.textMuted },

  // Card
  card: {
    backgroundColor: '#1E293B', borderRadius: 16,
    padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.03)',
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 12,
  },
  cardDate: { fontSize: 13, color: '#9CA3AF', fontWeight: '600', letterSpacing: 0.5 },
  cardTime: { fontSize: 24, fontWeight: '900', color: '#FFF', marginTop: 2, letterSpacing: -0.5 },

  statusPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, gap: 6,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 12, fontWeight: '700', color: '#FFF', letterSpacing: 0.5 },

  customerName: { fontSize: 16, fontWeight: '800', color: '#FFF', marginBottom: 2 },
  customerPhone: { fontSize: 13, color: '#9CA3AF', marginBottom: 12, fontWeight: '500' },

  tagRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tagGreen: { borderColor: 'rgba(0, 234, 119, 0.2)', backgroundColor: 'rgba(0, 234, 119, 0.05)' },
  tagPurple: { borderColor: 'rgba(167, 139, 250, 0.2)', backgroundColor: 'rgba(167, 139, 250, 0.05)' },
  tagText: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5 },
});
