/**
 * Leadrat Real Estate AI Chatbot - Embed Script
 * Version 1.0
 *
 * USAGE:
 * <script async src="http://localhost:3000/EMBED.js"></script>
 *
 * Or with options:
 * <script async src="http://localhost:3000/EMBED.js"
 *   data-position="bottom-right"
 *   data-theme="dark">
 * </script>
 */

(function() {
  'use strict';

  const config = {
    chatbotUrl: document.currentScript?.getAttribute('data-chatbot-url') || 'http://localhost:3000',
    position: document.currentScript?.getAttribute('data-position') || 'bottom-right',
    theme: document.currentScript?.getAttribute('data-theme') || 'dark',
  };

  if (window.__leadratChatbotInit) return;
  window.__leadratChatbotInit = true;

  // Create HTML
  const container = document.createElement('div');
  container.id = 'leadrat-chatbot-container';
  container.innerHTML = `
    <div id="leadrat-chatbot-button" class="leadrat-chatbot-button">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span class="leadrat-chatbot-badge">1</span>
    </div>

    <div id="leadrat-chatbot-window" class="leadrat-chatbot-window" style="display: none;">
      <div class="leadrat-chatbot-header">
        <div>
          <h3>Aria - Real Estate Assistant</h3>
          <p>Ask about properties, payment plans, RERA & more</p>
        </div>
        <button id="leadrat-chatbot-close" class="leadrat-chatbot-close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="leadrat-chatbot-status">
        <span class="leadrat-status-item">
          <span class="leadrat-status-indicator connected"></span>
          <span>Ready</span>
        </span>
      </div>

      <iframe id="leadrat-chatbot-iframe"
        src="${config.chatbotUrl}/ai-assistant?embedded=true"
        frameborder="0"
        class="leadrat-chatbot-iframe"
        title="Aria - Real Estate AI Assistant">
      </iframe>
    </div>
  `;

  // Create styles
  const style = document.createElement('style');
  style.textContent = `
    * {
      --leadrat-primary: #667eea;
      --leadrat-primary-dark: #764ba2;
      --leadrat-bg-dark: #111827;
      --leadrat-bg-lighter: #1f2937;
      --leadrat-text: #ffffff;
      --leadrat-border: #374151;
      --leadrat-success: #4CAF50;
    }

    #leadrat-chatbot-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      position: fixed;
      z-index: 9999;
      ${config.position === 'bottom-right' ? 'bottom: 20px; right: 20px;' : ''}
      ${config.position === 'bottom-left' ? 'bottom: 20px; left: 20px;' : ''}
      ${config.position === 'top-right' ? 'top: 20px; right: 20px;' : ''}
      ${config.position === 'top-left' ? 'top: 20px; left: 20px;' : ''}
    }

    .leadrat-chatbot-button {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--leadrat-primary) 0%, var(--leadrat-primary-dark) 100%);
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
      position: relative;
    }

    .leadrat-chatbot-button:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.6);
    }

    .leadrat-chatbot-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #ef4444;
      color: white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      border: 2px solid var(--leadrat-bg-dark);
    }

    .leadrat-chatbot-window {
      position: absolute;
      ${config.position === 'bottom-right' ? 'bottom: 80px; right: 0;' : ''}
      ${config.position === 'bottom-left' ? 'bottom: 80px; left: 0;' : ''}
      ${config.position === 'top-right' ? 'top: 80px; right: 0;' : ''}
      ${config.position === 'top-left' ? 'top: 80px; left: 0;' : ''}
      width: 420px;
      height: 600px;
      max-height: 80vh;
      background: var(--leadrat-bg-dark);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp 0.3s ease;
    }

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

    .leadrat-chatbot-header {
      background: linear-gradient(135deg, var(--leadrat-primary) 0%, var(--leadrat-primary-dark) 100%);
      color: white;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .leadrat-chatbot-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .leadrat-chatbot-header p {
      margin: 4px 0 0 0;
      font-size: 12px;
      opacity: 0.9;
    }

    .leadrat-chatbot-close {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
    }

    .leadrat-chatbot-close:hover {
      transform: rotate(90deg);
    }

    .leadrat-chatbot-status {
      background: var(--leadrat-bg-lighter);
      border-bottom: 1px solid var(--leadrat-border);
      padding: 8px 12px;
      display: flex;
      gap: 16px;
      font-size: 11px;
    }

    .leadrat-status-item {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #9ca3af;
    }

    .leadrat-status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #fbbf24;
      animation: pulse 1.5s infinite;
    }

    .leadrat-status-indicator.connected {
      background: var(--leadrat-success);
      animation: none;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .leadrat-chatbot-iframe {
      flex: 1;
      border: none;
    }

    @media (max-width: 768px) {
      #leadrat-chatbot-container {
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        top: auto !important;
      }

      .leadrat-chatbot-window {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        width: 100%;
        height: 100%;
        max-height: 100vh;
        border-radius: 0;
      }

      .leadrat-chatbot-button {
        display: none;
      }
    }

    ${config.theme === 'light' ? `
      * {
        --leadrat-bg-dark: #ffffff;
        --leadrat-bg-lighter: #f3f4f6;
        --leadrat-text: #111827;
        --leadrat-border: #d1d5db;
      }

      .leadrat-chatbot-window {
        background: white;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      }

      .leadrat-status-item {
        color: #6b7280;
      }
    ` : ''}
  `;

  document.head.appendChild(style);
  document.body.appendChild(container);

  const button = document.getElementById('leadrat-chatbot-button');
  const window_ = document.getElementById('leadrat-chatbot-window');
  const closeBtn = document.getElementById('leadrat-chatbot-close');

  button.addEventListener('click', () => {
    window_.style.display = window_.style.display === 'none' ? 'flex' : 'none';
    button.style.opacity = window_.style.display === 'none' ? '1' : '0.5';
  });

  closeBtn.addEventListener('click', () => {
    window_.style.display = 'none';
    button.style.opacity = '1';
  });

  window.leadratChatbot = {
    open: () => {
      window_.style.display = 'flex';
      button.style.opacity = '0.5';
    },
    close: () => {
      window_.style.display = 'none';
      button.style.opacity = '1';
    },
    toggle: () => {
      if (window_.style.display === 'none') {
        window.leadratChatbot.open();
      } else {
        window.leadratChatbot.close();
      }
    }
  };

  console.log('✅ Leadrat AI Chatbot initialized');
  console.log('🌐 URL:', config.chatbotUrl);
  console.log('💡 API: window.leadratChatbot.open() / .close() / .toggle()');
})();
