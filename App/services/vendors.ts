import { getDocs, getDoc, doc, query, where } from 'firebase/firestore';
import { vendorsCollection, db } from './firebase';
import { Vendor } from '../types';

const sanitizeVendorData = (data: any): Vendor => {
  return {
    ...data,
    whatsapp_connected: Boolean(data.whatsapp_connected === 'true' || data.whatsapp_connected === true),
    sheets_connected: Boolean(data.sheets_connected === 'true' || data.sheets_connected === true),
  };
};

export const getVendors = async (): Promise<Vendor[]> => {
  try {
    const snapshot = await getDocs(vendorsCollection);
    return snapshot.docs.map(doc => sanitizeVendorData({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return [];
  }
};

export const getVendorsByCategory = async (category: string): Promise<Vendor[]> => {
  try {
    const q = query(vendorsCollection, where('category', '==', category));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => sanitizeVendorData({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching vendors by category:', error);
    return [];
  }
};

export const getSportsVendors = async (): Promise<Vendor[]> => {
  try {
    const vendors = await getVendors();
    return vendors.filter(v => 
      v.category === 'Paddle' || 
      v.category === 'Futsal' || 
      v.category === 'Cricket' ||
      v.category === 'Tennis' ||
      v.category === 'Badminton'
    );
  } catch (error) {
    console.error('Error fetching sports vendors:', error);
    return [];
  }
};

export const getVendorById = async (id: string): Promise<Vendor | null> => {
  try {
    const docRef = doc(db, 'vendors', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return sanitizeVendorData({ id: docSnap.id, ...docSnap.data() });
    }
    return null;
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return null;
  }
};

