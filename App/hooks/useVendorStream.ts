import { useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EventSource from 'react-native-sse';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

export type SlotChangeEvent = {
  type: 'slot_added' | 'slot_updated' | 'slot_removed';
  slot_id: string;
  slot: Record<string, any>;
};

type Options = {
  onSlotChange: (event: SlotChangeEvent) => void;
  onConnected?: () => void;
  enabled?: boolean;
};

/**
 * Opens a persistent SSE connection to the backend for a vendor.
 * Uses react-native-sse which works correctly on iOS and Android.
 * The server pushes an event the instant any slot changes in Firestore.
 * Reconnects automatically on drop.
 */
export function useVendorStream(vendorId: string | null, options: Options) {
  const { onSlotChange, onConnected, enabled = true } = options;
  const esRef = useRef<InstanceType<typeof EventSource> | null>(null);
  const mountedRef = useRef(true);

  const onSlotChangeRef = useRef(onSlotChange);
  onSlotChangeRef.current = onSlotChange;
  const onConnectedRef = useRef(onConnected);
  onConnectedRef.current = onConnected;

  const connect = useCallback(async () => {
    if (!vendorId || !mountedRef.current) return;

    const token = await AsyncStorage.getItem('authToken');
    if (!token || !mountedRef.current) return;

    // Close any existing connection before opening a new one
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const url = `${API_BASE_URL}${API_ENDPOINTS.vendors.stream(vendorId)}`;

    const es = new EventSource(url, {
      headers: { Authorization: `Bearer ${token}` },
      // Automatically reconnect on drop
      withCredentials: false,
    });

    esRef.current = es;

    es.addEventListener('connected', () => {
      onConnectedRef.current?.();
    });

    es.addEventListener('slot_change', (event: any) => {
      if (!event.data) return;
      try {
        const payload = JSON.parse(event.data) as SlotChangeEvent;
        onSlotChangeRef.current(payload);
      } catch {
        // malformed json — skip
      }
    });

    es.addEventListener('error', (event: any) => {
      // react-native-sse handles reconnection internally when pollingInterval is set
      // Log for debugging only
      console.warn('SSE error:', event?.message || 'connection error');
    });
  }, [vendorId]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled && vendorId) connect();

    return () => {
      mountedRef.current = false;
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [vendorId, enabled, connect]);
}
