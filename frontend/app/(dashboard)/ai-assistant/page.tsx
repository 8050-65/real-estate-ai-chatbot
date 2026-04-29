'use client';

import ChatInterface from '@/components/ai/ChatInterface';

const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export default function AIAssistantPage() {
  if (!demoMode) {
    return (
      <div style={{ padding: '24px' }}>
        <ChatInterface />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '40px',
        borderRadius: '12px',
        marginBottom: '30px',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
          🤖 AI Bot RAG Demo
        </h1>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Retrieval-Augmented Generation with Ollama Embeddings
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '30px',
      }}>
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{ color: '#667eea', marginBottom: '15px', fontSize: '18px' }}>
            📄 Embedding Script
          </h2>
          <p style={{ color: '#666', marginBottom: '12px', fontSize: '14px' }}>
            Run this command to embed your documents:
          </p>
          <pre style={{
            background: '#f5f5f5',
            padding: '12px',
            borderRadius: '5px',
            overflow: 'auto',
            fontSize: '12px',
          }}>
            {`cd backend-ai\npython scripts/embed_documents.py \\\n  --tenant "dubaitt11" \\\n  --project "real-estate-ai" \\\n  --file "scripts/sample_documents.json"`}
          </pre>
        </div>

        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{ color: '#667eea', marginBottom: '15px', fontSize: '18px' }}>
            🧠 Ollama Embeddings
          </h2>
          <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.8' }}>
            <div><strong>Model:</strong> nomic-embed-text</div>
            <div><strong>Vector Size:</strong> 768 dimensions</div>
            <div><strong>Context:</strong> 8,192 tokens</div>
            <div><strong>Host:</strong> http://localhost:11434</div>
          </div>
        </div>
      </div>

      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '30px',
      }}>
        <h2 style={{ color: '#667eea', marginBottom: '15px', fontSize: '18px' }}>
          💬 Chat with RAG-Enhanced Bot
        </h2>
        <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
          Try asking: "What properties do you have in Downtown Dubai?" or "Show me luxury villas with pools"
        </p>
        <ChatInterface />
      </div>

      <div style={{
        marginTop: '30px',
        padding: '20px',
        textAlign: 'center',
        color: '#666',
        fontSize: '13px',
      }}>
        <p>Demo Mode Enabled • All other modules hidden for presentation</p>
      </div>
    </div>
  );
}
