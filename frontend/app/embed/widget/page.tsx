'use client'

import EmbedChatWidget from '@/components/ai/EmbedChatWidget'

export default function WidgetPage() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        margin: 0,
        padding: 0,
        background: '#ffffff',
      }}
    >
      <EmbedChatWidget isFloating={false} />
    </div>
  )
}
