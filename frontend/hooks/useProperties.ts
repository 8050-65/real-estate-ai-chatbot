'use client';

import { useQuery } from '@tanstack/react-query';
import type { Property, Project } from '@/types/property';
import type { PageResponse } from '@/types/api';
import api from '@/lib/api';

export function useProperties(
  page: number = 1,
  size: number = 12,
  search?: string,
) {
  return useQuery({
    queryKey: ['properties', page, size, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page - 1),
        size: String(size),
      });
      if (search) params.append('search', search);
      const res = await api.get<PageResponse<Property>>(
        `/api/v1/properties?${params}`,
      );
      return res.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get<{ data: Project[] }>('/api/v1/projects');
      return res.data.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}
