'use client';

import { useState } from 'react';
import { Users, Building2, Calendar, BarChart3, Sparkles, TrendingUp, Zap, ActivitySquare, ArrowRight, Phone, Mail, Bell, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useLeads } from '@/hooks/useLeads';
import { useActivities } from '@/hooks/useActivities';
import { useProperties } from '@/hooks/useProperties';
import { useRouter } from 'next/navigation';
import { DUMMY_ANALYTICS } from '@/lib/dummy-data';

export default function DashboardPage() {
  const router = useRouter();
  const [openModal, setOpenModal] = useState<'call' | 'email' | 'push' | null>(null);
  const { data: leadsData, isLoading: leadsLoading } = useLeads(1, 100);
  const { data: activitiesData, isLoading: activitiesLoading } = useActivities({
    page: 1,
    size: 100,
  });
  const { data: propertiesData, isLoading: propertiesLoading } = useProperties(1, 100);

  if (leadsLoading || activitiesLoading || propertiesLoading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  // Use demo data if API returns empty results
  const totalLeads = leadsData?.totalElements && leadsData.totalElements > 0 ? leadsData.totalElements : DUMMY_ANALYTICS.totalLeads;
  const totalProperties = propertiesData?.totalElements && propertiesData.totalElements > 0 ? propertiesData.totalElements : DUMMY_ANALYTICS.totalProperties;
  const totalVisits = activitiesData?.totalElements && activitiesData.totalElements > 0 ? activitiesData.totalElements : DUMMY_ANALYTICS.totalVisits;
  const hotLeads = totalLeads > 0 ? Math.ceil(totalLeads * 0.2) : DUMMY_ANALYTICS.hotLeads;

  if (totalLeads === DUMMY_ANALYTICS.totalLeads || !leadsData?.content?.length) {
    console.log('[Dashboard] Using demo mode: showing dummy analytics');
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }}>
      {/* Welcome Hero */}
      <div style={{
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(168, 85, 247, 0.15))',
        border: '1px solid rgba(6, 182, 212, 0.2)',
        padding: '40px',
        display: 'flex',
        alignItems: 'center',
        gap: '32px',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(168, 85, 247, 0.1))',
          borderRadius: '20px',
          filter: 'blur(20px)',
          zIndex: 0,
        }} />
        <div style={{ zIndex: 1, flex: 1 }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#ffffff',
            margin: '0 0 12px 0',
            letterSpacing: '-0.5px',
          }}>
            Welcome back! 👋
          </h1>
          <p style={{
            fontSize: '16px',
            color: 'rgba(6, 182, 212, 0.9)',
            margin: '0 0 20px 0',
            lineHeight: '1.6',
          }}>
            Your AI real estate assistant is ready. You have <span style={{ color: '#06b6d4', fontWeight: '600' }}>{totalLeads} active leads</span> and <span style={{ color: '#06b6d4', fontWeight: '600' }}>{totalVisits} visits scheduled</span>.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => router.push('/ai-assistant')} style={{
              background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 10px 30px rgba(6, 182, 212, 0.3)',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 15px 40px rgba(6, 182, 212, 0.5)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 10px 30px rgba(6, 182, 212, 0.3)')}
            >
              <Sparkles size={16} />
              Ask AI
            </button>
            <button onClick={() => router.push('/analytics')} style={{
              background: 'rgba(6, 182, 212, 0.1)',
              color: '#06b6d4',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '10px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(6, 182, 212, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)';
            }}
            >
              <TrendingUp size={16} />
              View Insights
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
      }}>
        <button onClick={() => setOpenModal('call')} style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.1))',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          transition: 'all 0.3s',
          color: '#3b82f6',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.2))';
          e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.1))';
          e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
        }}
        >
          <Phone size={20} />
          <span style={{ fontSize: '12px', fontWeight: '600' }}>Call</span>
        </button>

        <button onClick={() => setOpenModal('email')} style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1))',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          transition: 'all 0.3s',
          color: '#22c55e',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(34, 197, 94, 0.2))';
          e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1))';
          e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.3)';
        }}
        >
          <Mail size={20} />
          <span style={{ fontSize: '12px', fontWeight: '600' }}>Email</span>
        </button>

        <button onClick={() => setOpenModal('push')} style={{
          background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.2), rgba(251, 146, 60, 0.1))',
          border: '1px solid rgba(251, 146, 60, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          transition: 'all 0.3s',
          color: '#fb923c',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(251, 146, 60, 0.3), rgba(251, 146, 60, 0.2))';
          e.currentTarget.style.borderColor = 'rgba(251, 146, 60, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(251, 146, 60, 0.2), rgba(251, 146, 60, 0.1))';
          e.currentTarget.style.borderColor = 'rgba(251, 146, 60, 0.3)';
        }}
        >
          <Bell size={20} />
          <span style={{ fontSize: '12px', fontWeight: '600' }}>Push Notify</span>
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        {[
          { icon: Users, label: 'Active Leads', value: totalLeads, color: '#06b6d4', path: '/leads' },
          { icon: Building2, label: 'Properties', value: totalProperties, color: '#8b5cf6', path: '/properties' },
          { icon: Calendar, label: 'Visits Scheduled', value: totalVisits, color: '#10b981', path: '/visits' },
          { icon: BarChart3, label: 'Hot Leads', value: hotLeads, color: '#f59e0b', path: '/leads' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              onClick={() => router.push(stat.path)}
              style={{
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(30, 27, 75, 0.8))',
                border: `1px solid ${stat.color}22`,
                padding: '24px',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = `${stat.color}66`;
                el.style.boxShadow = `0 0 30px ${stat.color}33`;
                el.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = `${stat.color}22`;
                el.style.boxShadow = 'none';
                el.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${stat.color}20, ${stat.color}10)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}>
                <Icon size={24} color={stat.color} />
              </div>
              <p style={{
                fontSize: '13px',
                color: 'rgba(226, 232, 240, 0.6)',
                margin: '0 0 8px 0',
                fontWeight: '500',
              }}>
                {stat.label}
              </p>
              <p style={{
                fontSize: '32px',
                fontWeight: '700',
                color: stat.color,
                margin: 0,
              }}>
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* AI Insights & Recent Activity Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
      }}>
        {/* AI Insights */}
        <div style={{
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15))',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          padding: '20px',
          boxShadow: '0 10px 30px rgba(139, 92, 246, 0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Zap size={18} color="#8b5cf6" />
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', margin: 0 }}>AI Insights</h3>
          </div>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            {[
              `🔥 ${hotLeads} hot leads need follow-up`,
              `📈 ${totalLeads > 50 ? 'High' : 'Stable'} lead volume this week`,
              `⏰ Reminder: ${totalVisits} visits scheduled`,
            ].map((insight, i) => (
              <li key={i} style={{
                fontSize: '12px',
                color: 'rgba(226, 232, 240, 0.7)',
                padding: '8px 0',
                borderBottom: i < 2 ? '1px solid rgba(139, 92, 246, 0.1)' : 'none',
              }}>
                {insight}
              </li>
            ))}
          </ul>
          <button style={{
            width: '100%',
            marginTop: '12px',
            background: 'rgba(139, 92, 246, 0.2)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            color: '#c4b5fd',
            borderRadius: '8px',
            padding: '8px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onClick={() => router.push('/ai-assistant')}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
          }}
          >
            Ask AI Assistant
          </button>
        </div>

        {/* Recent Activity */}
        <div style={{
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(30, 27, 75, 0.8))',
          border: '1px solid rgba(6, 182, 212, 0.1)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <ActivitySquare size={18} color="#10b981" />
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', margin: 0 }}>Recent Activity</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activitiesData?.content && activitiesData.content.length > 0 ? (
              activitiesData.content.slice(0, 3).map((activity: any, i: number) => {
                const typeIcons: Record<string, string> = {
                  'chat': '💬',
                  'lead_search': '🔍',
                  'lead_create': '➕',
                  'property_search': '🏠',
                  'schedule': '📅',
                  'status_update': '✅',
                  'theme_change': '🎨',
                  'action': '⚡',
                  'call': '📞',
                  'email': '✉️',
                  'meeting': '🤝',
                };
                const icon = typeIcons[activity.type] || '📋';
                const activityType = activity.type?.replace('_', ' ') || 'Activity';
                const path = activity.type?.includes('lead') ? '/leads' : activity.type?.includes('schedule') ? '/visits' : '/properties';

                return (
                  <div key={i} onClick={() => router.push(path)} style={{
                    padding: '10px',
                    background: 'rgba(6, 182, 212, 0.05)',
                    borderRadius: '8px',
                    borderLeft: '2px solid #06b6d4',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(6, 182, 212, 0.15)';
                    e.currentTarget.style.borderLeftColor = '#06b6d4';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(6, 182, 212, 0.05)';
                    e.currentTarget.style.borderLeftColor = '#06b6d4';
                  }}
                  >
                    <p style={{ fontSize: '12px', color: '#e2e8f0', margin: '0 0 4px 0' }}>
                      {icon} {activity.title || activityType}
                    </p>
                    <p style={{ fontSize: '11px', color: 'rgba(6, 182, 212, 0.6)', margin: 0 }}>
                      {activity.timestamp ? new Date(activity.timestamp).toLocaleDateString() : 'Just now'}
                    </p>
                  </div>
                );
              })
            ) : (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                background: 'rgba(6, 182, 212, 0.05)',
                borderRadius: '8px',
              }}>
                <p style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.5)', margin: 0 }}>
                  No recent activities yet
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Call Modal */}
      {openModal === 'call' && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 27, 75, 0.95))',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', margin: 0 }}>📞 Call Feature</h2>
              <button onClick={() => setOpenModal(null)} style={{ background: 'none', border: 'none', color: '#06b6d4', cursor: 'pointer', fontSize: '24px' }}>✕</button>
            </div>
            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              marginBottom: '20px',
            }}>
              <p style={{ fontSize: '14px', color: '#ffffff', margin: '0 0 8px 0' }}>🚀 Coming Soon</p>
              <p style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.7)', margin: 0 }}>Call integration with Twilio is under development. You'll be able to call leads directly from the dashboard.</p>
            </div>
            <button onClick={() => setOpenModal(null)} style={{
              width: '100%',
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#3b82f6',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {openModal === 'email' && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 27, 75, 0.95))',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', margin: 0 }}>✉️ Email Campaign</h2>
              <button onClick={() => setOpenModal(null)} style={{ background: 'none', border: 'none', color: '#06b6d4', cursor: 'pointer', fontSize: '24px' }}>✕</button>
            </div>
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              marginBottom: '20px',
            }}>
              <p style={{ fontSize: '14px', color: '#ffffff', margin: '0 0 8px 0' }}>🚀 Coming Soon</p>
              <p style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.7)', margin: 0 }}>Bulk email campaigns and templates are being built. Send personalized emails to multiple leads at once.</p>
            </div>
            <button onClick={() => setOpenModal(null)} style={{
              width: '100%',
              background: 'rgba(34, 197, 94, 0.2)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: '#22c55e',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Push Notification Modal */}
      {openModal === 'push' && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 27, 75, 0.95))',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', margin: 0 }}>🔔 Push Notifications</h2>
              <button onClick={() => setOpenModal(null)} style={{ background: 'none', border: 'none', color: '#06b6d4', cursor: 'pointer', fontSize: '24px' }}>✕</button>
            </div>
            <div style={{
              background: 'rgba(251, 146, 60, 0.1)',
              border: '1px solid rgba(251, 146, 60, 0.2)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              marginBottom: '20px',
            }}>
              <p style={{ fontSize: '14px', color: '#ffffff', margin: '0 0 8px 0' }}>🚀 Coming Soon</p>
              <p style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.7)', margin: 0 }}>Send push notifications to leads and team members. Desktop and mobile notifications coming soon.</p>
            </div>
            <button onClick={() => setOpenModal(null)} style={{
              width: '100%',
              background: 'rgba(251, 146, 60, 0.2)',
              border: '1px solid rgba(251, 146, 60, 0.3)',
              color: '#fb923c',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}>
              Close
            </button>
          </div>
        </div>
      )}

      <style>{`
        input::placeholder {
          color: rgba(226, 232, 240, 0.4);
        }
      `}</style>
    </div>
  );
}
