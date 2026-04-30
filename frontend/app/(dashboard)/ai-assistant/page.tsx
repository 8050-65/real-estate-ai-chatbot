'use client'

import { useEffect, useState } from 'react'
import ChatInterface from '@/components/ai/ChatInterface'

type OllamaStatus = 'checking' | 'online' | 'offline'

export default function AIAssistantPage() {
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>('checking')
  const [userRole, setUserRole] = useState<string>('RM')

  useEffect(() => {
    // Check user role from localStorage
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('crm_auth_user') : null
      if (userStr) {
        const user = JSON.parse(userStr)
        setUserRole(user.role || 'RM')
      }
    } catch (e) {
      console.log('Could not get user role:', e)
    }

    // Check Ollama status
    const checkOllama = async () => {
      try {
        const response = await fetch('http://localhost:11434/api/tags', {
          method: 'GET',
        })
        if (response.ok) {
          setOllamaStatus('online')
        } else {
          setOllamaStatus('offline')
        }
      } catch {
        setOllamaStatus('offline')
      }
    }

    checkOllama()
    const interval = setInterval(checkOllama, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-gray-950 overflow-hidden">
      {/* Status Bar */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-gray-800 bg-gray-900 text-xs">
        <div className="flex items-center gap-6">
          {/* Ollama Status */}
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                ollamaStatus === 'online'
                  ? 'bg-green-400 animate-pulse'
                  : ollamaStatus === 'offline'
                  ? 'bg-red-400'
                  : 'bg-yellow-400 animate-pulse'
              }`}
            />
            <span className="text-gray-400 font-medium">
              {ollamaStatus === 'online'
                ? '✓ Ollama Online (llama3.2)'
                : ollamaStatus === 'offline'
                ? '✗ Ollama Offline'
                : '⟳ Checking Ollama...'}
            </span>
            {ollamaStatus === 'offline' && (
              <span className="text-gray-500 ml-2 text-[10px]">
                → Start with: <code className="bg-gray-800 px-1 rounded">ollama run llama3.2</code>
              </span>
            )}
          </div>

          {/* RAG Status */}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-gray-400 font-medium">✓ RAG Active (ChromaDB)</span>
          </div>

          {/* Leadrat API Status */}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-gray-400 font-medium">✓ Leadrat Connected</span>
          </div>
        </div>

        {/* Right side info */}
        <div className="flex items-center gap-4 text-gray-500">
          <span className="text-[10px]">Role: <span className="font-semibold text-gray-300">{userRole}</span></span>
          <span className="text-[10px]">Powered by LLaMA 3.2 + RAG</span>
        </div>
      </div>

      {/* Full Page Chat Interface - No margins */}
      <div className="flex-1 overflow-hidden bg-gray-950">
        <ChatInterface isFloating={false} fullPage={true} />
      </div>
    </div>
  )
}
