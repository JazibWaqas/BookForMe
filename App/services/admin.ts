import { API_ENDPOINTS, apiClient } from '../config/api';

export type AdminOverviewMetrics = {
  pending_vendors: number;
  active_vendors: number;
  suspended_vendors: number;
  pending_payments: number;
  locked_slots: number;
};

export type AdminVendor = {
  id: string;
  name: string;
  owner_name?: string;
  email?: string;
  phone?: string;
  area?: string;
  status: string;
  created_at?: string;
  user_id?: string;
};

export type PendingPayment = {
  id: string;
  slot_id?: string;
  vendor_id?: string;
  user_id?: string;
  amount_claimed?: number;
  ocr_verified_amount?: number;
  screenshot_url?: string;
  created_at?: string;
  status: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  vendor_id?: string | null;
  account_status: string;
  created_at?: string;
};

export type AdminAuditLog = {
  id: string;
  admin_user_id?: string;
  admin_email?: string;
  action: string;
  target_type: string;
  target_id: string;
  reason?: string;
  created_at?: string;
};

class AdminService {
  async getOverview(): Promise<AdminOverviewMetrics> {
    const response = await apiClient.get(API_ENDPOINTS.admin.overview);
    if (!response.data?.success) throw new Error('Failed to fetch admin overview');
    return response.data.metrics;
  }

  async listVendors(status?: string): Promise<AdminVendor[]> {
    const response = await apiClient.get(API_ENDPOINTS.admin.vendors, {
      params: status ? { status } : undefined,
    });
    if (!response.data?.success) throw new Error('Failed to fetch vendors');
    return response.data.vendors || [];
  }

  async updateVendorStatus(vendorId: string, action: 'approve' | 'reject' | 'suspend' | 'reactivate', reason?: string) {
    const response = await apiClient.patch(API_ENDPOINTS.admin.vendorStatus(vendorId), { action, reason });
    if (!response.data?.success) throw new Error('Failed to update vendor status');
    return response.data;
  }

  async deleteVendor(vendorId: string, hardDelete = false, reason?: string) {
    const response = await apiClient.delete(API_ENDPOINTS.admin.deleteVendor(vendorId), {
      params: { hard_delete: hardDelete, reason },
    });
    if (!response.data?.success) throw new Error('Failed to delete vendor');
    return response.data;
  }

  async generateSlots(vendorId?: string, daysAhead = 14) {
    const response = await apiClient.post(API_ENDPOINTS.admin.generateSlots, {
      vendor_id: vendorId || null,
      days_ahead: daysAhead,
    });
    if (!response.data?.success) throw new Error('Failed to generate slots');
    return response.data;
  }

  async releaseStaleLocks() {
    const response = await apiClient.post(API_ENDPOINTS.admin.releaseStaleLocks);
    if (!response.data?.success) throw new Error('Failed to release stale locks');
    return response.data;
  }

  async listPendingPayments(): Promise<PendingPayment[]> {
    const response = await apiClient.get(API_ENDPOINTS.admin.pendingPayments);
    if (!response.data?.success) throw new Error('Failed to fetch payments');
    return response.data.payments || [];
  }

  async approvePayment(paymentId: string, reason?: string) {
    const response = await apiClient.post(API_ENDPOINTS.admin.approvePayment(paymentId), { reason });
    if (!response.data?.success) throw new Error('Failed to approve payment');
    return response.data;
  }

  async rejectPayment(paymentId: string, reason?: string) {
    const response = await apiClient.post(API_ENDPOINTS.admin.rejectPayment(paymentId), { reason });
    if (!response.data?.success) throw new Error('Failed to reject payment');
    return response.data;
  }

  async listUsers(query?: string): Promise<AdminUser[]> {
    const response = await apiClient.get(API_ENDPOINTS.admin.users, {
      params: query ? { q: query } : undefined,
    });
    if (!response.data?.success) throw new Error('Failed to fetch users');
    return response.data.users || [];
  }

  async setUserStatus(userId: string, active: boolean, reason?: string) {
    const response = await apiClient.post(API_ENDPOINTS.admin.updateUserStatus(userId), { active, reason });
    if (!response.data?.success) throw new Error('Failed to update user status');
    return response.data;
  }

  async listAuditLogs(): Promise<AdminAuditLog[]> {
    const response = await apiClient.get(API_ENDPOINTS.admin.auditLogs);
    if (!response.data?.success) throw new Error('Failed to fetch audit logs');
    return response.data.logs || [];
  }
}

export const adminService = new AdminService();
