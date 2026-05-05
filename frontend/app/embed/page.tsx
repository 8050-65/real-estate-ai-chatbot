'use client'

import ChatInterface from '@/components/ai/ChatInterface'
import { SessionProvider } from '@/lib/session-context'

export default function EmbedPage() {
  return (
    <SessionProvider>
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
    </SessionProvider>
  )
}
