'use client';

import { useState } from 'react';
import { useSession } from '@/lib/session-context';
import { ChevronRight, X, Trash2, MessageSquare, Users, Building, Calendar, CheckCircle, Palette } from 'lucide-react';

export function HistorySidebar() {
  const { getRecentActivities, clearHistory } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const activities = getRecentActivities(50);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <MessageSquare size={16} style={{ color: 'hsl(195 85% 55%)' }} />;
      case 'lead_search':
      case 'lead_create':
        return <Users size={16} style={{ color: 'hsl(270 60% 55%)' }} />;
      case 'property_search':
        return <Building size={16} style={{ color: 'hsl(35 90% 60%)' }} />;
      case 'schedule':
        return <Calendar size={16} style={{ color: 'hsl(195 85% 55%)' }} />;
      case 'status_update':
        return <CheckCircle size={16} style={{ color: '#22c55e' }} />;
      case 'theme_change':
        return <Palette size={16} style={{ color: 'hsl(270 60% 55%)' }} />;
      default:
        return <MessageSquare size={16} />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          right: isOpen ? '324px' : '20px',
          bottom: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, hsl(195 85% 55%) 0%, hsl(270 60% 55%) 100%)',
          border: 'none',
          color: 'hsl(40 30% 95%)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 40,
          boxShadow: '0 8px 24px hsl(195 85% 55% / 0.4)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 12px 32px hsl(195 85% 55% / 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 24px hsl(195 85% 55% / 0.4)';
        }}
      >
        <ChevronRight size={24} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
      </button>

      {/* Sidebar */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 35,
            }}
          />

          {/* Sidebar Panel */}
          <div
            style={{
              position: 'fixed',
              right: 0,
              top: 0,
              bottom: 0,
              width: '320px',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 27, 75, 0.95))',
              backdropFilter: 'blur(20px)',
              border: '1px solid hsl(195 85% 55% / 0.2)',
              overflowY: 'auto',
              zIndex: 50,
              animation: 'slideIn 0.3s ease',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px',
                borderBottom: '1px solid hsl(195 85% 55% / 0.2)',
                position: 'sticky',
                top: 0,
                background: 'rgba(15, 23, 42, 0.95)',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'hsl(40 30% 95%)', margin: 0 }}>
                Session History
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'hsl(195 85% 55%)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Activities List */}
            <div style={{ padding: '16px' }}>
              {activities.length === 0 ? (
                <p style={{ color: 'rgba(226, 232, 240, 0.5)', fontSize: '13px', textAlign: 'center', margin: '40px 0' }}>
                  No activities yet
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      style={{
                        background: 'rgba(6, 182, 212, 0.05)',
                        border: '1px solid hsl(195 85% 55% / 0.2)',
                        borderRadius: '12px',
                        padding: '12px',
                        fontSize: '12px',
                      }}
                    >
                      {/* Title with icon */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        {getActivityIcon(activity.type)}
                        <span style={{ fontWeight: '600', color: 'hsl(40 30% 95%)', flex: 1 }}>
                          {activity.title}
                        </span>
                        <span style={{ color: 'rgba(226, 232, 240, 0.5)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                          {formatTime(activity.timestamp)}
                        </span>
                      </div>

                      {/* Description */}
                      <p style={{ margin: '6px 0 0 24px', color: 'rgba(226, 232, 240, 0.7)', lineHeight: '1.4' }}>
                        {activity.description}
                      </p>

                      {/* Details */}
                      {activity.details && Object.keys(activity.details).length > 0 && (
                        <div style={{ margin: '8px 0 0 24px', fontSize: '11px', color: 'rgba(226, 232, 240, 0.5)' }}>
                          {Object.entries(activity.details).map(([key, value]) => (
                            <div key={key} style={{ margin: '2px 0' }}>
                              <span style={{ color: 'hsl(195 85% 55%)' }}>{key}:</span> {String(value).substring(0, 40)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clear History Button */}
            {activities.length > 0 && (
              <div
                style={{
                  padding: '16px',
                  borderTop: '1px solid hsl(195 85% 55% / 0.2)',
                  position: 'sticky',
                  bottom: 0,
                  background: 'rgba(15, 23, 42, 0.95)',
                }}
              >
                <button
                  onClick={clearHistory}
                  style={{
                    width: '100%',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    borderRadius: '8px',
                    padding: '8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  }}
                >
                  <Trash2 size={14} />
                  Clear History
                </button>
              </div>
            )}
          </div>

          <style>{`
            @keyframes slideIn {
              from {
                transform: translateX(100%);
              }
              to {
                transform: translateX(0);
              }
            }
          `}</style>
        </>
      )}
    </>
  );
}
