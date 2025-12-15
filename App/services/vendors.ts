import { getDocs, getDoc, doc } from 'firebase/firestore';
import { vendorsCollection, db } from './firebase';
import { Vendor } from '../types';
import { apiClient, API_ENDPOINTS } from '../config/api';

const sanitizeVendorData = (data: any): Vendor => {
  const vendor: Vendor = {
    id: data.id || '',
    name: data.name || data.business_name || '',
    area: data.area || data.location || '',
    address: data.address || '',
    phone: data.phone || '',
    email: data.email || '',
    whatsapp_number: data.whatsapp_number || data.whatsapp_phone || '',
    whatsapp_connected: Boolean(data.whatsapp_number || data.whatsapp_phone),
    sheets_connected: Boolean(data.sheets_connected === 'true' || data.sheets_connected === true),
    operating_hours: data.operating_hours,
    description: data.description || '',
    created_at: data.created_at ? (typeof data.created_at === 'string' ? data.created_at : data.created_at.toDate?.()?.toISOString() || new Date().toISOString()) : new Date().toISOString(),
    images: data.images || [],
    rating: data.rating,
    review_count: data.review_count,
    price_range: data.price_range,
    amenities: data.amenities || [],
    category: data.category,
    location: data.location || data.area,
    business_name: data.business_name || data.name,
  };
  return vendor;
};

export const getVendors = async (): Promise<Vendor[]> => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.vendors.list);
    
    if (response.data.success && response.data.vendors) {
      return response.data.vendors.map((vendor: any) => sanitizeVendorData({ id: vendor.id || vendor.id, ...vendor }));
    }
    
    return [];
  } catch (error: any) {
    console.error('Error fetching vendors from backend:', error);
    
    try {
      const snapshot = await getDocs(vendorsCollection);
      return snapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        const { id: _, ...dataWithoutId } = data;
        return sanitizeVendorData({ id: docSnapshot.id, ...dataWithoutId });
      });
    } catch (firebaseError) {
      console.error('Error fetching vendors from Firebase fallback:', firebaseError);
      return [];
    }
  }
};

export const getVendorsByCategory = async (category: string): Promise<Vendor[]> => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.vendors.list, {
      params: {
        service_type: category
      }
    });
    
    if (response.data.success && response.data.vendors) {
      return response.data.vendors.map((vendor: any) => sanitizeVendorData({ id: vendor.id || vendor.id, ...vendor }));
    }
    
    return [];
  } catch (error: any) {
    console.error('Error fetching vendors by category from backend:', error);
    
    try {
      const { getVendorsBySportType } = await import('./services');
      const vendorIds = await getVendorsBySportType(category);
      if (vendorIds.length === 0) return [];
      
      const vendors = await getVendors();
      return vendors.filter(v => vendorIds.includes(v.id));
    } catch (fallbackError) {
      console.error('Error in fallback:', fallbackError);
      return [];
    }
  }
};

export const getSportsVendors = async (): Promise<Vendor[]> => {
  try {
    const response = await apiClient.get('/api/sport-courts');
    
    if (response.data.success && response.data.sport_courts) {
      return response.data.sport_courts.map((vendor: any) => sanitizeVendorData({ id: vendor.id || vendor.id, ...vendor }));
    }
    
    return [];
  } catch (error: any) {
    console.error('Error fetching sports vendors from backend:', error);
    
    try {
      const { getVendorsBySportType } = await import('./services');
      const padelIds = await getVendorsBySportType('padel');
      const futsalIds = await getVendorsBySportType('futsal');
      const allIds = [...new Set([...padelIds, ...futsalIds])];
      
      const vendors = await getVendors();
      return vendors.filter(v => allIds.includes(v.id));
    } catch (fallbackError) {
      console.error('Error in fallback:', fallbackError);
      return [];
    }
  }
};

export const getVendorById = async (id: string): Promise<Vendor | null> => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.vendors.get(id));
    
    if (response.data.success && response.data.vendor) {
      return sanitizeVendorData({ id: response.data.vendor.id || id, ...response.data.vendor });
    }
    
    return null;
  } catch (error: any) {
    console.error('Error fetching vendor from backend:', error);
    
    try {
      const docRef = doc(db, 'vendors', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return sanitizeVendorData({ id: docSnap.id, ...docSnap.data() });
      }
      return null;
    } catch (firebaseError) {
      console.error('Error fetching vendor from Firebase fallback:', firebaseError);
      return null;
    }
  }
};

