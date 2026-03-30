import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { authService } from '../../services/auth';
import {
  adminService,
  AdminAuditLog,
  AdminOverviewMetrics,
  AdminUser,
  AdminVendor,
  PendingPayment,
} from '../../services/admin';

const EMPTY_METRICS: AdminOverviewMetrics = {
  pending_vendors: 0,
  active_vendors: 0,
  suspended_vendors: 0,
  pending_payments: 0,
  locked_slots: 0,
};

export default function AdminDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AdminOverviewMetrics>(EMPTY_METRICS);
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const loadAdminData = useCallback(async (query?: string) => {
    const [overview, vendorRows, paymentRows, userRows, logs] = await Promise.all([
      adminService.getOverview(),
      adminService.listVendors(),
      adminService.listPendingPayments(),
      adminService.listUsers(query),
      adminService.listAuditLogs(),
    ]);
    setMetrics(overview);
    setVendors(vendorRows);
    setPayments(paymentRows);
    setUsers(userRows);
    setAuditLogs(logs);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!user) {
          router.replace('/(auth)/login');
          return;
        }
        if (user.role !== 'admin') {
          if (user.role === 'vendor') {
            router.replace('/vendor-dashboard');
          } else {
            router.replace('/(tabs)/home');
          }
          return;
        }

        setIsAdmin(true);
        await loadAdminData();
      } catch (e) {
        console.error('Failed to load admin dashboard', e);
        Alert.alert('Error', 'Failed to load admin dashboard');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [loadAdminData, router]);

  useFocusEffect(
    useCallback(() => {
      if (isAdmin) {
        loadAdminData(userQuery).catch((e) => console.error('Refresh admin data failed', e));
      }
    }, [isAdmin, loadAdminData, userQuery])
  );

  const withAction = async (key: string, task: () => Promise<void>) => {
    try {
      setActionLoading(key);
      await task();
      await loadAdminData(userQuery);
    } catch (e: any) {
      const message = e?.response?.data?.detail || e?.message || 'Request failed';
      Alert.alert('Error', String(message));
    } finally {
      setActionLoading(null);
    }
  };

  const confirmAndRun = (title: string, message: string, key: string, task: () => Promise<void>) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: 'destructive', onPress: () => withAction(key, task) },
    ]);
  };

  const onSearchUsers = async () => {
    await withAction('search-users', async () => {
      const rows = await adminService.listUsers(userQuery.trim());
      setUsers(rows);
    });
  };

  const onLogout = () => {
    Alert.alert('Logout', 'Do you want to logout from admin?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await authService.logout();
            router.replace('/(auth)/login');
          } catch (e) {
            console.error('Admin logout failed', e);
            Alert.alert('Error', 'Failed to logout');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 10) }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 10) + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Admin Control Center</Text>
            <Text style={styles.subtitle}>Full platform governance with audit visibility</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard label="Pending Vendors" value={metrics.pending_vendors} icon="business-outline" />
          <MetricCard label="Pending Payments" value={metrics.pending_payments} icon="wallet-outline" />
          <MetricCard label="Locked Slots" value={metrics.locked_slots} icon="lock-closed-outline" />
          <MetricCard label="Active Vendors" value={metrics.active_vendors} icon="checkmark-circle-outline" />
        </View>

        <SectionCard title="Slot Operations">
          <View style={styles.row}>
            <ActionButton
              label="Generate Slots (14d)"
              icon="add-circle-outline"
              loading={actionLoading === 'generate-slots'}
              onPress={() =>
                withAction('generate-slots', async () => {
                  const res = await adminService.generateSlots(undefined, 14);
                  Alert.alert('Done', `Created ${res.created ?? 0} slot documents.`);
                })
              }
            />
            <ActionButton
              label="Release Stale Locks"
              icon="key-outline"
              loading={actionLoading === 'release-locks'}
              onPress={() =>
                withAction('release-locks', async () => {
                  const res = await adminService.releaseStaleLocks();
                  Alert.alert('Done', `Released ${res.released_count ?? 0} expired holds.`);
                })
              }
            />
          </View>
        </SectionCard>

        <SectionCard title="Vendor Moderation">
          {vendors.slice(0, 8).map((vendor) => (
            <View key={vendor.id} style={styles.listItem}>
              <View style={styles.listItemMain}>
                <Text style={styles.itemTitle}>{vendor.name}</Text>
                <Text style={styles.itemSub}>
                  {vendor.status.toUpperCase()} · {vendor.email || 'No email'}
                </Text>
              </View>
              <View style={styles.actionsRow}>
                <MiniAction
                  text="Approve"
                  disabled={actionLoading !== null}
                  onPress={() =>
                    withAction(`vendor-approve-${vendor.id}`, async () => {
                      await adminService.updateVendorStatus(vendor.id, 'approve');
                    })
                  }
                />
                <MiniAction
                  text="Suspend"
                  disabled={actionLoading !== null}
                  onPress={() =>
                    withAction(`vendor-suspend-${vendor.id}`, async () => {
                      await adminService.updateVendorStatus(vendor.id, 'suspend', 'Admin moderation');
                    })
                  }
                />
                <MiniAction
                  text="Delete"
                  danger
                  disabled={actionLoading !== null}
                  onPress={() =>
                    confirmAndRun(
                      'Delete Vendor',
                      `Soft delete ${vendor.name}?`,
                      `vendor-delete-${vendor.id}`,
                      async () => {
                        await adminService.deleteVendor(vendor.id, false, 'Admin deletion');
                      }
                    )
                  }
                />
              </View>
            </View>
          ))}
          {vendors.length === 0 && <Text style={styles.emptyText}>No vendors found.</Text>}
        </SectionCard>

        <SectionCard title="Payment Reviews">
          {payments.slice(0, 8).map((payment) => (
            <View key={payment.id} style={styles.listItem}>
              <View style={styles.listItemMain}>
                <Text style={styles.itemTitle}>Payment {payment.id.slice(0, 10)}</Text>
                <Text style={styles.itemSub}>
                  PKR {Math.round(payment.amount_claimed || 0)} · Vendor {payment.vendor_id || '-'}
                </Text>
              </View>
              <View style={styles.actionsRow}>
                <MiniAction
                  text="Approve"
                  disabled={actionLoading !== null}
                  onPress={() =>
                    withAction(`payment-approve-${payment.id}`, async () => {
                      await adminService.approvePayment(payment.id, 'Admin approved payment proof');
                    })
                  }
                />
                <MiniAction
                  text="Reject"
                  danger
                  disabled={actionLoading !== null}
                  onPress={() =>
                    withAction(`payment-reject-${payment.id}`, async () => {
                      await adminService.rejectPayment(payment.id, 'Admin rejected payment proof');
                    })
                  }
                />
              </View>
            </View>
          ))}
          {payments.length === 0 && <Text style={styles.emptyText}>No pending payments.</Text>}
        </SectionCard>

        <SectionCard title="User Controls">
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email"
              placeholderTextColor={COLORS.textMuted}
              value={userQuery}
              onChangeText={setUserQuery}
            />
            <TouchableOpacity style={styles.searchBtn} onPress={onSearchUsers}>
              <Ionicons name="search" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
          {users.slice(0, 10).map((user) => (
            <View key={user.id} style={styles.listItem}>
              <View style={styles.listItemMain}>
                <Text style={styles.itemTitle}>{user.name || user.email}</Text>
                <Text style={styles.itemSub}>
                  {user.role.toUpperCase()} · {user.account_status || 'active'}
                </Text>
              </View>
              <View style={styles.actionsRow}>
                <MiniAction
                  text="Enable"
                  disabled={actionLoading !== null}
                  onPress={() =>
                    withAction(`user-enable-${user.id}`, async () => {
                      await adminService.setUserStatus(user.id, true, 'Admin enabled account');
                    })
                  }
                />
                <MiniAction
                  text="Disable"
                  danger
                  disabled={actionLoading !== null}
                  onPress={() =>
                    withAction(`user-disable-${user.id}`, async () => {
                      await adminService.setUserStatus(user.id, false, 'Admin disabled account');
                    })
                  }
                />
              </View>
            </View>
          ))}
        </SectionCard>

        <SectionCard title="Recent Audit Trail">
          {auditLogs.slice(0, 12).map((log) => (
            <View key={log.id} style={styles.auditRow}>
              <Text style={styles.auditAction}>{log.action}</Text>
              <Text style={styles.auditMeta}>
                {log.target_type}:{log.target_id} · {log.created_at?.slice(0, 16).replace('T', ' ') || '-'}
              </Text>
            </View>
          ))}
          {auditLogs.length === 0 && <Text style={styles.emptyText}>No admin actions logged yet.</Text>}
        </SectionCard>
      </ScrollView>
    </View>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.metricCard}>
      <Ionicons name={icon} size={18} color={COLORS.primary} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function ActionButton({
  label,
  icon,
  loading,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} disabled={!!loading}>
      {loading ? <ActivityIndicator color={COLORS.primary} /> : <Ionicons name={icon} size={20} color={COLORS.primary} />}
      <Text style={styles.actionBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

function MiniAction({
  text,
  danger,
  disabled,
  onPress,
}: {
  text: string;
  danger?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.miniAction, danger && styles.miniDanger, disabled && { opacity: 0.55 }]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.miniText, danger && styles.miniDangerText]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  headerTextWrap: { flex: 1 },
  title: { fontFamily: FONTS.extrabold, fontSize: 28, color: COLORS.text },
  subtitle: { marginTop: 6, fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textMuted },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.35)',
    backgroundColor: 'rgba(255, 69, 58, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 9,
  },
  logoutBtnText: { color: COLORS.error, fontFamily: FONTS.semibold, fontSize: 12 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  metricCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
  },
  metricValue: { marginTop: 8, fontFamily: FONTS.extrabold, fontSize: 24, color: COLORS.text },
  metricLabel: { marginTop: 4, fontFamily: FONTS.medium, fontSize: 11, color: COLORS.textMuted },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.backgroundAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionBtnText: { color: COLORS.text, fontFamily: FONTS.semibold, fontSize: 12 },
  listItem: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
    marginTop: 10,
  },
  listItemMain: { marginBottom: 8 },
  itemTitle: { color: COLORS.text, fontFamily: FONTS.semibold, fontSize: 14 },
  itemSub: { color: COLORS.textMuted, fontFamily: FONTS.regular, fontSize: 12, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 8 },
  miniAction: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 208, 132, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.4)',
  },
  miniDanger: {
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderColor: 'rgba(255, 69, 58, 0.4)',
  },
  miniText: { color: COLORS.primary, fontFamily: FONTS.semibold, fontSize: 11 },
  miniDangerText: { color: COLORS.error },
  emptyText: { color: COLORS.textMuted, fontFamily: FONTS.regular, fontSize: 12 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.backgroundAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    color: COLORS.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FONTS.regular,
    fontSize: 13,
  },
  searchBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 9,
    marginTop: 9,
  },
  auditAction: { color: COLORS.text, fontFamily: FONTS.semibold, fontSize: 12 },
  auditMeta: { color: COLORS.textMuted, fontFamily: FONTS.regular, fontSize: 11, marginTop: 3 },
});
