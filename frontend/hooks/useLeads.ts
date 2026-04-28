'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Lead } from '@/types/lead';
import type { PageResponse } from '@/types/api';
import api from '@/lib/api';
import fastApiClient from '@/lib/fastapi-client';

export function useLeads(page: number = 1, size: number = 10, search?: string) {
  return useQuery({
    queryKey: ['leads', page, size, search],
    queryFn: async () => {
      try {
        // Call FastAPI Leadrat connector service
        const params = new URLSearchParams({
          page: String(page),
          size: String(size),
        });
        if (search) params.append('search_term', search);

        const res = await fastApiClient.get(`/api/v1/leadrat/leads/search?${params}`);

        // Transform Leadrat response to PageResponse format
        const data = res.data;
        return {
          content: data.data || [],
          totalElements: data.total || 0,
          totalPages: Math.ceil((data.total || 0) / size),
          currentPage: page,
          hasNext: page * size < (data.total || 0),
          hasPrevious: page > 1,
        };
      } catch (error: any) {
        console.error('[useLeads] Failed to fetch leads', error);
        // Return empty result on error
        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
          currentPage: page,
          hasNext: false,
          hasPrevious: false,
        };
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useLeadDetail(id: string) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const res = await api.get<Lead>(`/leads/${id}`);
      return res.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Lead>) => {
      const res = await api.post<Lead>('/leads', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
