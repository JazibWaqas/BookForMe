import { useState, useEffect } from 'react';
import { api, mockData } from '../services/api';
import type { Booking, BookingRequest } from '../types';

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual API call
      // const data = await api.bookings.getMyBookings();
      // setBookings(data);
      
      // Using mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      setBookings(mockData.bookings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return { bookings, loading, error, refetch: fetchBookings };
}

export function useCreateBooking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBooking = async (data: BookingRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual API call
      // const response = await api.bookings.create(data);
      // return response;
      
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        booking_id: Math.floor(Math.random() * 10000),
        message: 'Booking confirmed successfully!',
        booking: {
          id: Math.floor(Math.random() * 10000),
          ...data,
          slot_id: 1,
          source: 'app' as const,
          status: 'confirmed' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create booking';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { createBooking, loading, error };
}
