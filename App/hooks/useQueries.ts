import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, API_ENDPOINTS } from '../config/api';

// Query keys for consistent caching
export const queryKeys = {
    vendors: {
        all: ['vendors'] as const,
        bySport: (sport: string) => ['vendors', sport] as const,
        detail: (id: string) => ['vendors', id] as const,
    },
    slots: {
        all: ['slots'] as const,
        byVendor: (vendorId: string, date: string) => ['slots', vendorId, date] as const,
    },
};

// Hook to fetch all vendors
export function useVendors() {
    return useQuery({
        queryKey: queryKeys.vendors.all,
        queryFn: async () => {
            const response = await apiClient.get(API_ENDPOINTS.vendors.list);
            return response.data.vendors || [];
        },
    });
}

// Hook to fetch vendors by sport type
export function useVendorsBySport(sportType: string) {
    return useQuery({
        queryKey: queryKeys.vendors.bySport(sportType),
        queryFn: async () => {
            const response = await apiClient.get(API_ENDPOINTS.vendors.list, {
                params: { service_type: sportType, category: sportType },
            });
            return response.data.vendors || [];
        },
        // Only fetch if sportType is provided
        enabled: !!sportType,
    });
}

// Hook to fetch vendor details
export function useVendor(vendorId: string) {
    return useQuery({
        queryKey: queryKeys.vendors.detail(vendorId),
        queryFn: async () => {
            const response = await apiClient.get(API_ENDPOINTS.vendors.get(vendorId));
            return response.data.vendor;
        },
        enabled: !!vendorId,
    });
}

// Hook to fetch available slots
export function useAvailableSlots(vendorId: string, date: string) {
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: queryKeys.slots.byVendor(vendorId, date),
        queryFn: async () => {
            const response = await apiClient.get(
                API_ENDPOINTS.vendors.availability(vendorId),
                { params: { date } }
            );
            return response.data.available_slots || [];
        },
        enabled: !!vendorId && !!date,
    });
}

// Hook to prefetch vendor details (call this when user hovers/taps on vendor card)
export function usePrefetchVendor() {
    const queryClient = useQueryClient();

    return (vendorId: string) => {
        queryClient.prefetchQuery({
            queryKey: queryKeys.vendors.detail(vendorId),
            queryFn: async () => {
                const response = await apiClient.get(API_ENDPOINTS.vendors.get(vendorId));
                return response.data.vendor;
            },
        });
    };
}

// Hook to fetch current user profile
export function useCurrentUser() {
    return useQuery({
        queryKey: ['user', 'me'] as const,
        queryFn: async () => {
            const response = await apiClient.get(API_ENDPOINTS.auth.me);
            return response.data.user;
        },
        staleTime: 30 * 60 * 1000, // 30 minutes - user data rarely changes
        gcTime: 60 * 60 * 1000, // 1 hour
    });
}

// Hook to fetch user bookings
export function useUserBookings() {
    return useQuery({
        queryKey: ['bookings', 'user'] as const,
        queryFn: async () => {
            const response = await apiClient.get(API_ENDPOINTS.bookings.list);
            return response.data.bookings || [];
        },
        staleTime: 2 * 60 * 1000, // 2 minutes - use cache aggressively for speed
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
        refetchOnWindowFocus: false, // Don't auto-refetch on focus
    });
}

// Hook to fetch categories
export function useCategories() {
    return useQuery({
        queryKey: ['categories'] as const,
        queryFn: async () => {
            const response = await apiClient.get('/api/categories');
            return response.data.categories || [];
        },
        staleTime: 30 * 60 * 1000, // 30 minutes - categories don't change often
    });
}

// Hook to fetch available slots with smart refetching
export function useAvailableSlotsOptimized(vendorId: string, date: string, enabled: boolean = true, autoRefetch: boolean = true) {
    return useQuery({
        queryKey: queryKeys.slots.byVendor(vendorId, date),
        queryFn: async () => {
            const response = await apiClient.get(
                API_ENDPOINTS.vendors.availability(vendorId),
                { params: { date } }
            );
            
            // Group slots by resource
            const slots = response.data.available_slots || [];
            const resourceMap = new Map();
            
            slots.forEach((slot: any) => {
                const key = slot.resource_id;
                if (!resourceMap.has(key)) {
                    resourceMap.set(key, {
                        resource_id: slot.resource_id,
                        resource_name: slot.resource_name || `Court ${slot.resource_id}`,
                        service_id: slot.service_id,
                        service_name: slot.service_name || 'Court Rental',
                        slots: [],
                        availableCount: 0,
                    });
                }
                
                const group = resourceMap.get(key);
                group.slots.push({
                    id: slot.slot_id || slot.id,
                    slot_id: slot.slot_id || slot.id,
                    vendor_id: vendorId,
                    service_id: slot.service_id,
                    service_name: slot.service_name,
                    resource_id: slot.resource_id,
                    resource_name: slot.resource_name,
                    date: date,
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    price: slot.price,
                    status: slot.status || 'available',
                    price_tier_used: slot.price_tier_used,
                });
                
                if (slot.status === 'available') {
                    group.availableCount++;
                }
            });
            
            return Array.from(resourceMap.values());
        },
        enabled: enabled && !!vendorId && !!date,
        staleTime: 30 * 1000, // 30 seconds - slots change frequently
        refetchInterval: autoRefetch ? 45 * 1000 : false, // Only auto-refetch when not locked
        refetchOnWindowFocus: false, // Disable focus refetch to prevent interrupting user actions
    });
}