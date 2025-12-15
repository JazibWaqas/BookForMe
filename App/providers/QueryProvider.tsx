import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure QueryClient with smart defaults
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Cache data for 5 minutes before considering it stale
            staleTime: 5 * 60 * 1000,
            // Keep unused data in cache for 24 hours (persisted to AsyncStorage)
            gcTime: 24 * 60 * 60 * 1000,
            // Retry failed requests 2 times
            retry: 2,
            // Don't refetch on window focus (mobile doesn't need this)
            refetchOnWindowFocus: false,
            // Refetch on reconnect to get fresh data
            refetchOnReconnect: true,
        },
    },
});

// Create AsyncStorage persister - data survives app restarts
const persister = createAsyncStoragePersister({
    storage: AsyncStorage,
    // Throttle writes to AsyncStorage to avoid performance issues
    throttleTime: 1000,
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
                persister,
                // Maximum age of persisted data (24 hours)
                maxAge: 24 * 60 * 60 * 1000,
                // Dehydrate options - what to persist
                dehydrateOptions: {
                    // Don't persist queries that are currently loading
                    shouldDehydrateQuery: (query) => {
                        return query.state.status === 'success';
                    },
                },
            }}
        >
            {children}
        </PersistQueryClientProvider>
    );
}

export { queryClient };
