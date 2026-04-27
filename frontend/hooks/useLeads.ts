'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Lead } from '@/types/lead';
import type { PageResponse } from '@/types/api';
import api from '@/lib/api';

export function useLeads(page: number = 1, size: number = 10, search?: string) {
  return useQuery({
    queryKey: ['leads', page, size, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page - 1),
        size: String(size),
      });
      if (search) params.append('search', search);
      const res = await api.get<PageResponse<Lead>>(`/api/v1/leads?${params}`);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useLeadDetail(id: string) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const res = await api.get<Lead>(`/api/v1/leads/${id}`);
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
      const res = await api.post<Lead>('/api/v1/leads', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
