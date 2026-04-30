'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X } from 'lucide-react';
import ChatInterface from './ChatInterface';

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Hide floating chatbot on the AI Assistant page (it has its own integrated chat)
  if (pathname === '/ai-assistant' || pathname.includes('/ai-assistant')) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
          border: 'none',
          color: '#ffffff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(6, 182, 212, 0.4)',
          zIndex: 40,
          transition: 'all 0.3s ease',
          transform: isOpen ? 'scale(0.9)' : 'scale(1)',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.boxShadow = '0 15px 40px rgba(6, 182, 212, 0.6)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(6, 182, 212, 0.4)';
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '24px',
            width: '400px',
            height: '600px',
            borderRadius: '16px',
            backgroundColor: '#0f172a',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            zIndex: 41,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          <ChatInterface />
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          [role="button"] {
            bottom: 16px !important;
            right: 16px !important;
          }

          [style*="position: fixed"][style*="bottom: 100px"] {
            width: calc(100vw - 32px) !important;
            height: 70vh !important;
            right: 16px !important;
            bottom: auto !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
          }
        }
      `}</style>
    </>
  );
}
