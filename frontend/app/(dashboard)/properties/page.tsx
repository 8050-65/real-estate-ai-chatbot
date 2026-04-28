'use client';

import { useState } from 'react';
import { useProperties } from '@/hooks/useProperties';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatCurrency } from '@/lib/utils';
import { Building2, Maximize2, Sparkles, Filter } from 'lucide-react';
import { DUMMY_PROPERTIES } from '@/lib/dummy-data';

export default function PropertiesPage() {
  const [page, setPage] = useState(1);
  const [selectedBhk, setSelectedBhk] = useState<string>('');
  const { data, isLoading } = useProperties(page, 12);

  if (isLoading) {
    return <LoadingSpinner message="Loading properties..." />;
  }

  // Use demo data if API returns empty results
  const properties = data?.content && data.content.length > 0 ? data.content : DUMMY_PROPERTIES;
  const filteredProperties = selectedBhk
    ? properties.filter(prop => prop.bhk === selectedBhk)
    : properties;

  if (!data?.content?.length) {
    console.log('[Properties] Using demo mode: showing', properties.length, 'demo properties');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header and Filters */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#ffffff', margin: '0 0 4px 0' }}>Properties</h2>
        <p style={{ fontSize: '13px', color: 'rgba(6, 182, 212, 0.7)', margin: 0 }}>Discover and manage available properties</p>
      </div>

      {/* Filter Section */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setSelectedBhk('')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: !selectedBhk ? '2px solid #06b6d4' : '1px solid rgba(6, 182, 212, 0.2)',
            background: !selectedBhk ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: '#06b6d4',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Filter size={14} />
          All
        </button>
        {['1', '2', '3', '4', '5'].map((bhk) => (
          <button
            key={bhk}
            onClick={() => setSelectedBhk(bhk)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: selectedBhk === bhk ? '2px solid #06b6d4' : '1px solid rgba(6, 182, 212, 0.2)',
              background: selectedBhk === bhk ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              color: selectedBhk === bhk ? '#06b6d4' : '#e2e8f0',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = selectedBhk === bhk ? 'rgb(6, 182, 212)' : 'rgba(6, 182, 212, 0.2)';
            }}
          >
            {bhk} BHK
          </button>
        ))}
      </div>

      {filteredProperties.length > 0 ? (
        <>
          {/* Properties Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {filteredProperties.map((prop) => (
              <div key={prop.id} style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 27, 75, 0.8))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                borderRadius: '16px',
                overflow: 'hidden',
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
                {/* Property Image Placeholder */}
                <div style={{
                  width: '100%',
                  height: '160px',
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(168, 85, 247, 0.1))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: '1px solid rgba(6, 182, 212, 0.2)',
                }}>
                  <Building2 size={40} style={{ color: 'rgba(6, 182, 212, 0.3)' }} />
                </div>

                {/* Property Details */}
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff', margin: '0 0 4px 0' }}>
                        {prop.bhk} BHK
                      </h3>
                      <p style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.6)', margin: 0 }}>Property</p>
                    </div>
                    <span style={{
                      display: 'inline-block',
                      background: 'rgba(34, 197, 94, 0.2)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      color: '#86efac',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: '600',
                    }}>
                      {prop.status}
                    </span>
                  </div>

                  <p style={{ fontSize: '16px', fontWeight: '700', color: '#06b6d4', margin: '0 0 12px 0' }}>
                    {formatCurrency(prop.price)}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Maximize2 size={14} style={{ color: 'rgba(6, 182, 212, 0.5)' }} />
                      <span style={{ fontSize: '12px', color: '#e2e8f0' }}>{prop.area} sqft</span>
                    </div>
                  </div>

                  <button style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(168, 85, 247, 0.1))',
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
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', paddingTop: '16px' }}>
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
              }}
            >
              Previous
            </button>
            <span style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.7)' }}>Page {page}</span>
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
              }}
            >
              Next
            </button>
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
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', margin: '0 0 8px 0' }}>No properties available</h3>
          <p style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.6)', margin: 0, maxWidth: '300px', marginLeft: 'auto', marginRight: 'auto' }}>
            Check back soon for new properties. The AI assistant is constantly discovering great opportunities for you.
          </p>
        </div>
      )}
    </div>
  );
}
