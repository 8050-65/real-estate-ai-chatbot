'use client'

import ChatInterface from '@/components/ai/ChatInterface'

export default function EmbedPage() {
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <ChatInterface isFloating={false} embeddedMode={true} />
    </div>
  )
}
