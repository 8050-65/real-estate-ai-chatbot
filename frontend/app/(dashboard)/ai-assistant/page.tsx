'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader, Bot, User, Copy, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  intent?: string;
}

const suggestedPrompts = [
  "Show today's hot leads",
  "Summarize lead follow-ups",
  "Generate message for client",
  "Analyze property demand",
  "Schedule site visits",
  "Check pending documents",
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Hello! I\'m your AI Real Estate Assistant. I can help you manage leads, schedule visits, analyze data, and more. What would you like to do?',
      timestamp: new Date(),
      intent: 'greeting',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          tenant_id: 'black',
          whatsapp_number: 'dashboard_user',
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Sorry, I could not process your request.',
        timestamp: new Date(),
        intent: data.intent,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure the AI backend is running and try again.',
        timestamp: new Date(),
        intent: 'error',
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast.error('Failed to get AI response. Please try again.');
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 120px)',
      gap: '0',
    }}>
      {/* Chat Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '24px',
        backgroundColor: '#0f172a',
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {/* Avatar */}
            {message.role === 'assistant' && (
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Bot size={20} color="white" />
              </div>
            )}

            {/* Message Bubble */}
            <div style={{
              maxWidth: '70%',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              <div style={{
                background: message.role === 'assistant'
                  ? 'rgba(30, 41, 59, 0.8)'
                  : 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(139, 92, 246, 0.3))',
                border: message.role === 'assistant'
                  ? '1px solid rgba(6, 182, 212, 0.2)'
                  : '1px solid rgba(6, 182, 212, 0.3)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                padding: '14px 16px',
                color: '#ffffff',
                fontSize: '13px',
                lineHeight: '1.5',
                wordBreak: 'break-word',
              }}>
                {message.content}
              </div>
              <div style={{
                fontSize: '11px',
                color: 'rgba(226, 232, 240, 0.4)',
                paddingLeft: message.role === 'assistant' ? '52px' : '0',
                paddingRight: message.role === 'user' ? '0' : '0',
              }}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* User Avatar */}
            {message.role === 'user' && (
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(6, 182, 212, 0.2)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <User size={20} color="#06b6d4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Bot size={20} color="white" />
            </div>
            <div style={{
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              borderRadius: '16px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Loader size={16} style={{ animation: 'spin 1s linear infinite', color: '#06b6d4' }} />
              <span style={{ color: 'rgba(226, 232, 240, 0.7)', fontSize: '13px' }}>AI is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts (shown when messages are empty or few) */}
      {messages.length <= 1 && !isLoading && (
        <div style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          borderTop: '1px solid rgba(6, 182, 212, 0.2)',
        }}>
          <p style={{
            fontSize: '12px',
            color: 'rgba(226, 232, 240, 0.6)',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: '600',
          }}>
            <Sparkles size={14} style={{ display: 'inline-block', marginRight: '6px', verticalAlign: 'middle' }} />
            Suggested Prompts
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
          }}>
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSuggestedPrompt(prompt)}
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  color: '#06b6d4',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(30, 41, 59, 0.9)';
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)';
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid rgba(6, 182, 212, 0.2)',
        background: 'linear-gradient(180deg, rgba(0,0,0,0), rgba(6, 182, 212, 0.05))',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask me anything about your real estate business..."
            disabled={isLoading}
            style={{
              flex: 1,
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              borderRadius: '12px',
              padding: '12px 16px',
              color: '#ffffff',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.3s',
              backdropFilter: 'blur(10px)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.2)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
              border: 'none',
              borderRadius: '12px',
              color: '#ffffff',
              cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
              opacity: isLoading || !input.trim() ? 0.5 : 1,
              transition: 'all 0.3s',
              boxShadow: '0 10px 30px rgba(6, 182, 212, 0.3)',
            }}
            onMouseEnter={(e) => {
              if (!isLoading && input.trim()) {
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(6, 182, 212, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(6, 182, 212, 0.3)';
            }}
          >
            {isLoading ? <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={20} />}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
