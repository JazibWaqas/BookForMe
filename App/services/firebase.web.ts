import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, CollectionReference, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { initializeAuth, browserLocalPersistence, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
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
    persistence: browserLocalPersistence
});
export const storage: FirebaseStorage = getStorage(app);

enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code == 'unimplemented') {
        console.warn('Firestore persistence not available in this browser');
    } else {
        console.error('Firestore persistence error:', err);
    }
});

export const vendorsCollection = collection(db, 'vendors') as CollectionReference<Vendor>;
export const bookingsCollection = collection(db, 'bookings') as CollectionReference<Booking>;
export const slotsCollection = collection(db, 'slots') as CollectionReference<Slot>;
export const servicesCollection = collection(db, 'services') as CollectionReference<Service>;
export const usersCollection = collection(db, 'users') as CollectionReference<User>;
