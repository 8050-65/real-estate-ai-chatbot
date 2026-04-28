'use client';

import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';

const pageNames: Record<string, string> = {
  '/ai-assistant': 'AI Assistant',
  '/dashboard': 'Dashboard',
  '/leads': 'Leads',
  '/properties': 'Properties',
  '/visits': 'Visits & Meetings',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
};

export function TopNav() {
  const pathname = usePathname();
  const pageName = Object.entries(pageNames).find(([path]) =>
    pathname === path || pathname.startsWith(`${path}/`),
  )?.[1] || 'Dashboard';

  return (
    <header style={{
      borderBottom: '1px solid #475569',
      backgroundColor: 'rgba(15, 23, 42, 0.5)',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        display: 'flex',
        height: '64px',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '24px',
        paddingRight: '24px',
      }}>
        <div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#ffffff',
            margin: 0,
          }}>
            {pageName}
          </h1>
          <p style={{ fontSize: '12px', color: '#06b6d4', margin: '2px 0 0 0' }}>AI-Powered CRM Assistant</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="search"
              placeholder="Search leads, properties..."
              style={{
                borderRadius: '8px',
                border: '1px solid #475569',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                paddingTop: '8px',
                paddingBottom: '8px',
                paddingLeft: '40px',
                paddingRight: '16px',
                fontSize: '14px',
                color: '#ffffff',
                outline: 'none',
                transition: 'all 0.2s',
                width: '280px',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#06b6d4';
                e.currentTarget.style.boxShadow = '0 0 0 1px rgba(6, 182, 212, 0.3)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#475569';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
