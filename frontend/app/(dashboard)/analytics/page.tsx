'use client';

import { useState } from 'react';
import { Send, Download } from 'lucide-react';
import { useAnalyticsQuery } from '@/hooks/useAnalytics';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function AnalyticsPage() {
  const [query, setQuery] = useState('');
  const { mutate: analyzeQuery, isPending, data: result } = useAnalyticsQuery();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      analyzeQuery({ queryText: query });
    }
  };

  const suggestedQueries = [
    'How many leads did we get this month?',
    'Which project has the most inquiries?',
    'Show me conversion rate by RM',
    'Properties available under 80 lakhs',
  ];

  return (
    <div className="space-y-6">
      {/* NLQ Input */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Ask anything about your data</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="E.g. How many leads this month? What's the conversion rate?"
              className="flex-1 rounded-lg border border-input bg-background px-4 py-3"
              disabled={isPending}
            />
            <button
              type="submit"
              disabled={isPending || !query.trim()}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-primary-foreground disabled:opacity-50"
            >
              {isPending ? 'Analyzing...' : <><Send className="h-5 w-5" />Ask</>}
            </button>
          </div>

          {/* Suggested Queries */}
          <div className="flex flex-wrap gap-2">
            {suggestedQueries.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setQuery(q);
                  analyzeQuery({ queryText: q });
                }}
                className="rounded-full border border-input px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary"
              >
                {q}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Results */}
      {isPending && <LoadingSpinner message="Analyzing your query..." />}

      {result && !isPending && (
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Results</h3>
              <button className="flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm hover:bg-muted">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
            <div className="text-muted-foreground">
              <p className="mb-4">{result.explanation}</p>
              <p className="text-xs text-muted-foreground">
                Execution time: {result.executionMs}ms
              </p>
            </div>
          </div>

          {/* Insights */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Insights</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-700">Insight 1</p>
                <p className="mt-2 text-sm text-blue-600">
                  Your most active lead source is WhatsApp with 45% of total inquiries.
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm font-medium text-green-700">Insight 2</p>
                <p className="mt-2 text-sm text-green-600">
                  Conversion rate improved by 12% compared to last month.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
