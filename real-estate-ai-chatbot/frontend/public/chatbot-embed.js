/**
 * Leadrat Real Estate AI Chatbot - Embed Script
 * Customer-facing widget for property/project search and lead capture
 *
 * RECOMMENDED: Use window.LeadratChatConfig for configuration
 *
 * <script>
 * window.LeadratChatConfig = {
 *   apiUrl: "https://real-estate-rag-dev.onrender.com",
 *   tenantId: "dubait11",
 *   botName: "Aria",
 *   botSubtitle: "Real Estate AI",
 *   primaryColor: "#6C63FF"
 * };
 * </script>
 * <script async src="https://leadrat-chat-widget.pages.dev/chatbot-embed.js"></script>
 *
 * ALTERNATIVE: Use data attributes
 * <script async src="https://leadrat-chat-widget.pages.dev/chatbot-embed.js"
 *   data-tenant-id="dubait11"
 *   data-api-url="https://real-estate-rag-dev.onrender.com"
 *   data-position="bottom-right"
 *   data-theme="dark">
 * </script>
 */

(function() {
  'use strict';

  // Configuration - Support both window.LeadratChatConfig and data attributes
  const windowConfig = window.LeadratChatConfig || {};
  const scriptEl = document.currentScript;

  // Detect environment (local vs production)
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // Default URLs based on environment - IMPORTANT: apiUrl must include full /api/v1/chat/message path
  const defaultChatbotUrl = isLocalhost ? 'http://localhost:3000' : 'https://leadrat-chat-widget.pages.dev';
  const defaultApiUrl = isLocalhost ? 'http://localhost:8000/api/v1/chat/message' : 'https://real-estate-rag-dev.onrender.com/api/v1/chat/message';

  const config = {
    // Frontend URL (where the chatbot UI is hosted)
    chatbotUrl: windowConfig.chatbotUrl || scriptEl?.getAttribute('data-chatbot-url') || defaultChatbotUrl,

    // Backend API Base URL - dynamically selected based on environment
    apiUrl: windowConfig.apiUrl || scriptEl?.getAttribute('data-api-url') || defaultApiUrl,

    // Tenant ID - Support multiple fallbacks for multitenancy
    tenantId: windowConfig.tenantId || scriptEl?.getAttribute('data-tenant-id') || getUrlParam('tenantId') || 'dubait11',

    // Custom branding
    botName: windowConfig.botName || 'Aria',
    botSubtitle: windowConfig.botSubtitle || 'Real Estate AI',
    primaryColor: windowConfig.primaryColor || '#6C63FF',

    position: scriptEl?.getAttribute('data-position') || 'bottom-right',
    theme: scriptEl?.getAttribute('data-theme') || 'dark',
  };

  // Debug: Log resolved configuration
  console.log('[Leadrat Chatbot] Resolved configuration:', {
    isLocalhost,
    chatbotUrl: config.chatbotUrl,
    apiUrl: config.apiUrl,
    tenantId: config.tenantId,
    iframeSrc: `${config.chatbotUrl}/embedded?tenantId=${config.tenantId}&apiUrl=${encodeURIComponent(config.apiUrl)}`
  });

  // Helper to read URL query parameters
  function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  // Prevent multiple initializations
  if (window.__leadratChatbotInitialized) {
    return;
  }
  window.__leadratChatbotInitialized = true;

  // Create container HTML
  function createChatbotHTML() {
    const container = document.createElement('div');
    container.id = 'leadrat-chatbot-container';

    // Create button
    const button = document.createElement('button');
    button.id = 'leadrat-chatbot-button';
    button.className = 'leadrat-chatbot-button';
    button.setAttribute('aria-label', 'Open chat');
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span class="leadrat-chatbot-badge">1</span>
    `;

    // Create chat window
    const window_ = document.createElement('div');
    window_.id = 'leadrat-chatbot-window';
    window_.className = 'leadrat-chatbot-window';
    window_.style.display = 'none';
    window_.innerHTML = `
      <div class="leadrat-chatbot-header">
        <div class="leadrat-chatbot-header-content">
          <h3>${config.botName}</h3>
          <p>${config.botSubtitle}</p>
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
          <span class="leadrat-status-text">Backend Connected</span>
        </span>
      </div>
      <iframe
        id="leadrat-chatbot-iframe"
        src="${config.chatbotUrl}/embedded?tenantId=${config.tenantId}&apiUrl=${encodeURIComponent(config.apiUrl)}"
        frameborder="0"
        allowfullscreen="true"
        class="leadrat-chatbot-iframe"
        allow="camera;microphone">
      </iframe>
    `;

    container.appendChild(button);
    container.appendChild(window_);
    return container;
  }

  // Create styles
  function createStyles() {
    const style = document.createElement('style');

    // Build position CSS based on config
    let positionCSS = '';
    if (config.position === 'bottom-right') positionCSS = 'bottom: 20px; right: 20px;';
    else if (config.position === 'bottom-left') positionCSS = 'bottom: 20px; left: 20px;';
    else if (config.position === 'top-right') positionCSS = 'top: 20px; right: 20px;';
    else if (config.position === 'top-left') positionCSS = 'top: 20px; left: 20px;';

    let windowPositionCSS = '';
    if (config.position === 'bottom-right') windowPositionCSS = 'bottom: 90px; right: 20px;';
    else if (config.position === 'bottom-left') windowPositionCSS = 'bottom: 90px; left: 20px;';
    else if (config.position === 'top-right') windowPositionCSS = 'top: 90px; right: 20px;';
    else if (config.position === 'top-left') windowPositionCSS = 'top: 90px; left: 20px;';

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
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        position: fixed;
        z-index: 9999;
        ${positionCSS}
      }

      /* Floating Button */
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

      .leadrat-chatbot-button:active {
        transform: scale(0.95);
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

      /* Chat Window */
      .leadrat-chatbot-window {
        position: absolute;
        ${windowPositionCSS}
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

      /* Header */
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

      /* Status Bar */
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
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      /* iframe */
      .leadrat-chatbot-iframe {
        flex: 1;
        border: none;
      }

      /* Mobile Responsive */
      @media (max-width: 768px) {
        #leadrat-chatbot-container {
          bottom: 0;
          left: 0;
          right: 0;
          top: 0;
        }

        .leadrat-chatbot-window {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          top: 0;
          width: 100%;
          height: 100%;
          max-height: 100vh;
          border-radius: 0;
          animation: slideUp 0.2s ease;
        }

        .leadrat-chatbot-button {
          display: none;
        }
      }

      /* Dark theme (default) */
      \${config.theme === 'dark' ? \`
        .leadrat-chatbot-window {
          background: var(--leadrat-bg-dark);
          color: var(--leadrat-text);
        }

        .leadrat-chatbot-header {
          background: linear-gradient(135deg, var(--leadrat-primary) 0%, var(--leadrat-primary-dark) 100%);
        }
      \` : ''}

      /* Light theme */
      \${config.theme === 'light' ? \`
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
      \` : ''}
    `;

    document.head.appendChild(style);
  }

  // Initialize chatbot
  function initialize() {
    // Create styles
    createStyles();

    // Create HTML
    const chatbotContainer = createChatbotHTML();
    document.body.appendChild(chatbotContainer);

    // Get elements
    const button = document.getElementById('leadrat-chatbot-button');
    const window_ = document.getElementById('leadrat-chatbot-window');
    const closeBtn = document.getElementById('leadrat-chatbot-close');

    // Toggle chat window
    button.addEventListener('click', () => {
      if (window_.style.display === 'none') {
        window_.style.display = 'flex';
        button.style.opacity = '0.5';
      } else {
        window_.style.display = 'none';
        button.style.opacity = '1';
      }
    });

    // Close chat window
    closeBtn.addEventListener('click', () => {
      window_.style.display = 'none';
      button.style.opacity = '1';
    });

    // Programmatic API
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
    console.log('Usage: window.leadratChatbot.open() / .close() / .toggle()');
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
