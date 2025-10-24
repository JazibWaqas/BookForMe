// TypeScript interfaces matching the PRD PostgreSQL database schema

export interface Vendor {
  id: number;
  business_name: string;
  category: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  password_hash?: string;
  whatsapp_connected: boolean;
  whatsapp_phone?: string;
  sheets_connected: boolean;
  sheets_id?: string;
  operating_hours?: OperatingHours;
  created_at: string;
  // Additional fields for UI
  images?: string[];
  rating?: number;
  review_count?: number;
  price_range?: string;
}

export interface OperatingHours {
  monday?: { open: string; close: string };
  tuesday?: { open: string; close: string };
  wednesday?: { open: string; close: string };
  thursday?: { open: string; close: string };
  friday?: { open: string; close: string };
  saturday?: { open: string; close: string };
  sunday?: { open: string; close: string };
}

export interface Service {
  id: number;
  vendor_id: number;
  service_name: string;
  duration_minutes: number;
  price: number;
  description?: string;
}

export interface Slot {
  id: number;
  vendor_id: number;
  service_id: number;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  status: 'available' | 'booked' | 'blocked';
}

export interface Booking {
  id: number;
  slot_id: number;
  vendor_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  service_id: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  source: 'app' | 'whatsapp' | 'manual';
  status: 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
  // Join fields
  service?: Service;
  vendor?: Vendor;
}

export interface ConversationState {
  user_phone: string;
  vendor_id: string;
  state: 'idle' | 'checking_availability' | 'awaiting_confirmation' | 'booking_confirmed';
  context?: {
    offered_slot?: {
      date: string;
      time: string;
      service: string;
    };
    last_intent?: string;
  };
  timestamp: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: 'customer' | 'vendor';
  vendor_id?: number;
  created_at: string;
}

// API Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: 'customer' | 'vendor';
  business_name?: string; // Required if vendor
  category?: string; // Required if vendor
  location?: string; // Required if vendor
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface VendorListResponse {
  vendors: Vendor[];
  total: number;
  page: number;
  limit: number;
}

export interface AvailabilityResponse {
  date: string;
  slots: Slot[];
}

export interface BookingRequest {
  vendor_id: number;
  service_id: number;
  date: string;
  time: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  send_whatsapp_confirmation?: boolean;
}

export interface BookingResponse {
  success: boolean;
  booking_id?: number;
  message: string;
  booking?: Booking;
}

export interface VendorIntegrationStatus {
  whatsapp: {
    connected: boolean;
    phone_number?: string;
    last_verified?: string;
  };
  google_sheets: {
    connected: boolean;
    sheet_id?: string;
    sheet_name?: string;
    last_sync?: string;
  };
}

export interface WhatsAppConnectionRequest {
  phone_number: string;
  access_token: string;
  webhook_verify_token: string;
}

export interface GoogleSheetsConnectionRequest {
  sheet_id: string;
  oauth_code: string;
  column_mapping: {
    date_column: string;
    time_column: string;
    customer_column: string;
    service_column: string;
  };
}

export interface DashboardMetrics {
  today_bookings: number;
  pending_bookings: number;
  total_revenue: number;
  active_integrations: number;
  recent_bookings: Booking[];
}

// UI State Types
export type Screen = 
  | 'auth' 
  | 'home' 
  | 'venues' 
  | 'venue-detail' 
  | 'booking-confirmation' 
  | 'booking-success'
  | 'chatbot' 
  | 'social' 
  | 'profile' 
  | 'notifications'
  // Vendor screens
  | 'vendor-dashboard'
  | 'vendor-calendar'
  | 'vendor-bookings'
  | 'vendor-profile'
  | 'vendor-integrations';

export interface AppState {
  currentScreen: Screen;
  user: {
    isAuthenticated: boolean;
    role: 'customer' | 'vendor' | null;
    data?: User;
  };
  screenData: any;
}

// Filter and Search Types
export interface VenueFilters {
  category?: string;
  location?: string;
  price_range?: 'low' | 'medium' | 'high';
  date?: string;
  availability?: boolean;
}

export interface SearchParams {
  query?: string;
  filters?: VenueFilters;
  page?: number;
  limit?: number;
}



