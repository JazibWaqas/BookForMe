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
