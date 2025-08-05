// Complaints Context for React Native app
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  addComplaint, 
  getComplaints, 
  getComplaintById, 
  updateComplaint, 
  deleteComplaint,
  getComplaintsByUser,
  getComplaintsByCategory,
  getComplaintsByStatus,
  subscribeToComplaints
} from '../services/firestoreService';
import { useAuth } from './AuthContext';

const ComplaintsContext = createContext();

export const useComplaints = () => {
  const context = useContext(ComplaintsContext);
  if (!context) {
    throw new Error('useComplaints must be used within a ComplaintsProvider');
  }
  return context;
};

export const ComplaintsProvider = ({ children }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Subscribe to real-time complaints updates
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToComplaints((updatedComplaints) => {
        setComplaints(updatedComplaints);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const createComplaint = async (complaintData) => {
    if (!user) {
      throw new Error('User must be authenticated to create a complaint');
    }

    setLoading(true);
    setError(null);
    
    try {
      const complaintWithUser = {
        ...complaintData,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || 'Anonymous',
      };
      
      const complaintId = await addComplaint(complaintWithUser);
      return complaintId;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedComplaints = await getComplaints();
      setComplaints(fetchedComplaints);
      return fetchedComplaints;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaintById = async (complaintId) => {
    setLoading(true);
    setError(null);
    
    try {
      const complaint = await getComplaintById(complaintId);
      return complaint;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateComplaintById = async (complaintId, updates) => {
    setLoading(true);
    setError(null);
    
    try {
      await updateComplaint(complaintId, updates);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteComplaintById = async (complaintId) => {
    setLoading(true);
    setError(null);
    
    try {
      await deleteComplaint(complaintId);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchUserComplaints = async () => {
    if (!user) {
      throw new Error('User must be authenticated to fetch user complaints');
    }

    setLoading(true);
    setError(null);
    
    try {
      const userComplaints = await getComplaintsByUser(user.uid);
      return userComplaints;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaintsByCategory = async (category) => {
    setLoading(true);
    setError(null);
    
    try {
      const categoryComplaints = await getComplaintsByCategory(category);
      return categoryComplaints;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaintsByStatus = async (status) => {
    setLoading(true);
    setError(null);
    
    try {
      const statusComplaints = await getComplaintsByStatus(status);
      return statusComplaints;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    complaints,
    loading,
    error,
    createComplaint,
    fetchComplaints,
    fetchComplaintById,
    updateComplaintById,
    deleteComplaintById,
    fetchUserComplaints,
    fetchComplaintsByCategory,
    fetchComplaintsByStatus,
    clearError,
  };

  return (
    <ComplaintsContext.Provider value={value}>
      {children}
    </ComplaintsContext.Provider>
  );
}; 