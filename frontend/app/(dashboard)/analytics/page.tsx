'use client';

import { useState } from 'react';
import { Send, Download, Sparkles, TrendingUp } from 'lucide-react';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#ffffff', margin: '0 0 4px 0' }}>Analytics</h2>
        <p style={{ fontSize: '13px', color: 'rgba(6, 182, 212, 0.7)', margin: 0 }}>Ask AI anything about your data</p>
      </div>

      {/* Query Input Section */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 27, 75, 0.8))',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(6, 182, 212, 0.2)',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} style={{ color: '#8b5cf6' }} />
          Ask AI Assistant
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Input Field */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="E.g. How many leads this month? What's the conversion rate?"
              disabled={isPending}
              style={{
                flex: 1,
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.3s',
                backdropFilter: 'blur(10px)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <button
              type="submit"
              disabled={isPending || !query.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isPending || !query.trim() ? 'not-allowed' : 'pointer',
                opacity: isPending || !query.trim() ? 0.6 : 1,
                transition: 'all 0.3s',
                boxShadow: '0 10px 30px rgba(6, 182, 212, 0.3)',
              }}
              onMouseEnter={(e) => {
                if (!isPending && query.trim()) {
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(6, 182, 212, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(6, 182, 212, 0.3)';
              }}
            >
              <Send size={16} />
              {isPending ? 'Analyzing...' : 'Ask'}
            </button>
          </div>

          {/* Suggested Queries */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {suggestedQueries.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setQuery(q);
                  analyzeQuery({ queryText: q });
                }}
                style={{
                  borderRadius: '20px',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  padding: '8px 16px',
                  fontSize: '12px',
                  color: 'rgba(6, 182, 212, 0.8)',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
                  e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Placeholder Section - When no query run yet */}
      {!result && !isPending && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 27, 75, 0.8))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(168, 85, 247, 0.2))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <TrendingUp size={40} style={{ color: '#06b6d4' }} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', margin: '0 0 8px 0' }}>No Analysis Yet</h3>
          <p style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.6)', margin: 0 }}>
            Ask a question about your data to get started. Try one of the suggested queries above!
          </p>
        </div>
      )}

      {/* Results Section */}
      {isPending && <LoadingSpinner message="Analyzing your query..." />}

      {result && !isPending && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Results Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 27, 75, 0.8))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff', margin: 0 }}>Query Results</h3>
              <button style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                color: '#06b6d4',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
                e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)';
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
              }}
              >
                <Download size={16} />
                Export
              </button>
            </div>
            <p style={{ fontSize: '13px', color: '#e2e8f0', margin: '0 0 12px 0' }}>
              {result.explanation}
            </p>
            <p style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.5)', margin: 0 }}>
              Execution time: {result.executionMs}ms
            </p>
          </div>

          {/* Insights Grid */}
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} style={{ color: '#22c55e' }} />
              Insights
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '12px',
            }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '12px',
                padding: '16px',
              }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#60a5fa', margin: '0 0 8px 0' }}>Insight 1</p>
                <p style={{ fontSize: '13px', color: '#e2e8f0', margin: 0 }}>
                  Your most active lead source is WhatsApp with 45% of total inquiries.
                </p>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                borderRadius: '12px',
                padding: '16px',
              }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#86efac', margin: '0 0 8px 0' }}>Insight 2</p>
                <p style={{ fontSize: '13px', color: '#e2e8f0', margin: 0 }}>
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
