import { useState, useEffect } from 'react';
import { api, mockData } from '../services/api';
import type { Vendor, SearchParams } from '../types';

export function useVendors(params?: SearchParams) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // TODO: Replace with actual API call when backend is ready
        // const response = await api.vendors.list(params);
        // setVendors(response.vendors);
        
        // Using mock data for now
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        setVendors(mockData.vendors);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch vendors');
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, [params?.query, params?.filters?.category, params?.filters?.location]);

  return { vendors, loading, error };
}

export function useVendor(id: number | null) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setVendor(null);
      setLoading(false);
      return;
    }

    const fetchVendor = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // TODO: Replace with actual API call
        // const data = await api.vendors.getById(id);
        // setVendor(data);
        
        // Using mock data
        await new Promise(resolve => setTimeout(resolve, 300));
        const found = mockData.vendors.find(v => v.id === id);
        setVendor(found || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch vendor');
      } finally {
        setLoading(false);
      }
    };

    fetchVendor();
  }, [id]);

  return { vendor, loading, error };
}
