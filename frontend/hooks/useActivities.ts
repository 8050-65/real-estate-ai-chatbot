'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Activity } from '@/types/activity';
import type { PageResponse } from '@/types/api';
import api from '@/lib/api';

interface UseActivitiesParams {
  page?: number;
  size?: number;
  status?: string;
  tenantId?: string;
}

export function useActivities({
  page = 1,
  size = 10,
  status,
  tenantId,
}: UseActivitiesParams = {}) {
  return useQuery({
    queryKey: ['activities', page, size, status, tenantId],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          page: String(page - 1),
          size: String(size),
        });
        if (status) params.append('status', status);
        const res = await api.get<PageResponse<Activity>>(
          `/activities?${params}`,
        );
        return res.data;
      } catch (error: any) {
        // Gracefully handle Spring Boot unavailability (connection errors, network errors, etc.)
        const isConnectionError = !error.response || error.code === 'ECONNREFUSED' || error.message?.includes('ERR_');
        const is404 = error.response?.status === 404;

        if (isConnectionError || is404) {
          console.debug('[useActivities] Activities service unavailable, returning empty result');
          return {
            content: [],
            totalElements: 0,
            totalPages: 0,
            currentPage: page,
            hasNext: false,
            hasPrevious: page > 1,
          };
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Activity>) => {
      try {
        const res = await api.post<Activity>('/activities', data);
        return res.data;
      } catch (error: any) {
        if (error.response?.status === 404 || error.code === 'ECONNREFUSED') {
          console.debug('[useCreateActivity] Activities service unavailable');
          throw new Error('Activities service is currently unavailable. Please try again later.');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useUpdateActivityStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: string;
    }) => {
      try {
        const res = await api.put<Activity>(`/activities/${id}/status`, {
          status,
        });
        return res.data;
      } catch (error: any) {
        if (error.response?.status === 404 || error.code === 'ECONNREFUSED') {
          console.debug('[useUpdateActivityStatus] Activities service unavailable');
          throw new Error('Activities service is currently unavailable. Please try again later.');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}
