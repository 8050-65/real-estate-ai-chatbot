'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  Building2,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'Leads', href: '/leads' },
  { icon: Building2, label: 'Properties', href: '/properties' },
  { icon: Calendar, label: 'Visits & Meetings', href: '/visits' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside style={{
      position: 'fixed',
      left: 0,
      top: 0,
      height: '100vh',
      width: '240px',
      backgroundColor: '#1e293b',
      borderRight: '1px solid #475569',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 40,
    }}>
      {/* Logo Section */}
      <div style={{
        padding: '24px',
        borderBottom: '1px solid #475569',
        backgroundColor: '#0f172a',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Sparkles size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>RE AI</h1>
            <p style={{ fontSize: '11px', color: '#06b6d4', margin: '2px 0 0 0' }}>CRM Assistant</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                borderRadius: '8px',
                color: isActive ? '#ffffff' : '#a1a5b0',
                backgroundColor: isActive ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                border: isActive ? '1px solid rgba(6, 182, 212, 0.3)' : 'none',
                textDecoration: 'none',
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div style={{
        borderTop: '1px solid #475569',
        padding: '16px',
        backgroundColor: '#0f172a',
      }}>
        {user && (
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
          }}>
            <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 4px 0' }}>Logged in as</p>
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff', margin: '0 0 4px 0', wordBreak: 'break-all' }}>
              {user.email}
            </p>
            <p style={{ fontSize: '12px', color: '#06b6d4', fontWeight: 600, margin: '4px 0 0 0' }}>{user.role}</p>
          </div>
        )}
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            padding: '8px 12px',
            fontSize: '14px',
            color: '#f87171',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
