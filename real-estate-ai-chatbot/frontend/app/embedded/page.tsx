'use client';

import ChatInterface from '@/components/ai/ChatInterface';

/**
 * Embedded Chat Page - Renders ONLY the chat UI (no launcher button, no page chrome)
 * Used by chatbot-embed.js iframe
 *
 * Query params (tenantId, apiUrl) are automatically read by ChatInterface from URL
 */
export default function EmbeddedChatPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100%',
      background: '#111827',
      overflow: 'hidden',
      margin: 0,
      padding: 0,
    }}>
      <ChatInterface isFloating={false} fullPage={true} />
    </div>
  );
}
