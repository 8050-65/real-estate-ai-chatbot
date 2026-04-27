'use client';

import { useState } from 'react';
import { Plus, CheckCircle, XCircle, Clock, Sparkles, Calendar } from 'lucide-react';
import { useActivities } from '@/hooks/useActivities';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatDateTime } from '@/lib/utils';

const statusConfig: Record<string, { bgColor: string; textColor: string; borderColor: string }> = {
  scheduled: { bgColor: 'rgba(59, 130, 246, 0.1)', textColor: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.3)' },
  confirmed: { bgColor: 'rgba(34, 197, 94, 0.1)', textColor: '#22c55e', borderColor: 'rgba(34, 197, 94, 0.3)' },
  completed: { bgColor: 'rgba(34, 197, 94, 0.1)', textColor: '#22c55e', borderColor: 'rgba(34, 197, 94, 0.3)' },
  cancelled: { bgColor: 'rgba(239, 68, 68, 0.1)', textColor: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' },
  no_show: { bgColor: 'rgba(239, 68, 68, 0.1)', textColor: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' },
};

const statusIcons: Record<string, typeof CheckCircle> = {
  completed: CheckCircle,
  cancelled: XCircle,
  scheduled: Clock,
  confirmed: Clock,
  no_show: XCircle,
};

export default function VisitsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>();
  const { data, isLoading } = useActivities({
    page,
    size: 10,
    status: statusFilter,
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading visits..." />;
  }

  const activities = data?.content || [];
  const statuses = ['scheduled', 'confirmed', 'completed', 'cancelled'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#ffffff', margin: '0 0 4px 0' }}>Visits & Meetings</h2>
        <p style={{ fontSize: '13px', color: 'rgba(6, 182, 212, 0.7)', margin: 0 }}>Schedule and manage property visits</p>
      </div>

      {/* Filters and Action */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          {/* Status Filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setStatusFilter(undefined);
                setPage(1);
              }}
              style={{
                background: !statusFilter ? 'linear-gradient(135deg, #06b6d4, #8b5cf6)' : 'rgba(30, 41, 59, 0.8)',
                border: !statusFilter ? 'none' : '1px solid rgba(6, 182, 212, 0.2)',
                color: !statusFilter ? '#ffffff' : '#a1a5b0',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (statusFilter !== undefined) {
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
                  e.currentTarget.style.background = 'rgba(30, 41, 59, 0.9)';
                }
              }}
              onMouseLeave={(e) => {
                if (statusFilter !== undefined) {
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)';
                  e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
                }
              }}
            >
              All
            </button>
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                style={{
                  background: statusFilter === status ? 'linear-gradient(135deg, #06b6d4, #8b5cf6)' : 'rgba(30, 41, 59, 0.8)',
                  border: statusFilter === status ? 'none' : '1px solid rgba(6, 182, 212, 0.2)',
                  color: statusFilter === status ? '#ffffff' : '#a1a5b0',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textTransform: 'capitalize',
                }}
                onMouseEnter={(e) => {
                  if (statusFilter !== status) {
                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
                    e.currentTarget.style.background = 'rgba(30, 41, 59, 0.9)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (statusFilter !== status) {
                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)';
                    e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
                  }
                }}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Create Visit Button */}
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
            Create Visit
          </button>
        </div>
      </div>

      {/* Visits List */}
      {activities.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activities.map((activity) => {
            const Icon = statusIcons[activity.status] || Clock;
            const config = statusConfig[activity.status] || { bgColor: 'rgba(6, 182, 212, 0.1)', textColor: '#06b6d4', borderColor: 'rgba(6, 182, 212, 0.3)' };

            return (
              <div
                key={activity.id}
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 27, 75, 0.8))',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '16px',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(6, 182, 212, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: config.bgColor,
                  border: `2px solid ${config.borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={24} style={{ color: config.textColor }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff', margin: '0 0 4px 0' }}>
                    {activity.customerName}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.6)', margin: '0 0 4px 0' }}>
                    {activity.whatsappNumber}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} style={{ color: 'rgba(6, 182, 212, 0.5)' }} />
                    <p style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.6)', margin: 0 }}>
                      {formatDateTime(activity.scheduledAt)}
                    </p>
                  </div>
                </div>

                <span style={{
                  display: 'inline-block',
                  background: config.bgColor,
                  border: `1px solid ${config.borderColor}`,
                  color: config.textColor,
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  textTransform: 'capitalize',
                }}>
                  {activity.status.replace('_', ' ')}
                </span>
              </div>
            );
          })}
        </div>
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
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', margin: '0 0 8px 0' }}>No visits scheduled</h3>
          <p style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.6)', margin: '0 0 24px 0', maxWidth: '300px', marginLeft: 'auto', marginRight: 'auto' }}>
            Schedule your first property visit. The AI assistant will help you manage and track all meetings.
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
            Create Your First Visit
          </button>
        </div>
      )}
    </div>
  );
}
