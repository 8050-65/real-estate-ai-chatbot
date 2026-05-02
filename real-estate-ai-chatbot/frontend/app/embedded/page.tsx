'use client';

import ChatInterface from '@/components/ai/ChatInterface';

/**
 * Embedded Chat Page - Renders ONLY the chat UI (no launcher button, no page chrome)
 * Clean white panel for iframe embedding
 */
export default function EmbeddedChatPage() {
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      margin: 0,
      padding: 0,
    }}>
      <ChatInterface isFloating={false} fullPage={true} embeddedMode={true} />
    </div>
  );
}
