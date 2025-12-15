/**
 * Database Integration Test & Verification
 * This file helps verify that the app is properly connected to the populated database
 */

import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from './firebase';
import { Vendor, Booking, Slot } from '../types';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';
import axios from 'axios';

/**
 * Test database connection and verify populated data
 */
export async function testDatabaseConnection(): Promise<{
  success: boolean;
  vendors: number;
  bookings: number;
  slots: number;
  error?: string;
}> {
  try {
    // Test vendors collection
    const vendorsSnapshot = await getDocs(collection(db, 'vendors'));
    const vendorsCount = vendorsSnapshot.size;
    
    // Test bookings collection
    const bookingsSnapshot = await getDocs(query(collection(db, 'bookings'), limit(10)));
    const bookingsCount = bookingsSnapshot.size;
    
    // Test slots collection
    const slotsSnapshot = await getDocs(query(collection(db, 'slots'), limit(10)));
    const slotsCount = slotsSnapshot.size;
    
    console.log('✅ Database Connection Test Results:');
    console.log(`   Vendors: ${vendorsCount}`);
    console.log(`   Bookings: ${bookingsCount}`);
    console.log(`   Slots: ${slotsCount}`);
    
    return {
      success: true,
      vendors: vendorsCount,
      bookings: bookingsCount,
      slots: slotsCount,
    };
  } catch (error: any) {
    console.error('❌ Database connection test failed:', error);
    return {
      success: false,
      vendors: 0,
      bookings: 0,
      slots: 0,
      error: error.message,
    };
  }
}

/**
 * Get sample vendors to verify data is accessible
 */
export async function getSampleVendors(count: number = 5): Promise<Vendor[]> {
  try {
    const vendorsSnapshot = await getDocs(
      query(collection(db, 'vendors'), limit(count))
    );
    
    return vendorsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Vendor));
  } catch (error) {
    console.error('Error getting sample vendors:', error);
    return [];
  }
}

/**
 * Verify backend API connection
 */
export async function testBackendConnection(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const response = await axios.get(buildApiUrl(API_ENDPOINTS.health), {
      timeout: 5000,
    });
    
    return {
      success: true,
      message: 'Backend API is reachable',
    };
  } catch (error: any) {
    console.warn('Backend API not reachable:', error.message);
    return {
      success: false,
      error: error.message || 'Backend API not available',
      message: 'App will use Firebase directly',
    };
  }
}

/**
 * Comprehensive integration test
 */
export async function runIntegrationTest(): Promise<void> {
  console.log('🧪 Running Integration Tests...\n');
  
  // Test database connection
  const dbTest = await testDatabaseConnection();
  if (dbTest.success) {
    console.log('✅ Database connection successful');
  } else {
    console.error('❌ Database connection failed:', dbTest.error);
  }
  
  // Test backend API
  const apiTest = await testBackendConnection();
  if (apiTest.success) {
    console.log('✅ Backend API connection successful');
  } else {
    console.warn('⚠️ Backend API not available:', apiTest.message);
  }
  
  // Get sample data
  const sampleVendors = await getSampleVendors(3);
  if (sampleVendors.length > 0) {
    console.log('✅ Sample vendors loaded:', sampleVendors.length);
    sampleVendors.forEach(v => {
      console.log(`   - ${v.business_name} (${v.category})`);
    });
  } else {
    console.warn('⚠️ No vendors found in database');
  }
  
  console.log('\n✨ Integration test complete!');
}

