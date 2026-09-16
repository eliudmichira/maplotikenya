import React, { useEffect } from 'react'
import { propertiesAPI } from '../lib/firebaseAPI'
import { useQuery } from "@tanstack/react-query";

export const useProperties = (params = {}) => {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["allProperties", params],
        queryFn: () => propertiesAPI.getAll(params),
        retry: 2,
        retryDelay: 1500,
        staleTime: 10 * 60 * 1000, // 10 minutes - listings don't change every second
        gcTime: 20 * 60 * 1000,    // 20 minutes in cache
        refetchOnWindowFocus: false,
        refetchOnMount: false,      // Don't re-fetch if data is still fresh in cache
        refetchOnReconnect: false,
    });

    // Only log errors - not on every successful render (was spamming the console)
    if (isError && import.meta.env.DEV) {
        console.error('useProperties error:', isError);
    }

    return {
        data,
        isLoading,
        isError,
        refetch
    }
}

export const useProperty = (id) => {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['property', id],
        queryFn: () => propertiesAPI.getById(id),
        enabled: !!id,
        staleTime: 10 * 60 * 1000,
        gcTime: 20 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    return {
        data,
        isLoading,
        isError,
        refetch
    }
}

// New hook for featured properties
export const useFeaturedProperties = (limit = 6) => {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['featuredProperties', limit],
        queryFn: () => propertiesAPI.getFeatured(limit),
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 20 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    });

    return {
        data,
        isLoading,
        isError,
        refetch
    }
}


// export default useProperties;
