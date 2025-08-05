// Firebase configuration for React Native frontend (Expo compatible)
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyABT_0Mz5LZ-uuKcKJRjQGHLdJ0HFByGa4",
  authDomain: "neighborhoodaware-cf8dc.firebaseapp.com",
  projectId: "neighborhoodaware-cf8dc",
  storageBucket: "neighborhoodaware-cf8dc.firebasestorage.app",
  messagingSenderId: "407967024714",
  appId: "1:407967024714:web:b1d81cae2364f346c888b3",
  measurementId: "G-79EKJS9WPR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services with React Native persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);
export const functions = getFunctions(app);

export default app; 