import { getDocs, addDoc, query, where } from 'firebase/firestore';
import { bookingsCollection, slotsCollection } from './firebase';
import { Booking, Slot } from '../types';
import { apiClient, API_ENDPOINTS } from '../config/api';
import {
  SlotDetails,
  ResourceGroup,
  AvailabilitySlotsResponse,
  LockSlotResponse,
  ReleaseSlotResponse,
  LockedSlot
} from '../types/booking';
import { format, parseISO } from 'date-fns';

/**
 * Fetch available slots for a vendor on a specific date
 * Returns slots grouped by resource (court)
 */
export const getAvailableSlots = async (
  vendorId: string,
  date: string
): Promise<{ resources: ResourceGroup[]; allSlots: SlotDetails[] }> => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.vendors.availability(vendorId), {
      params: { date }
    });

    if (response.data.success && response.data.available_slots) {
      const slots: SlotDetails[] = response.data.available_slots.map((slot: any) => ({
        id: slot.slot_id || slot.id,
        slot_id: slot.slot_id || slot.id,
        vendor_id: vendorId,
        service_id: slot.service_id,
        service_name: slot.service_name,
        resource_id: slot.resource_id,
        resource_name: slot.resource_name,
        date: date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        price: slot.price,
        status: slot.status || 'available',
        price_tier_used: slot.price_tier_used,
      }));

      // Group slots by resource
      const resourceMap = new Map<string, ResourceGroup>();

      slots.forEach(slot => {
        const key = slot.resource_id;
        if (!resourceMap.has(key)) {
          resourceMap.set(key, {
            resource_id: slot.resource_id,
            resource_name: slot.resource_name || `Court ${slot.resource_id}`,
            service_id: slot.service_id,
            service_name: slot.service_name || 'Court Rental',
            slots: [],
            availableCount: 0,
          });
        }

        const group = resourceMap.get(key)!;
        group.slots.push(slot);
        if (slot.status === 'available') {
          group.availableCount++;
        }
      });

      const resources = Array.from(resourceMap.values());

      return { resources, allSlots: slots };
    }

    return { resources: [], allSlots: [] };
  } catch (error: any) {
    console.error('Error fetching available slots from backend:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch slots');
  }
};

/**
 * Lock a slot for the current user (10-minute hold)
 */
export const lockSlot = async (slotId: string): Promise<LockSlotResponse> => {
  try {
    const response = await apiClient.post(`/api/slots/${slotId}/lock`);

    if (response.data.success) {
      return {
        success: true,
        slot_id: response.data.slot_id || slotId,
        hold_expires_at: response.data.hold_expires_at,
        expires_in_minutes: response.data.expires_in_minutes || 10,
      };
    }

    return {
      success: false,
      error: response.data.error || 'Failed to lock slot',
    };
  } catch (error: any) {
    console.error('Error locking slot:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to lock slot',
    };
  }
};

/**
 * Release a locked slot
 */
export const releaseSlot = async (slotId: string): Promise<ReleaseSlotResponse> => {
  try {
    // Note: Backend doesn't have explicit release endpoint yet
    // This would need to be added or we rely on auto-expiry
    console.log('Release slot called for:', slotId);
    return { success: true, slot_id: slotId };
  } catch (error: any) {
    console.error('Error releasing slot:', error);
    return {
      success: false,
      error: error.message || 'Failed to release slot',
    };
  }
};

/**
 * Check if user has any active locked slots
 */
export const getActiveLockForUser = async (): Promise<LockedSlot | null> => {
  try {
    // This would require a backend endpoint to check user's locked slots
    // For now, we'll store this in local state
    return null;
  } catch (error) {
    console.error('Error checking active locks:', error);
    return null;
  }
};

/**
 * Format time for display (e.g., "09:00 AM - 10:00 AM")
 */
export const formatSlotTime = (startTime: string, endTime: string): string => {
  try {
    if (!startTime || !endTime) {
      console.warn('Missing time data:', { startTime, endTime });
      return 'Time unavailable';
    }
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    return `${format(start, 'hh:mm a')} - ${format(end, 'hh:mm a')}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Time unavailable';
  }
};

/**
 * Format price for display (e.g., "PKR 1,500")
 */
export const formatPrice = (price: number): string => {
  return `PKR ${price.toLocaleString()}`;
};

/**
 * Calculate remaining time in minutes from expiry timestamp
 */
export const getRemainingMinutes = (expiryTime: string): number => {
  try {
    const expiry = parseISO(expiryTime);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    return Math.max(0, Math.floor(diffMs / 1000 / 60));
  } catch (error) {
    console.error('Error calculating remaining time:', error);
    return 0;
  }
};

/**
 * Format countdown timer (e.g., "9:45")
 */
export const formatCountdown = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Legacy functions for backward compatibility
export const getUserBookings = async (): Promise<Booking[]> => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.bookings.list);

    if (response.data.success && response.data.bookings) {
      return response.data.bookings.map((booking: any) => ({
        id: booking.id || booking.slot_id,
        slot_id: booking.slot_id || booking.id,
        vendor_id: booking.vendor_id,
        customer_name: booking.vendor?.owner_name || '',
        customer_phone: booking.vendor?.phone || '',
        customer_email: booking.vendor?.email || '',
        service_id: '',
        date: booking.date,
        time: booking.start_time,
        source: 'app',
        status: booking.status,
        created_at: booking.created_at || new Date().toISOString(),
        updated_at: booking.created_at || new Date().toISOString(),
        vendor: booking.vendor,
        amount: booking.payment?.amount_claimed
      } as Booking));
    }

    return [];
  } catch (error: any) {
    console.error('Error fetching user bookings from backend:', error);
    return [];
  }
};

export const createBooking = async (bookingData: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> => {
  try {
    const { id, ...dataWithoutId } = bookingData as any;
    const docRef = await addDoc(bookingsCollection, {
      ...dataWithoutId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any);
    return docRef.id;
  } catch (error) {
    console.error('Error creating booking:', error);
    return null;
  }
};
