import { getDocs, getDoc, doc, query, where, collection } from 'firebase/firestore';
import { db, servicesCollection } from './firebase';
import { Service } from '../types';

export const getServices = async (): Promise<Service[]> => {
  try {
    const snapshot = await getDocs(servicesCollection);
    return snapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      const { id: _, ...dataWithoutId } = data;
      return { id: docSnapshot.id, ...dataWithoutId } as Service;
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

export const getServicesByVendor = async (vendorId: string): Promise<Service[]> => {
  try {
    const q = query(servicesCollection, where('vendor_id', '==', vendorId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      const { id: _, ...dataWithoutId } = data;
      return { id: docSnapshot.id, ...dataWithoutId } as Service;
    });
  } catch (error) {
    console.error('Error fetching services by vendor:', error);
    return [];
  }
};

export const getServicesBySportType = async (sportType: string): Promise<Service[]> => {
  try {
    const q = query(servicesCollection, where('sport_type', '==', sportType));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      const { id: _, ...dataWithoutId } = data;
      return { id: docSnapshot.id, ...dataWithoutId } as Service;
    });
  } catch (error) {
    console.error('Error fetching services by sport type:', error);
    return [];
  }
};

export const getCategories = async (): Promise<{ id: string; name: string; icon: string; count: number }[]> => {
  try {
    const services = await getServices();
    const categoryMap = new Map<string, number>();
    
    const icons: Record<string, string> = {
      padel: '🎾',
      futsal: '⚽',
      cricket: '🏏',
      pickleball: '🏓',
    };
    
    const names: Record<string, string> = {
      padel: 'Padel Courts',
      futsal: 'Futsal Courts',
      cricket: 'Cricket Nets',
      pickleball: 'Pickleball Courts',
    };
    
    services.forEach(service => {
      if (service.sport_type) {
        const count = categoryMap.get(service.sport_type) || 0;
        categoryMap.set(service.sport_type, count + 1);
      }
    });
    
    return Array.from(categoryMap.entries()).map(([sportType, count]) => ({
      id: sportType,
      name: names[sportType] || sportType,
      icon: icons[sportType] || '🏟️',
      count,
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const getVendorsBySportType = async (sportType: string): Promise<string[]> => {
  try {
    const services = await getServicesBySportType(sportType);
    return [...new Set(services.map(s => s.vendor_id))];
  } catch (error) {
    console.error('Error fetching vendor IDs by sport type:', error);
    return [];
  }
};
