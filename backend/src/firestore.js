// backend/src/firestore.js
import { db } from './firebaseconfig.js';
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
  serverTimestamp 
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
    const complaints = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return complaints;
  } catch (error) {
    console.error('Error fetching complaints:', error);
    throw error;
  }
};

// Get a specific complaint by ID
export const getComplaintById = async (complaintId) => {
  try {
    const docRef = doc(db, 'complaints', complaintId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error('Complaint not found');
    }
  } catch (error) {
    console.error('Error fetching complaint:', error);
    throw error;
  }
};

// Update a complaint
export const updateComplaint = async (complaintId, updates) => {
  try {
    const docRef = doc(db, 'complaints', complaintId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    console.log('Complaint updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating complaint:', error);
    throw error;
  }
};

// Delete a complaint
export const deleteComplaint = async (complaintId) => {
  try {
    const docRef = doc(db, 'complaints', complaintId);
    await deleteDoc(docRef);
    console.log('Complaint deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting complaint:', error);
    throw error;
  }
};

// Get complaints by user ID
export const getComplaintsByUser = async (userId) => {
  try {
    const q = query(
      collection(db, 'complaints'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const complaints = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return complaints;
  } catch (error) {
    console.error('Error fetching user complaints:', error);
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
    const complaints = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return complaints;
  } catch (error) {
    console.error('Error fetching complaints by category:', error);
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
    const complaints = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return complaints;
  } catch (error) {
    console.error('Error fetching complaints by status:', error);
    throw error;
  }
};

// Add an alert
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
    const alerts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return alerts;
  } catch (error) {
    console.error('Error fetching alerts:', error);
    throw error;
  }
};