'use client';

import { Users, Building2, Calendar, BarChart3, Send, Sparkles, MessageSquare, TrendingUp, Zap, ActivitySquare } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useLeads } from '@/hooks/useLeads';
import { useActivities } from '@/hooks/useActivities';
import { useState } from 'react';

export default function DashboardPage() {
  const { data: leadsData, isLoading: leadsLoading } = useLeads(1, 5);
  const { data: activitiesData, isLoading: activitiesLoading } = useActivities({
    page: 1,
    size: 10,
  });
  const [message, setMessage] = useState('');

  if (leadsLoading || activitiesLoading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const totalLeads = leadsData?.totalElements || 0;
  const totalActivities = activitiesData?.totalElements || 0;

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
            Your AI real estate assistant is ready. You have <span style={{ color: '#06b6d4', fontWeight: '600' }}>{totalLeads} active leads</span> and <span style={{ color: '#06b6d4', fontWeight: '600' }}>{totalActivities} activities</span> today.
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
          { icon: Building2, label: 'Properties', value: 12, color: '#8b5cf6' },
          { icon: Calendar, label: 'Visits Today', value: 8, color: '#10b981' },
          { icon: BarChart3, label: 'Hot Leads', value: 24, color: '#f59e0b' },
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

      {/* Main Content: Chat & Right Panel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
      }}>
        {/* Chat Section */}
        <div style={{
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(30, 27, 75, 0.8))',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '500px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        }}>
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(6, 182, 212, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 10px #10b981',
            }} />
            <MessageSquare size={18} color="#06b6d4" />
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: 0, flex: 1 }}>AI Assistant</h3>
            <span style={{ fontSize: '12px', color: 'rgba(6, 182, 212, 0.6)' }}>Online</span>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            {/* AI Message */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)',
              }}>
                <Sparkles size={16} color="white" />
              </div>
              <div style={{
                maxWidth: '75%',
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                borderRadius: '14px',
                borderTopLeftRadius: '4px',
                padding: '12px 16px',
                backdropFilter: 'blur(10px)',
              }}>
                <p style={{ fontSize: '14px', color: '#e2e8f0', margin: 0, lineHeight: '1.5' }}>
                  Great news! I've analyzed your top {totalLeads} leads. I recommend reaching out to Sarah Johnson next – she has a 78% conversion probability for a $850k property.
                </p>
              </div>
            </div>

            {/* Suggestion Chips */}
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              paddingLeft: '44px',
            }}>
              {['View Details', 'Send Email', 'Schedule Call'].map((chip, i) => (
                <button
                  key={i}
                  style={{
                    background: 'rgba(6, 182, 212, 0.1)',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                    color: '#06b6d4',
                    borderRadius: '20px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(6, 182, 212, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)';
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* User Message */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
              <div style={{
                maxWidth: '75%',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.6), rgba(168, 85, 247, 0.6))',
                borderRadius: '14px',
                borderTopRightRadius: '4px',
                padding: '12px 16px',
                backdropFilter: 'blur(10px)',
              }}>
                <p style={{ fontSize: '14px', color: '#ffffff', margin: 0, lineHeight: '1.5' }}>
                  Perfect! Generate a personalized message for her property preferences.
                </p>
              </div>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
              }}>
                U
              </div>
            </div>

            {/* AI Response */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)',
              }}>
                <Sparkles size={16} color="white" />
              </div>
              <div style={{
                maxWidth: '75%',
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                borderRadius: '14px',
                borderTopLeftRadius: '4px',
                padding: '12px 16px',
                backdropFilter: 'blur(10px)',
              }}>
                <p style={{ fontSize: '14px', color: '#e2e8f0', margin: 0, lineHeight: '1.5' }}>
                  Done! I've crafted a message highlighting the smart home features and proximity to downtown. Ready to send?
                </p>
              </div>
            </div>
          </div>

          {/* Input */}
          <div style={{
            padding: '16px',
            borderTop: '1px solid rgba(6, 182, 212, 0.1)',
            display: 'flex',
            gap: '12px',
          }}>
            <input
              type="text"
              placeholder="Ask me anything..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{
                flex: 1,
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                borderRadius: '10px',
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
            <button style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 20px rgba(6, 182, 212, 0.4)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(6, 182, 212, 0.3)')}
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
          </div>

          {/* Activity */}
          <div style={{
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(30, 27, 75, 0.8))',
            border: '1px solid rgba(6, 182, 212, 0.1)',
            padding: '20px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <ActivitySquare size={18} color="#10b981" />
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', margin: 0 }}>Recent Activity</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
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
      </div>

      <style>{`
        input::placeholder {
          color: rgba(226, 232, 240, 0.4);
        }
      `}</style>
    </div>
  );
}
