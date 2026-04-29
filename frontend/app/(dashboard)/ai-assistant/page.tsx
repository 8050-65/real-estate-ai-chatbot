'use client';

import ChatInterface from '@/components/ai/ChatInterface';

export default function AIAssistantPage() {
  return (
    <div style={{ padding: '24px', maxWidth: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ChatInterface />
    </div>
  );
}
