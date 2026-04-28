'use client';

import { Users, Building2, Calendar, BarChart3, Sparkles, TrendingUp, Zap, ActivitySquare, ArrowRight } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useLeads } from '@/hooks/useLeads';
import { useActivities } from '@/hooks/useActivities';
import { useProperties } from '@/hooks/useProperties';
import { useRouter } from 'next/navigation';
import { DUMMY_ANALYTICS } from '@/lib/dummy-data';

export default function DashboardPage() {
  const router = useRouter();
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
            <button style={{
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
            <button style={{
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

      {/* Quick Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        {[
          { icon: Users, label: 'Active Leads', value: totalLeads, color: '#06b6d4' },
          { icon: Building2, label: 'Properties', value: totalProperties, color: '#8b5cf6' },
          { icon: Calendar, label: 'Visits Scheduled', value: totalVisits, color: '#10b981' },
          { icon: BarChart3, label: 'Hot Leads', value: hotLeads, color: '#f59e0b' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
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
              '🔥 3 hot leads need follow-up',
              '📈 Conversion up 12% this week',
              '⏰ Reminder: 2 visits tomorrow',
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
            {[
              { icon: '📞', text: 'Call with Sarah', time: '2h ago' },
              { icon: '✉️', text: 'Email sent to 5 leads', time: '4h ago' },
              { icon: '📅', text: 'Visit scheduled', time: 'Tomorrow' },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '10px',
                background: 'rgba(6, 182, 212, 0.05)',
                borderRadius: '8px',
                borderLeft: '2px solid #06b6d4',
              }}>
                <p style={{ fontSize: '12px', color: '#e2e8f0', margin: '0 0 4px 0' }}>
                  {item.icon} {item.text}
                </p>
                <p style={{ fontSize: '11px', color: 'rgba(6, 182, 212, 0.6)', margin: 0 }}>{item.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        input::placeholder {
          color: rgba(226, 232, 240, 0.4);
        }
      `}</style>
    </div>
  );
}
