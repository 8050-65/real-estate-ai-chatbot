'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';
import { FloatingChatbot } from '@/components/ai/FloatingChatbot';
import { HistorySidebar } from '@/components/layout/HistorySidebar';
import { SessionProvider } from '@/lib/session-context';
import { isAuthenticated } from '@/lib/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // DEMO MODE: Skip authentication check and allow direct access
    console.log('[Demo] Dashboard access granted (auth bypassed for demo)');
    setIsReady(true);
    // Original auth check (commented for demo):
    // if (!isAuthenticated()) {
    //   router.push('/login');
    // } else {
    //   setIsReady(true);
    // }
  }, [router]);

  if (!isReady) {
    return null;
  }

  return (
    <SessionProvider>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#111827' }}>
        {/* Sidebar */}
        <div style={{ width: '240px', flexShrink: 0 }}>
          <Sidebar />
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* Top Navigation */}
          <div style={{ flexShrink: 0 }}>
            <TopNav />
          </div>

          {/* Main Content Area */}
          <main style={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: '#0f172a',
            padding: '24px',
            color: '#ffffff'
          }}>
            {children}
          </main>
        </div>

        {/* Floating Chat */}
        <FloatingChatbot />

        {/* Session History Sidebar */}
        <HistorySidebar />
      </div>
    </SessionProvider>
  );
}
