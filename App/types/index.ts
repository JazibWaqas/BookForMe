// TypeScript interfaces for BookForMe mobile app

export interface Vendor {
  id: string;
  name: string;
  area: string;
  address?: string;
  phone: string;
  email?: string;
  whatsapp_number?: string;
  whatsapp_connected?: boolean;
  whatsapp_phone?: string;
  sheets_connected?: boolean;
  sheets_id?: string;
  operating_hours?: OperatingHours;
  created_at?: string;
  images?: string[];
  rating?: number;
  review_count?: number;
  price_range?: string;
  description?: string;
  amenities?: string[];
  category?: string;
  location?: string;
  business_name?: string;
}

export interface OperatingHours {
  mon?: { open: string; close: string };
  tue?: { open: string; close: string };
  wed?: { open: string; close: string };
  thu?: { open: string; close: string };
  fri?: { open: string; close: string };
  sat?: { open: string; close: string };
  sun?: { open: string; close: string };
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
  service_name?: string;
  name?: string;
  sport_type: 'padel' | 'futsal' | 'cricket' | 'pickleball';
  duration_min?: number;
  duration_minutes?: number;
  pricing?: {
    base: number;
    peak?: number;
    discount?: number;
  };
  price?: number;
  description?: string;
  active?: boolean;
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
  start_time?: string;
  end_time?: string;
  source: 'app' | 'whatsapp' | 'manual';
  status: 'confirmed' | 'cancelled' | 'completed' | 'pending' | 'locked';
  created_at: string;
  updated_at: string;
  service?: Service;
  vendor?: Vendor;
  amount?: number;
  price?: number;
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

