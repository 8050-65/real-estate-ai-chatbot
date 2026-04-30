'use client'

import EmbedChatWidget from '@/components/ai/EmbedChatWidget'

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
      <EmbedChatWidget isFloating={false} />
    </div>
  )
}
