import { initializeApp } from 'firebase/app';
import { getFirestore, collection, CollectionReference } from 'firebase/firestore';
import { Vendor, Booking, Slot, Service } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyDu9mQxmKjL5z1C5YpW8RK_zVvN-tX9xQE",
  authDomain: "bookforme-c93a6.firebaseapp.com",
  projectId: "bookforme-c93a6",
  storageBucket: "bookforme-c93a6.appspot.com",
  messagingSenderId: "103421160411304955589",
  appId: "1:103421160411304955589:web:abc123",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const vendorsCollection = collection(db, 'vendors') as CollectionReference<Vendor>;
export const bookingsCollection = collection(db, 'bookings') as CollectionReference<Booking>;
export const slotsCollection = collection(db, 'slots') as CollectionReference<Slot>;
export const servicesCollection = collection(db, 'services') as CollectionReference<Service>;

