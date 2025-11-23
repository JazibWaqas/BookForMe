// TypeScript interfaces for BookForMe mobile app

export interface Vendor {
  id: string;
  business_name: string;
  category: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  whatsapp_connected: boolean;
  whatsapp_phone?: string;
  sheets_connected: boolean;
  sheets_id?: string;
  operating_hours?: OperatingHours;
  created_at: string;
  images?: string[];
  rating?: number;
  review_count?: number;
  price_range?: string;
  description?: string;
  amenities?: string[];
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
  id: string;
  vendor_id: string;
  service_name: string;
  duration_minutes: number;
  price: number;
  description?: string;
}

export interface Slot {
  id: string;
  vendor_id: string;
  service_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'booked' | 'blocked';
}

export interface Booking {
  id: string;
  slot_id: string;
  vendor_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  service_id: string;
  date: string;
  time: string;
  source: 'app' | 'whatsapp' | 'manual';
  status: 'confirmed' | 'cancelled' | 'completed' | 'pending';
  created_at: string;
  updated_at: string;
  service?: Service;
  vendor?: Vendor;
  amount?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'customer' | 'vendor';
  vendor_id?: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count?: number;
}

export type RootStackParamList = {
  index: undefined;
  '(auth)/login': undefined;
  '(auth)/register': undefined;
  '(tabs)': undefined;
  'vendor/[id]': { id: string };
  'vendor/booking': { vendorId: string; date: string; time: string; slotId: string };
  'category/[category]': { category: string };
  notifications: undefined;
};

export type TabParamList = {
  home: undefined;
  chatbot: undefined;
  social: undefined;
  profile: undefined;
};

