'use client';

import { useMutation } from '@tanstack/react-query';
import type { AnalyticsQuery, AnalyticsResult } from '@/types/analytics';
import api from '@/lib/api';

export function useAnalyticsQuery() {
  return useMutation({
    mutationFn: async (query: AnalyticsQuery) => {
      const res = await api.post<AnalyticsResult>('/api/v1/analytics/query', query);
      return res.data;
    },
  });
}
