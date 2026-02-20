// API Service Layer for FastAPI Backend
// This provides a clean interface between React components and the backend

import type {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  Vendor,
  VendorListResponse,
  AvailabilityResponse,
  BookingRequest,
  BookingResponse,
  Booking,
  Service,
  VendorIntegrationStatus,
  WhatsAppConnectionRequest,
  GoogleSheetsConnectionRequest,
  DashboardMetrics,
  SearchParams,
} from '../types';

// Configuration
// When backend is ready, update this to your actual API URL
const API_BASE_URL = 'http://localhost:8000/api';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Helper function to make authenticated requests
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// ============================================================================
// PUBLIC ENDPOINTS (Customer-facing)
// ============================================================================

export const api = {
  // Authentication
  auth: {
    login: async (data: LoginRequest): Promise<LoginResponse> => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.access_token) {
        localStorage.setItem('auth_token', result.access_token);
      }
      return result;
    },

    register: async (data: RegisterRequest): Promise<LoginResponse> => {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },

    logout: () => {
      localStorage.removeItem('auth_token');
    },
  },

  // Vendors
  vendors: {
    list: async (params?: SearchParams): Promise<VendorListResponse> => {
      const queryParams = new URLSearchParams();
      if (params?.query) queryParams.append('query', params.query);
      if (params?.filters?.category) queryParams.append('category', params.filters.category);
      if (params?.filters?.location) queryParams.append('location', params.filters.location);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      return fetchWithAuth(`${API_BASE_URL}/vendors?${queryParams}`);
    },

    getById: async (id: number): Promise<Vendor> => {
      return fetchWithAuth(`${API_BASE_URL}/vendors/${id}`);
    },

    getAvailability: async (vendorId: number, date: string): Promise<AvailabilityResponse> => {
      return fetchWithAuth(`${API_BASE_URL}/vendors/${vendorId}/availability?date=${date}`);
    },

    getServices: async (vendorId: number): Promise<Service[]> => {
      return fetchWithAuth(`${API_BASE_URL}/vendors/${vendorId}/services`);
    },
  },

  // Bookings
  bookings: {
    create: async (data: BookingRequest): Promise<BookingResponse> => {
      return fetchWithAuth(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getById: async (id: number): Promise<Booking> => {
      return fetchWithAuth(`${API_BASE_URL}/bookings/${id}`);
    },

    getMyBookings: async (): Promise<Booking[]> => {
      return fetchWithAuth(`${API_BASE_URL}/bookings/my`);
    },

    cancel: async (id: number): Promise<{ success: boolean; message: string }> => {
      return fetchWithAuth(`${API_BASE_URL}/bookings/${id}`, {
        method: 'DELETE',
      });
    },
  },
};

// ============================================================================
// VENDOR ENDPOINTS (Authenticated)
// ============================================================================

export const vendorApi = {
  // Vendor Authentication
  auth: {
    register: async (data: RegisterRequest): Promise<LoginResponse> => {
      return fetch(`${API_BASE_URL}/auth/vendor/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((res) => res.json());
    },

    login: async (data: LoginRequest): Promise<LoginResponse> => {
      const response = await fetch(`${API_BASE_URL}/auth/vendor/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.access_token) {
        localStorage.setItem('auth_token', result.access_token);
      }
      return result;
    },
  },

  // Vendor Profile
  profile: {
    get: async (): Promise<Vendor> => {
      return fetchWithAuth(`${API_BASE_URL}/vendor/profile`);
    },

    update: async (data: Partial<Vendor>): Promise<Vendor> => {
      return fetchWithAuth(`${API_BASE_URL}/vendor/profile`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
  },

  // Vendor Bookings Management
  bookings: {
    list: async (filters?: { status?: string; date?: string }): Promise<Booking[]> => {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.date) queryParams.append('date', filters.date);

      return fetchWithAuth(`${API_BASE_URL}/vendor/bookings?${queryParams}`);
    },

    create: async (data: Partial<Booking>): Promise<Booking> => {
      return fetchWithAuth(`${API_BASE_URL}/vendor/bookings`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: number, data: Partial<Booking>): Promise<Booking> => {
      return fetchWithAuth(`${API_BASE_URL}/vendor/bookings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: number): Promise<{ success: boolean }> => {
      return fetchWithAuth(`${API_BASE_URL}/vendor/bookings/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Dashboard Metrics
  dashboard: {
    getMetrics: async (): Promise<DashboardMetrics> => {
      return fetchWithAuth(`${API_BASE_URL}/vendor/dashboard/metrics`);
    },
  },

  // Integrations
  integrations: {
    getStatus: async (): Promise<VendorIntegrationStatus> => {
      return fetchWithAuth(`${API_BASE_URL}/vendor/integrations/status`);
    },

    connectWhatsApp: async (data: WhatsAppConnectionRequest): Promise<{ success: boolean; message: string }> => {
      return fetchWithAuth(`${API_BASE_URL}/vendor/integrations/whatsapp`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    testWhatsApp: async (): Promise<{ success: boolean; message: string }> => {
      return fetchWithAuth(`${API_BASE_URL}/vendor/integrations/whatsapp/test`, {
        method: 'POST',
      });
    },

    connectGoogleSheets: async (data: GoogleSheetsConnectionRequest): Promise<{ success: boolean; message: string }> => {
      return fetchWithAuth(`${API_BASE_URL}/vendor/integrations/google-sheets`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    disconnectWhatsApp: async (): Promise<{ success: boolean }> => {
      return fetchWithAuth(`${API_BASE_URL}/vendor/integrations/whatsapp`, {
        method: 'DELETE',
      });
    },

    disconnectGoogleSheets: async (): Promise<{ success: boolean }> => {
      return fetchWithAuth(`${API_BASE_URL}/vendor/integrations/google-sheets`, {
        method: 'DELETE',
      });
    },
  },
};

// ============================================================================
// MOCK DATA (for development - remove when backend is ready)
// ============================================================================

export const mockData = {
  vendors: [
    {
      id: 1,
      business_name: 'Arena Sports Complex',
      category: 'Futsal',
      location: 'Clifton, Karachi',
      address: 'Block 5, Clifton, Karachi',
      phone: '+923001234567',
      email: 'arena@example.com',
      whatsapp_connected: true,
      whatsapp_phone: '+923001234567',
      sheets_connected: false,
      created_at: new Date().toISOString(),
      images: ['https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800'],
      rating: 4.5,
      review_count: 128,
      price_range: 'PKR 2000-3000/hr',
    },
    {
      id: 2,
      business_name: 'Glam Studio',
      category: 'Salon',
      location: 'DHA Phase 5, Karachi',
      address: 'Commercial Area, DHA Phase 5',
      phone: '+923007654321',
      email: 'glam@example.com',
      whatsapp_connected: true,
      sheets_connected: true,
      created_at: new Date().toISOString(),
      images: ['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800'],
      rating: 4.8,
      review_count: 256,
      price_range: 'PKR 1500-5000',
    },
  ] as Vendor[],

  bookings: [
    {
      id: 1,
      slot_id: 1,
      vendor_id: 1,
      customer_name: 'Ahmed Khan',
      customer_phone: '+923001111111',
      customer_email: 'ahmed@example.com',
      service_id: 1,
      date: '2025-10-25',
      time: '18:00',
      source: 'app' as const,
      status: 'confirmed' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ] as Booking[],
};
