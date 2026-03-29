import { useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
 * The server pushes an event the moment any slot changes in Firestore —
 * no polling needed. Reconnects automatically on drop.
 */
export function useVendorStream(vendorId: string | null, options: Options) {
  const { onSlotChange, onConnected, enabled = true } = options;
  const abortRef = useRef<AbortController | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const onSlotChangeRef = useRef(onSlotChange);
  onSlotChangeRef.current = onSlotChange;
  const onConnectedRef = useRef(onConnected);
  onConnectedRef.current = onConnected;

  const connect = useCallback(async () => {
    if (!vendorId || !mountedRef.current) return;

    const token = await AsyncStorage.getItem('authToken');
    if (!token || !mountedRef.current) return;

    const url = `${API_BASE_URL}${API_ENDPOINTS.vendors.stream(vendorId)}`;
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`SSE connection failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (mountedRef.current) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        let eventName = '';
        let dataLine = '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            dataLine = line.slice(5).trim();
          } else if (line === '') {
            // End of one SSE message
            if (eventName === 'connected') {
              onConnectedRef.current?.();
            } else if (eventName === 'slot_change' && dataLine) {
              try {
                const payload = JSON.parse(dataLine) as SlotChangeEvent;
                onSlotChangeRef.current(payload);
              } catch {
                // malformed json — skip
              }
            }
            eventName = '';
            dataLine = '';
          }
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      // Connection dropped — retry after 3s
      if (mountedRef.current) {
        retryRef.current = setTimeout(connect, 3000);
      }
    }
  }, [vendorId]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled && vendorId) connect();

    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [vendorId, enabled, connect]);
}
