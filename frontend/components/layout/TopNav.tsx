'use client';

import { usePathname } from 'next/navigation';

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

      </div>
    </header>
  );
}
