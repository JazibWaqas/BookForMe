import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, CollectionReference, Firestore } from 'firebase/firestore';
// @ts-ignore: getReactNativePersistence is available at runtime but missing in some type definitions
import { initializeAuth, getReactNativePersistence, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vendor, Booking, Slot, Service, User } from '../types';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error('Missing Firebase configuration. Please check your .env file.');
}

const app: FirebaseApp = initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app);
export const auth: Auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const storage: FirebaseStorage = getStorage(app);

export const vendorsCollection = collection(db, 'vendors') as CollectionReference<Vendor>;
export const bookingsCollection = collection(db, 'bookings') as CollectionReference<Booking>;
export const slotsCollection = collection(db, 'slots') as CollectionReference<Slot>;
export const servicesCollection = collection(db, 'services') as CollectionReference<Service>;
export const usersCollection = collection(db, 'users') as CollectionReference<User>;

