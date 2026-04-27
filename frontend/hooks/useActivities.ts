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
      const params = new URLSearchParams({
        page: String(page - 1),
        size: String(size),
      });
      if (status) params.append('status', status);
      const res = await api.get<PageResponse<Activity>>(
        `/api/v1/activities?${params}`,
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Activity>) => {
      const res = await api.post<Activity>('/api/v1/activities', data);
      return res.data;
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
      const res = await api.put<Activity>(`/api/v1/activities/${id}/status`, {
        status,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}
