export type ChartType = 'table' | 'bar' | 'line' | 'pie' | 'funnel' | 'kpi';

export interface AnalyticsQuery {
  queryText: string;
  filters?: Record<string, unknown>;
}

export interface AnalyticsResult {
  queryText: string;
  resultType: ChartType;
  data: unknown;
  explanation: string;
  executionMs: number;
}
