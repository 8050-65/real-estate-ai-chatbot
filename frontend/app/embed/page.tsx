'use client'

import EmbedChatWidget from '@/components/ai/EmbedChatWidget'

export default function EmbedPage() {
  return (
    <div style={{ width: '100%', height: '100%', margin: 0, padding: 0 }}>
      <EmbedChatWidget isFloating={false} />
    </div>
  )
}
