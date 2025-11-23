import { getDocs, addDoc, query, where, Timestamp } from 'firebase/firestore';
import { bookingsCollection, slotsCollection } from './firebase';
import { Booking, Slot } from '../types';

export const getAvailableSlots = async (vendorId: string, date: string): Promise<Slot[]> => {
  try {
    const q = query(
      slotsCollection,
      where('vendor_id', '==', vendorId),
      where('date', '==', date),
      where('status', '==', 'available')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Slot));
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return [];
  }
};

export const getUserBookings = async (userPhone: string): Promise<Booking[]> => {
  try {
    const q = query(bookingsCollection, where('customer_phone', '==', userPhone));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return [];
  }
};

export const createBooking = async (bookingData: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> => {
  try {
    const docRef = await addDoc(bookingsCollection, {
      ...bookingData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating booking:', error);
    return null;
  }
};

