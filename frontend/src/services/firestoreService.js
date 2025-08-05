// Firestore service for React Native frontend (Expo compatible)
import { db } from './firebaseConfig';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';

// Add a new complaint
export const addComplaint = async (complaint) => {
  try {
    const docRef = await addDoc(collection(db, 'complaints'), {
      ...complaint,
      timestamp: serverTimestamp(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    console.log('Complaint added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding complaint:', error);
    throw error;
  }
};

// Get all complaints
export const getComplaints = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'complaints'));
    const complaints = [];
    querySnapshot.forEach((doc) => {
      complaints.push({ id: doc.id, ...doc.data() });
    });
    return complaints;
  } catch (error) {
    console.error('Error getting complaints:', error);
    throw error;
  }
};

// Get complaint by ID
export const getComplaintById = async (complaintId) => {
  try {
    const docRef = doc(db, 'complaints', complaintId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error('Complaint not found');
    }
  } catch (error) {
    console.error('Error getting complaint:', error);
    throw error;
  }
};

// Update complaint
export const updateComplaint = async (complaintId, updates) => {
  try {
    const docRef = doc(db, 'complaints', complaintId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    console.log('Complaint updated successfully');
  } catch (error) {
    console.error('Error updating complaint:', error);
    throw error;
  }
};

// Delete complaint
export const deleteComplaint = async (complaintId) => {
  try {
    await deleteDoc(doc(db, 'complaints', complaintId));
    console.log('Complaint deleted successfully');
  } catch (error) {
    console.error('Error deleting complaint:', error);
    throw error;
  }
};

// Get complaints by user
export const getComplaintsByUser = async (userId) => {
  try {
    const q = query(
      collection(db, 'complaints'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const complaints = [];
    querySnapshot.forEach((doc) => {
      complaints.push({ id: doc.id, ...doc.data() });
    });
    return complaints;
  } catch (error) {
    console.error('Error getting user complaints:', error);
    throw error;
  }
};

// Get complaints by category
export const getComplaintsByCategory = async (category) => {
  try {
    const q = query(
      collection(db, 'complaints'),
      where('category', '==', category),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const complaints = [];
    querySnapshot.forEach((doc) => {
      complaints.push({ id: doc.id, ...doc.data() });
    });
    return complaints;
  } catch (error) {
    console.error('Error getting complaints by category:', error);
    throw error;
  }
};

// Get complaints by status
export const getComplaintsByStatus = async (status) => {
  try {
    const q = query(
      collection(db, 'complaints'),
      where('status', '==', status),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const complaints = [];
    querySnapshot.forEach((doc) => {
      complaints.push({ id: doc.id, ...doc.data() });
    });
    return complaints;
  } catch (error) {
    console.error('Error getting complaints by status:', error);
    throw error;
  }
};

// Add a new alert
export const addAlert = async (alert) => {
  try {
    const docRef = await addDoc(collection(db, 'alerts'), {
      ...alert,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    });
    console.log('Alert added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding alert:', error);
    throw error;
  }
};

// Get all alerts
export const getAlerts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'alerts'));
    const alerts = [];
    querySnapshot.forEach((doc) => {
      alerts.push({ id: doc.id, ...doc.data() });
    });
    return alerts;
  } catch (error) {
    console.error('Error getting alerts:', error);
    throw error;
  }
};

// Real-time listener for complaints
export const subscribeToComplaints = (callback) => {
  const q = query(collection(db, 'complaints'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (querySnapshot) => {
    const complaints = [];
    querySnapshot.forEach((doc) => {
      complaints.push({ id: doc.id, ...doc.data() });
    });
    callback(complaints);
  });
};

// Real-time listener for alerts
export const subscribeToAlerts = (callback) => {
  const q = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (querySnapshot) => {
    const alerts = [];
    querySnapshot.forEach((doc) => {
      alerts.push({ id: doc.id, ...doc.data() });
    });
    callback(alerts);
  });
}; 