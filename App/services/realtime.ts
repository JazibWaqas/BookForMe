/**
 * Real-time Data Listeners
 * Provides real-time updates for vendors, bookings, and slots using Firestore listeners
 */

import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  doc,
  Unsubscribe,
  Query,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase';
import { Vendor, Booking, Slot } from '../types';

// Callback types
type VendorCallback = (vendors: Vendor[]) => void;
type BookingCallback = (bookings: Booking[]) => void;
type SlotCallback = (slots: Slot[]) => void;
type ErrorCallback = (error: Error) => void;

/**
 * Listen to all vendors in real-time
 */
export const listenToVendors = (
  onUpdate: VendorCallback,
  onError?: ErrorCallback
): Unsubscribe => {
  const vendorsRef = collection(db, 'vendors');
  
  return onSnapshot(
    vendorsRef,
    (snapshot) => {
      const vendors: Vendor[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Vendor));
      onUpdate(vendors);
    },
    (error) => {
      console.error('Error listening to vendors:', error);
      if (onError) onError(error);
    }
  );
};

/**
 * Listen to vendors by category in real-time
 */
export const listenToVendorsByCategory = (
  category: string,
  onUpdate: VendorCallback,
  onError?: ErrorCallback
): Unsubscribe => {
  const vendorsRef = collection(db, 'vendors');
  const q = query(vendorsRef, where('category', '==', category));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const vendors: Vendor[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Vendor));
      onUpdate(vendors);
    },
    (error) => {
      console.error('Error listening to vendors by category:', error);
      if (onError) onError(error);
    }
  );
};

/**
 * Listen to a specific vendor in real-time
 */
export const listenToVendor = (
  vendorId: string,
  onUpdate: (vendor: Vendor | null) => void,
  onError?: ErrorCallback
): Unsubscribe => {
  const vendorRef = doc(db, 'vendors', vendorId);
  
  return onSnapshot(
    vendorRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate({ id: snapshot.id, ...snapshot.data() } as Vendor);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.error('Error listening to vendor:', error);
      if (onError) onError(error);
    }
  );
};

/**
 * Listen to user bookings in real-time
 */
export const listenToUserBookings = (
  userPhone: string,
  onUpdate: BookingCallback,
  onError?: ErrorCallback
): Unsubscribe => {
  const bookingsRef = collection(db, 'bookings');
  const q = query(bookingsRef, where('customer_phone', '==', userPhone));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const bookings: Booking[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Booking));
      // Sort by date, most recent first
      bookings.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      onUpdate(bookings);
    },
    (error) => {
      console.error('Error listening to user bookings:', error);
      if (onError) onError(error);
    }
  );
};

/**
 * Listen to vendor bookings in real-time
 */
export const listenToVendorBookings = (
  vendorId: string,
  onUpdate: BookingCallback,
  onError?: ErrorCallback
): Unsubscribe => {
  const bookingsRef = collection(db, 'bookings');
  const q = query(bookingsRef, where('vendor_id', '==', vendorId));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const bookings: Booking[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Booking));
      // Sort by date, most recent first
      bookings.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      onUpdate(bookings);
    },
    (error) => {
      console.error('Error listening to vendor bookings:', error);
      if (onError) onError(error);
    }
  );
};

/**
 * Listen to available slots for a vendor on a specific date
 */
export const listenToAvailableSlots = (
  vendorId: string,
  date: string,
  onUpdate: SlotCallback,
  onError?: ErrorCallback
): Unsubscribe => {
  const slotsRef = collection(db, 'slots');
  const q = query(
    slotsRef,
    where('vendor_id', '==', vendorId),
    where('date', '==', date),
    where('status', '==', 'available')
  );
  
  return onSnapshot(
    q,
    (snapshot) => {
      const slots: Slot[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Slot));
      // Sort by start_time
      slots.sort((a, b) => 
        (a.start_time || '').localeCompare(b.start_time || '')
      );
      onUpdate(slots);
    },
    (error) => {
      console.error('Error listening to available slots:', error);
      if (onError) onError(error);
    }
  );
};

/**
 * Listen to all slots for a vendor (for vendor dashboard)
 */
export const listenToVendorSlots = (
  vendorId: string,
  onUpdate: SlotCallback,
  onError?: ErrorCallback
): Unsubscribe => {
  const slotsRef = collection(db, 'slots');
  const q = query(slotsRef, where('vendor_id', '==', vendorId));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const slots: Slot[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Slot));
      onUpdate(slots);
    },
    (error) => {
      console.error('Error listening to vendor slots:', error);
      if (onError) onError(error);
    }
  );
};

