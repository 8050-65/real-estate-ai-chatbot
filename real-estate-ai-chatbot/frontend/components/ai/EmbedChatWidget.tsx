'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader, Bot, User, X } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface EmbedChatWidgetProps {
  isFloating?: boolean;
  onClose?: () => void;
}

// Demo fallback responses for demo/testing
const getDemoResponse = (userMessage: string): string => {
  const lower = userMessage.toLowerCase();

  // Greeting responses
  if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
    return 'Hello! 👋 Welcome to Leadrat Real Estate AI Assistant. I can help you with:\n• Searching for available properties\n• Scheduling site visits\n• Booking callbacks\n• Managing leads\n\nWhat would you like to know about?';
  }

  // Property inquiries
  if (lower.includes('property') || lower.includes('properties') || lower.includes('apartment') || lower.includes('villa') || lower.includes('flat')) {
    return 'Great! We have several properties available:\n\n🏢 **Premium Villas**\n• 3 BHK Villas in Central Location\n• Starting from ₹1.5 Cr\n• Amenities: Pool, Gym, Security\n\n🏠 **Luxury Apartments**\n• 2/3 BHK in Modern Complex\n• Starting from ₹75 Lac\n• Prime Location with Modern Facilities\n\nWould you like to schedule a site visit or get more details?';
  }

  // Scheduling/Appointment inquiries
  if (lower.includes('schedule') || lower.includes('visit') || lower.includes('appointment') || lower.includes('book') || lower.includes('callback')) {
    return 'Perfect! I can help you schedule:\n\n📅 **Site Visit**\n• Available: Monday - Saturday\n• Times: 10 AM - 6 PM\n• Duration: 30-45 minutes\n\n📞 **Callback**\n• Quick consultation via call\n• Available immediately\n\n🤝 **Meeting**\n• Direct meeting with our team\n• Online or In-Person\n\nWhat suits you best?';
  }

  // Lead management
  if (lower.includes('lead') || lower.includes('customer') || lower.includes('inquiry')) {
    return 'I can help manage your leads:\n\n✅ **Create New Lead**\n• Quick 2-minute form\n• Automatic assignment to team\n\n📊 **Track Lead Status**\n• View all lead interactions\n• Follow-up reminders\n\n🎯 **Lead Conversion**\n• Schedule meetings/visits\n• Track conversion pipeline\n\nWhat would you like to do?';
  }

  // Price inquiries
  if (lower.includes('price') || lower.includes('cost') || lower.includes('budget') || lower.includes('rate')) {
    return 'Here are our current pricing ranges:\n\n💰 **Villas**: ₹1.5 Cr - ₹3 Cr\n💰 **Apartments**: ₹75 Lac - ₹2 Cr\n💰 **Commercial**: Custom Pricing\n\nPrices vary based on:\n• Location\n• Size (BHK/SQF)\n• Amenities\n• Availability\n\nWould you like detailed pricing for a specific property?';
  }

  // Default response
  return 'Thanks for your question! 😊 Based on our demo knowledge base, I can help with:\n\n✨ Available properties and pricing\n✨ Scheduling site visits\n✨ Booking callbacks\n✨ Lead management\n✨ Property details and amenities\n\nPlease ask about any of these topics, or describe what you\'re looking for!';
};

export default function EmbedChatWidget({ isFloating = false, onClose }: EmbedChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef('embed-' + Date.now());

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setLoading(true);

    try {
      // Try to call the RAG API
      const apiUrl = '/api/v1/chat/rag';
      console.log('Sending message to:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          conversation_id: conversationIdRef.current,
          use_rag: true,
        }),
      });

      console.log('API Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('API Response data:', data);

        const botResponse = data.response || data.message || getDemoResponse(userInput);

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: botResponse,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // API call failed, use demo response
        console.warn('API returned status:', response.status, '- Using demo response');
        const demoResponse = getDemoResponse(userInput);

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: demoResponse,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      // Network error or other issues - use demo response
      console.warn('Chat API error:', error.message, '- Using demo response');

      const demoResponse = getDemoResponse(userInput);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: demoResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#ffffff',
        borderRadius: isFloating ? '12px' : '0',
        border: isFloating ? '1px solid #e5e7eb' : 'none',
        boxShadow: isFloating ? '0 4px 20px rgba(0, 0, 0, 0.15)' : 'none',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bot size={18} color="white" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>AI Assistant</h3>
            <p style={{ margin: 0, fontSize: '11px', opacity: 0.85 }}>Real Estate AI</p>
          </div>
        </div>
        {isFloating && onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: '#ffffff',
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              👋
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#111827', fontWeight: '600' }}>
                Welcome to Leadrat AI
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>
                Ask me about properties, schedules, or anything real estate related!
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              gap: '8px',
            }}
          >
            {msg.role === 'assistant' && (
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Bot size={14} color="white" />
              </div>
            )}

            <div
              style={{
                maxWidth: '75%',
                backgroundColor: msg.role === 'user' ? '#e0e7ff' : '#f3f4f6',
                border: `1px solid ${msg.role === 'user' ? '#c7d2fe' : '#e5e7eb'}`,
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#111827',
                fontSize: '13px',
                lineHeight: '1.5',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.content}
            </div>

            {msg.role === 'user' && (
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#667eea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <User size={14} color="white" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Loader size={14} color="white" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <div
              style={{
                backgroundColor: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#6b7280',
                fontSize: '13px',
              }}
            >
              Thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        style={{
          padding: '12px',
          borderTop: '1px solid #e5e7eb',
          background: '#ffffff',
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '13px',
            fontFamily: 'inherit',
            color: '#111827',
            backgroundColor: '#f9fafb',
            outline: 'none',
            transition: 'border-color 0.2s',
            cursor: loading ? 'not-allowed' : 'text',
            opacity: loading ? 0.6 : 1,
          }}
          onFocus={(e) => {
            if (!loading) e.target.style.borderColor = '#667eea';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e5e7eb';
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={loading || !input.trim()}
          style={{
            padding: '8px 12px',
            background: !loading && input.trim() ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#d1d5db',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: !loading && input.trim() ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: '500',
            transition: 'all 0.2s',
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Send size={14} />
        </button>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
