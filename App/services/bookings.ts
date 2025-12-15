import { getDocs, addDoc, query, where } from 'firebase/firestore';
import { bookingsCollection, slotsCollection } from './firebase';
import { Booking, Slot } from '../types';
import { apiClient, API_ENDPOINTS } from '../config/api';

export const getAvailableSlots = async (vendorId: string, date: string): Promise<Slot[]> => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.vendors.availability(vendorId), {
      params: {
        date: date
      }
    });
    
    if (response.data.success && response.data.available_slots) {
      return response.data.available_slots.map((slot: any) => ({
        id: slot.slot_id || slot.id,
        vendor_id: vendorId,
        date: date,
        time: slot.time,
        start_time: slot.start_time,
        end_time: slot.end_time,
        price: slot.price,
        status: slot.status || 'available',
        service_id: slot.service_id,
        resource_id: slot.resource_id,
      } as Slot));
    }
    
    return [];
  } catch (error: any) {
    console.error('Error fetching available slots from backend:', error);
    
    try {
      const q = query(
        slotsCollection,
        where('vendor_id', '==', vendorId),
        where('date', '==', date),
        where('status', '==', 'available')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        const { id: _, ...dataWithoutId } = data;
        return { id: docSnapshot.id, ...dataWithoutId } as Slot;
      });
    } catch (firebaseError) {
      console.error('Error fetching slots from Firebase fallback:', firebaseError);
      return [];
    }
  }
};

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
    
    try {
      const { authService } = await import('./auth');
      const user = await authService.getCurrentUser();
      if (user && user.phone) {
        const q = query(bookingsCollection, where('customer_phone', '==', user.phone));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnapshot => {
          const data = docSnapshot.data();
          const { id: _, ...dataWithoutId } = data;
          return { id: docSnapshot.id, ...dataWithoutId } as Booking;
        });
      }
      return [];
    } catch (firebaseError) {
      console.error('Error fetching bookings from Firebase fallback:', firebaseError);
      return [];
    }
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

