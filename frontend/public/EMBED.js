/**
 * Leadrat Real Estate AI Chatbot - Embed Script
 * Version 3.0 - Inline Widget with Floating Button
 *
 * Opens chatbot as an inline widget at bottom-right corner
 * Shows floating button, click to toggle widget
 *
 * USAGE:
 * <script async src="http://localhost:3000/EMBED.js"></script>
 */

(function() {
  'use strict';

  const config = {
    chatbotUrl: document.currentScript?.getAttribute('data-chatbot-url') || 'http://localhost:3000',
  };

  if (window.__leadratChatbotInit) return;
  window.__leadratChatbotInit = true;

  // Create container for floating button and widget
  const container = document.createElement('div');
  container.id = 'leadrat-chatbot-container';
  container.innerHTML = `
    <div id="leadrat-chatbot-button" class="leadrat-chatbot-button" title="Open AI Assistant">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span class="leadrat-chatbot-badge">1</span>
    </div>
    <div id="leadrat-chatbot-widget" class="leadrat-chatbot-widget" style="display: none;">
      <iframe
        id="leadrat-chatbot-iframe"
        src="${config.chatbotUrl}/embed"
        style="width: 100%; height: 100%; border: none; border-radius: 12px;"
        allow="geolocation; microphone; camera"
      ></iframe>
    </div>
  `;

  // Create styles for floating button and widget
  const style = document.createElement('style');
  style.textContent = `
    #leadrat-chatbot-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      position: fixed;
      z-index: 9999;
      bottom: 20px;
      right: 20px;
    }

    .leadrat-chatbot-button {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
      border: 2px solid #ffffff;
    }

    .leadrat-chatbot-widget {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 420px;
      height: 600px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      animation: slideUp 0.3s ease-out;
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

    @media (max-width: 480px) {
      .leadrat-chatbot-widget {
        width: calc(100vw - 40px);
        height: 70vh;
        max-width: 420px;
        bottom: auto;
        top: 50%;
        right: 20px;
        left: 20px;
        transform: translateY(-50%);
      }

      .leadrat-chatbot-widget[style*="display: block"] {
        animation: slideUp 0.3s ease-out;
      }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(container);

  const button = document.getElementById('leadrat-chatbot-button');
  const widget = document.getElementById('leadrat-chatbot-widget');
  let isOpen = false;

  // Toggle widget visibility
  function toggleChatWidget() {
    isOpen = !isOpen;
    widget.style.display = isOpen ? 'block' : 'none';
    button.style.transform = isOpen ? 'scale(0.95)' : 'scale(1)';
  }

  function openChatWidget() {
    if (!isOpen) {
      isOpen = true;
      widget.style.display = 'block';
    }
  }

  function closeChatWidget() {
    if (isOpen) {
      isOpen = false;
      widget.style.display = 'none';
    }
  }

  // Button click opens/closes widget
  button.addEventListener('click', toggleChatWidget);

  // Close widget when clicking outside
  document.addEventListener('click', function(event) {
    if (isOpen && !container.contains(event.target)) {
      closeChatWidget();
    }
  });

  // Global API for external control
  window.leadratChatbot = {
    open: function() {
      openChatWidget();
    },
    close: function() {
      closeChatWidget();
    },
    toggle: function() {
      toggleChatWidget();
    }
  };

  console.log('✅ Leadrat AI Chatbot initialized');
  console.log('🌐 URL:', config.chatbotUrl);
  console.log('💡 API: window.leadratChatbot.open() / .close() / .toggle()');
  console.log('📝 Shows as inline widget in bottom-right corner');
})();
