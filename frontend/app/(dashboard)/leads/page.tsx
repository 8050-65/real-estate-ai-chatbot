'use client';

import { useState } from 'react';
import { Plus, Search, Phone, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatDate } from '@/lib/utils';
import { DUMMY_LEADS } from '@/lib/dummy-data';

export default function LeadsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useLeads(page, 10, search);
  const { logLeadSearch } = useActivityLogger();

  if (isLoading) {
    return <LoadingSpinner message="Loading leads..." />;
  }

  // Use demo data if API returns empty results
  const leads = data?.content && data.content.length > 0 ? data.content : DUMMY_LEADS;
  const totalElements = data?.totalElements && data.totalElements > 0 ? data.totalElements : DUMMY_LEADS.length;

  if (!data?.content?.length) {
    console.log('[Leads] Using demo mode: showing', leads.length, 'demo leads');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header and Search */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#ffffff', margin: '0 0 4px 0' }}>Leads</h2>
            <p style={{ fontSize: '13px', color: 'rgba(6, 182, 212, 0.7)', margin: 0 }}>Manage and track your leads</p>
          </div>
          <button style={{
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
            cursor: 'pointer',
            transition: 'all 0.3s',
            boxShadow: '0 10px 30px rgba(6, 182, 212, 0.3)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 15px 40px rgba(6, 182, 212, 0.5)')}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 10px 30px rgba(6, 182, 212, 0.3)')}
          >
            <Plus size={18} />
            Add Lead
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(6, 182, 212, 0.5)',
          }} />
          <input
            type="search"
            placeholder="Search leads by name, phone, or email..."
            value={search}
            onChange={(e) => {
              const searchTerm = e.target.value;
              setSearch(searchTerm);
              setPage(1);
              if (searchTerm.trim()) {
                const resultsCount = data?.totalElements || 0;
                logLeadSearch(searchTerm, resultsCount);
              }
            }}
            style={{
              width: '100%',
              height: '44px',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              borderRadius: '12px',
              paddingLeft: '44px',
              paddingRight: '14px',
              color: '#ffffff',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.3s',
              backdropFilter: 'blur(10px)',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
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
        </div>
      </div>

      {/* Leads Grid */}
      {leads.length > 0 ? (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}>
            {leads.map((lead: any) => (
              <div key={lead.id} style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 27, 75, 0.8))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                borderRadius: '16px',
                padding: '20px',
                transition: 'all 0.3s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(6, 182, 212, 0.2)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: '0 0 4px 0' }}>{lead.name}</h3>
                    <p style={{ fontSize: '12px', color: 'rgba(6, 182, 212, 0.7)', margin: 0 }}>Lead</p>
                  </div>
                  {(() => {
                    // Extract status name from object or use as string
                    const status = typeof lead.status === 'object' && lead.status?.displayName
                      ? lead.status.displayName
                      : (typeof lead.status === 'string' ? lead.status : 'New');
                    const statusStyles: Record<string, { bg: string; border: string; text: string }> = {
                      'Hot': { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.3)', text: '#ef4444' },
                      'New': { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 0.3)', text: '#22c55e' },
                      'Dropped': { bg: 'rgba(107, 114, 128, 0.2)', border: 'rgba(107, 114, 128, 0.3)', text: '#6b7280' },
                      'Pending': { bg: 'rgba(251, 146, 60, 0.2)', border: 'rgba(251, 146, 60, 0.3)', text: '#fb923c' },
                      'Meeting Scheduled': { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.3)', text: '#3b82f6' },
                    };
                    const style = statusStyles[status] || { bg: 'rgba(6, 182, 212, 0.2)', border: 'rgba(6, 182, 212, 0.3)', text: '#06b6d4' };
                    return (
                      <span style={{
                        display: 'inline-block',
                        background: style.bg,
                        border: `1px solid ${style.border}`,
                        color: style.text,
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}>
                        {status}
                      </span>
                    );
                  })()}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                  {lead.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Phone size={14} style={{ color: 'rgba(6, 182, 212, 0.5)' }} />
                      <span style={{ fontSize: '13px', color: '#e2e8f0' }}>{lead.phone}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Clock size={14} style={{ color: 'rgba(6, 182, 212, 0.5)' }} />
                    <span style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.6)' }}>
                      {lead.createdAt ? formatDate(lead.createdAt) : '-'}
                    </span>
                  </div>
                </div>

                <button style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  color: '#06b6d4',
                  borderRadius: '8px',
                  padding: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(6, 182, 212, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)';
                }}
                >
                  View Details
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px' }}>
            <p style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.6)', margin: 0 }}>
              Showing {leads.length} of {totalElements} leads
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  color: page === 1 ? 'rgba(226, 232, 240, 0.3)' : '#ffffff',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  opacity: page === 1 ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                Previous
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', fontSize: '13px', color: 'rgba(226, 232, 240, 0.7)' }}>
                Page {page}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!data?.hasNext}
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  color: !data?.hasNext ? 'rgba(226, 232, 240, 0.3)' : '#ffffff',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: !data?.hasNext ? 'not-allowed' : 'pointer',
                  opacity: !data?.hasNext ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 27, 75, 0.8))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          borderRadius: '16px',
          padding: '60px 24px',
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
            <Sparkles size={40} style={{ color: '#06b6d4' }} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', margin: '0 0 8px 0' }}>No leads yet</h3>
          <p style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.6)', margin: '0 0 24px 0', maxWidth: '300px', marginLeft: 'auto', marginRight: 'auto' }}>
            Start by adding your first lead. The AI assistant will help you organize and track your leads efficiently.
          </p>
          <button style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s',
            boxShadow: '0 10px 30px rgba(6, 182, 212, 0.3)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 15px 40px rgba(6, 182, 212, 0.5)')}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 10px 30px rgba(6, 182, 212, 0.3)')}
          >
            <Plus size={18} />
            Add Your First Lead
          </button>
        </div>
      )}

      <style>{`
        input[type="search"]::placeholder {
          color: rgba(6, 182, 212, 0.5);
          opacity: 1;
        }
        input[type="search"]::-webkit-input-placeholder {
          color: rgba(6, 182, 212, 0.5);
          opacity: 1;
        }
        input[type="search"]::-moz-placeholder {
          color: rgba(6, 182, 212, 0.5);
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
