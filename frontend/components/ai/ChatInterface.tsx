'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader, Bot, User } from 'lucide-react';
import fastApiClient from '@/lib/fastapi-client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  quickReplies?: string[];
  isLoading?: boolean;
  data?: unknown;
}

const INTENT_PATTERNS = {
  lead: ['lead', 'leads', 'enquiry', 'inquiry', 'customer', 'contact', 'hot lead', 'new lead', 'follow up'],
  property: ['property', 'properties', 'flat', 'apartment', '2bhk', '3bhk', 'bhk', 'unit', 'available', 'inventory', 'sqft', 'carpet area'],
  project: ['project', 'projects', 'tower', 'block', 'phase', 'rera', 'possession', 'launch', 'development'],
  visit: ['visit', 'site visit', 'meeting', 'schedule', 'appointment', 'callback', 'book a visit', 'site see'],
  analytics: ['how many', 'total', 'count', 'analytics', 'report', 'conversion', 'performance', 'stats'],
};

function detectIntent(message: string): string {
  const lower = message.toLowerCase();
  for (const [intent, keywords] of Object.entries(INTENT_PATTERNS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return intent;
    }
  }
  return 'general';
}

function extractSearchTerm(message: string): string {
  const stopWords = ['do', 'you', 'have', 'any', 'show', 'me', 'find', 'get', 'list', 'all', 'the', 'a', 'an', 'is', 'are', 'what', 'how', 'many', 'can', 'i', 'want', 'need', 'looking', 'for', 'about', 'tell', 'give', 'fetch'];
  return message
    .toLowerCase()
    .split(' ')
    .filter((w) => !stopWords.includes(w) && w.length > 1)
    .join(' ')
    .trim();
}

function getQuickReplies(intent: string): string[] {
  const replies: Record<string, string[]> = {
    lead: ['Show hot leads', 'Filter by status', 'Assign lead', 'Schedule follow-up'],
    property: ['Filter by BHK', 'Show price range', 'View on map', 'Schedule visit'],
    project: ['Show units', 'View amenities', 'Check RERA', 'Contact developer'],
    visit: ['Schedule visit', 'View calendar', 'Send reminder', 'Cancel appointment'],
    analytics: ['Daily report', 'Weekly summary', 'Monthly metrics', 'Export report'],
    general: ['Show leads', 'Find property', 'View projects', 'Schedule visit']
  };
  return replies[intent] || replies.general;
}

interface SearchParams {
  priceMin?: number;
  priceMax?: number;
  bhk?: string;
  status?: string;
  area?: string;
}

// Map quick replies to search parameters
const QUICK_REPLY_PARAMS: Record<string, Partial<SearchParams & { message: string }>> = {
  'Available properties': { message: 'Show me available properties' },
  'Filter by BHK': { message: 'Properties with different BHKs', bhk: 'all' },
  'Show price range': { message: 'Properties by price', priceMin: 0, priceMax: 10000000 },
  'View on map': { message: 'Properties near me on map' },
  'Schedule visit': { message: 'Schedule a property visit' },
  'Show hot leads': { message: 'Show me hot leads' },
  'Filter by status': { message: 'Filter leads by status' },
  'Assign lead': { message: 'Assign a lead to me' },
  'Schedule follow-up': { message: 'Schedule follow-up for a lead' },
  'Show units': { message: 'Show available units' },
  'View amenities': { message: 'View project amenities' },
  'Check RERA': { message: 'Check RERA status' },
  'Contact developer': { message: 'Contact the developer' },
  'View calendar': { message: 'View visit calendar' },
  'Send reminder': { message: 'Send appointment reminder' },
  'Cancel appointment': { message: 'Cancel an appointment' },
  'Daily report': { message: 'Show daily analytics report' },
  'Weekly summary': { message: 'Show weekly summary' },
  'Monthly metrics': { message: 'Show monthly metrics' },
  'Export report': { message: 'Export analytics report' },
  'Show leads': { message: 'Show all leads' },
  'Find property': { message: 'Find properties' },
  'View projects': { message: 'View all projects' },
};

async function callLeadratAPI(intent: string, searchTerm: string, originalMessage: string, conversationHistory: Message[] = []): Promise<{ content: string; quickReplies: string[] }> {
  const tenantId = typeof window !== 'undefined' ? (localStorage.getItem('tenantId') || null) : null;

  console.log('[ChatInterface] Processing message:', originalMessage.substring(0, 50) + '...');

  try {
    const historyContext = conversationHistory
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-3)
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content.substring(0, 200)
      }));

    // Send to backend - DO NOT pass intent, let backend detect it
    // Only pass tenant_id if explicitly set, otherwise backend uses .env default
    const requestPayload: any = {
      message: originalMessage,
      conversation_history: historyContext
    };

    if (tenantId) {
      requestPayload.tenant_id = tenantId;
    }

    const response = await fastApiClient.post('/api/v1/chat/message', requestPayload);

    const routerResponse = response.data?.response || response.data?.content || '';
    const detectedIntent = response.data?.intent || intent || 'general';
    const source = response.data?.source || 'Service';

    if (!routerResponse) {
      return {
        content: 'Unable to generate response. Please try again.',
        quickReplies: ['Try again', 'Help']
      };
    }

    const quickReplies = getQuickReplies(detectedIntent);

    console.log('[ChatInterface] Routed to:', source, '| Intent:', detectedIntent);

    return {
      content: routerResponse,
      quickReplies: quickReplies
    };
  } catch (error: any) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Unknown error';

    console.error('[API Error]', {
      status,
      url: error.config?.url,
      message,
    });

    let friendlyMessage = 'Sorry, I encountered an error. ';

    if (status === 401) {
      friendlyMessage += 'Your session has expired. Please refresh and login again.';
    } else if (status === 403) {
      friendlyMessage += 'You do not have permission to access this data.';
    } else if (status === 404) {
      friendlyMessage += `The ${intent} API endpoint is not available.`;
    } else if (status === 500) {
      friendlyMessage += 'The server encountered an error. Please try again in a moment.';
    } else {
      friendlyMessage += 'Unable to fetch data right now. Please check your connection.';
    }

    return {
      content: friendlyMessage,
      quickReplies: ['Try again', 'Help'],
    };
  }
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: `Hello! I'm your AI Real Estate Assistant. 🏠\n\nI can help you with:\n• 👥 Finding and managing leads\n• 🏠 Searching property inventory\n• 📋 Projects and availability\n• 📅 Scheduling visits and meetings\n• 📊 Sales analytics and reports\n\nWhat would you like to know?`,
  timestamp: new Date(),
  quickReplies: ["Show today's leads", 'Available properties', 'Upcoming visits', 'Sales summary'],
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(messageText?: string) {
    const text = messageText ?? input.trim();
    if (!text || isLoading) return;

    setInput('');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const loadingId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: loadingId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isLoading: true,
      },
    ]);
    setIsLoading(true);

    try {
      const intent = detectIntent(text);
      const searchTerm = extractSearchTerm(text);
      const { content, quickReplies } = await callLeadratAPI(intent, searchTerm, text, messages);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingId ? { ...msg, content, quickReplies, isLoading: false } : msg
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingId
            ? {
                ...msg,
                content: 'Something went wrong. Please try again.',
                quickReplies: ['Try again', 'Show all leads'],
                isLoading: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleQuickReply(reply: string) {
    // Use the mapped message from QUICK_REPLY_PARAMS, or fallback to the reply text
    const params = QUICK_REPLY_PARAMS[reply];
    const messageToSend = params?.message || reply;
    handleSend(messageToSend);
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 140px)',
        backgroundColor: '#0f172a',
        borderRadius: '16px',
        border: '1px solid rgba(6, 182, 212, 0.2)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 24px',
          borderBottom: '1px solid rgba(6, 182, 212, 0.2)',
          backgroundColor: '#1e293b',
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            animation: 'pulse 2s infinite',
          }}
        />
        <span style={{ fontWeight: '600', color: '#ffffff', fontSize: '14px' }}>AI Assistant</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'rgba(226, 232, 240, 0.5)' }}>Online</span>
      </div>

      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {messages.map((msg) => (
          <div key={msg.id}>
            <div
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: msg.quickReplies ? '8px' : '0',
              }}
            >
              {msg.role === 'assistant' && (
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginRight: '12px',
                  }}
                >
                  <Bot size={18} color="white" />
                </div>
              )}

              <div
                style={{
                  maxWidth: '70%',
                  backgroundColor: msg.role === 'user' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(30, 41, 59, 0.8)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(6, 182, 212, 0.2)'}`,
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#ffffff',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.isLoading ? (
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <Loader size={14} style={{ animation: 'spin 1s linear infinite', color: '#06b6d4' }} />
                    <span style={{ color: 'rgba(226, 232, 240, 0.7)' }}>AI is thinking...</span>
                  </div>
                ) : (
                  msg.content
                )}
              </div>

              {msg.role === 'user' && (
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(6, 182, 212, 0.2)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginLeft: '12px',
                  }}
                >
                  <User size={18} color="#06b6d4" />
                </div>
              )}
            </div>

            {/* Quick Replies */}
            {msg.role === 'assistant' && msg.quickReplies && !msg.isLoading && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginLeft: '44px' }}>
                {msg.quickReplies.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => handleQuickReply(reply)}
                    disabled={isLoading}
                    style={{
                      fontSize: '11px',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: '1px solid rgba(6, 182, 212, 0.5)',
                      color: '#06b6d4',
                      backgroundColor: 'transparent',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.5 : 1,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.8)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
                    }}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(6, 182, 212, 0.2)',
          backgroundColor: '#1e293b',
          display: 'flex',
          gap: '12px',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Ask me anything about your real estate business..."
          disabled={isLoading}
          style={{
            flex: 1,
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            borderRadius: '12px',
            padding: '10px 14px',
            color: '#ffffff',
            fontSize: '13px',
            outline: 'none',
            transition: 'all 0.2s',
            opacity: isLoading ? 0.6 : 1,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(6, 182, 212, 0.2)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={isLoading || !input.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
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
          {isLoading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
