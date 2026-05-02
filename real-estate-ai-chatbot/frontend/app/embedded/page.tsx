'use client';

import ChatInterface from '@/components/ai/ChatInterface';
import './embedded.css';

/**
 * Embedded Chat Page - Renders ONLY the chat UI (no launcher button, no page chrome)
 * Clean white panel for iframe embedding
 */
export default function EmbeddedChatPage() {
  return (
    <div className="embedded-container">
      <ChatInterface isFloating={false} fullPage={true} embeddedMode={true} />
    </div>
  );
}
