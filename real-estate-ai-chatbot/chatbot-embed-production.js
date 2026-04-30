/**
 * Leadrat Real Estate AI Chatbot - Production Embed Script
 *
 * Production URL: https://chatbot-leadrat.vercel.app
 *
 * USAGE 1: Simple (uses production URL)
 * =====================================
 * <script async src="https://chatbot-leadrat.vercel.app/chatbot-embed.js"></script>
 *
 * USAGE 2: Custom URL (override production URL)
 * =============================================
 * <script async src="https://chatbot-leadrat.vercel.app/chatbot-embed.js"
 *   data-chatbot-url="https://your-custom-url.com">
 * </script>
 *
 * USAGE 3: Full configuration
 * ===========================
 * <script async src="https://chatbot-leadrat.vercel.app/chatbot-embed.js"
 *   data-chatbot-url="https://chatbot-leadrat.vercel.app"
 *   data-position="bottom-right"
 *   data-theme="dark">
 * </script>
 *
 * Configuration Options:
 * - data-chatbot-url: The URL of the chatbot app (default: https://chatbot-leadrat.vercel.app)
 * - data-position: "bottom-right" | "bottom-left" | "top-right" | "top-left" (default: bottom-right)
 * - data-theme: "dark" | "light" (default: dark)
 */

(function() {
  'use strict';

  // Configuration with PRODUCTION URL
  const config = {
    chatbotUrl: document.currentScript?.getAttribute('data-chatbot-url') || 'https://chatbot-leadrat.vercel.app',
    position: document.currentScript?.getAttribute('data-position') || 'bottom-right',
    theme: document.currentScript?.getAttribute('data-theme') || 'dark',
    title: 'Aria - Real Estate Assistant',
    subtitle: 'Ask about properties, payment plans, RERA & more',
  };

  // Prevent multiple initializations
  if (window.__leadratChatbotInitialized) {
    console.warn('⚠️  Leadrat Chatbot already initialized');
    return;
  }
  window.__leadratChatbotInitialized = true;

  // Create container HTML
  function createChatbotHTML() {
    const container = document.createElement('div');
    container.id = 'leadrat-chatbot-container';
    container.innerHTML = `
      <!-- Floating Button -->
      <div id="leadrat-chatbot-button" class="leadrat-chatbot-button" title="Chat with Aria">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="leadrat-chatbot-badge">1</span>
      </div>

      <!-- Chat Window (Hidden by default) -->
      <div id="leadrat-chatbot-window" class="leadrat-chatbot-window" style="display: none;">
        <!-- Header -->
        <div class="leadrat-chatbot-header">
          <div class="leadrat-chatbot-header-content">
            <h3>${config.title}</h3>
            <p>${config.subtitle}</p>
          </div>
          <button id="leadrat-chatbot-close" class="leadrat-chatbot-close" title="Close chat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Status Bar (simplified for production) -->
        <div class="leadrat-chatbot-status">
          <span class="leadrat-status-item">
            <span class="leadrat-status-indicator connected"></span>
            <span class="leadrat-status-text">Ready</span>
          </span>
          <span class="leadrat-status-item">
            <span class="leadrat-status-indicator" id="service-status"></span>
            <span class="leadrat-status-text" id="service-text">Connecting...</span>
          </span>
        </div>

        <!-- Chat Frame - loads with embedded=true for clean UI -->
        <iframe
          id="leadrat-chatbot-iframe"
          src="${config.chatbotUrl}/ai-assistant?embedded=true"
          frameborder="0"
          allow="microphone; camera"
          class="leadrat-chatbot-iframe"
          title="Aria - Real Estate AI Assistant">
        </iframe>
      </div>
    `;

    return container;
  }

  // Create styles
  function createStyles() {
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
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        position: fixed;
        z-index: 9999;
        ${config.position === 'bottom-right' ? 'bottom: 20px; right: 20px;' : ''}
        ${config.position === 'bottom-left' ? 'bottom: 20px; left: 20px;' : ''}
        ${config.position === 'top-right' ? 'top: 20px; right: 20px;' : ''}
        ${config.position === 'top-left' ? 'top: 20px; left: 20px;' : ''}
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
        animation: none;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      /* iframe */
      .leadrat-chatbot-iframe {
        flex: 1;
        border: none;
        background: var(--leadrat-bg-dark);
      }

      /* Mobile Responsive */
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
          animation: slideUp 0.2s ease;
        }

        .leadrat-chatbot-button {
          display: none;
        }
      }

      /* Dark theme (default) */
      ${config.theme === 'dark' ? `
        .leadrat-chatbot-window {
          background: var(--leadrat-bg-dark);
          color: var(--leadrat-text);
        }

        .leadrat-chatbot-header {
          background: linear-gradient(135deg, var(--leadrat-primary) 0%, var(--leadrat-primary-dark) 100%);
        }
      ` : ''}

      /* Light theme */
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
  }

  // Check service health
  function checkServiceHealth() {
    const serviceStatus = document.getElementById('service-status');
    const serviceText = document.getElementById('service-text');

    if (!serviceStatus || !serviceText) return;

    // Perform a simple health check by fetching the chatbot page
    fetch(`${config.chatbotUrl}/api/health`, { method: 'GET' })
      .then(response => {
        if (response.ok) {
          serviceStatus.style.background = '#4CAF50';
          serviceText.textContent = 'Service Ready';
        } else {
          serviceStatus.style.background = '#fbbf24';
          serviceText.textContent = 'Service Busy';
        }
      })
      .catch(() => {
        serviceStatus.style.background = '#ef4444';
        serviceText.textContent = 'Service Error';
      });
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

    // Check service health
    checkServiceHealth();
    setInterval(checkServiceHealth, 30000);

    // Global API for external control
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

    console.log('✅ Leadrat AI Chatbot initialized successfully');
    console.log('🌐 Chatbot URL:', config.chatbotUrl);
    console.log('📍 Position:', config.position);
    console.log('🎨 Theme:', config.theme);
    console.log('💡 Usage: window.leadratChatbot.open() / .close() / .toggle()');
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
