'use client';

import { useMutation } from '@tanstack/react-query';
import type { AnalyticsQuery, AnalyticsResult } from '@/types/analytics';
import api from '@/lib/api';

export function useAnalyticsQuery() {
  return useMutation({
    mutationFn: async (data: AnalyticsQuery) => {
      // Convert queryText to query field expected by backend
      const payload = { query: data.queryText };
      const res = await api.post<AnalyticsResult>('/api/v1/analytics/nlq', payload);
      return res.data;
    },
  });
}
