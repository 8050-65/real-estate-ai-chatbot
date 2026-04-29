/**
 * Leadrat Real Estate AI Chatbot - Embed Script
 * Version 4.0 - Iframe-based Widget
 *
 * Injects floating button + iframe widget at bottom-right
 * USAGE: <script async src="http://localhost:3000/EMBED.js"></script>
 */

(function() {
  'use strict';

  const config = {
    chatbotUrl: document.currentScript?.getAttribute('data-chatbot-url') || 'http://localhost:3000',
  };

  if (window.__leadratChatbotInit) return;
  window.__leadratChatbotInit = true;

  // Create container
  const container = document.createElement('div');
  container.id = 'leadrat-chatbot-container';
  container.style.all = 'initial';

  // Create floating button
  const button = document.createElement('button');
  button.id = 'leadrat-chatbot-button';
  button.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;

  button.style.position = 'fixed';
  button.style.bottom = '24px';
  button.style.right = '24px';
  button.style.width = '60px';
  button.style.height = '60px';
  button.style.borderRadius = '50%';
  button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.cursor = 'pointer';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
  button.style.transition = 'all 0.3s ease';
  button.style.zIndex = '1000000';
  button.style.padding = '0';
  button.style.fontFamily = 'inherit';

  // Button hover effects
  button.addEventListener('mouseenter', function() {
    this.style.transform = 'scale(1.1)';
    this.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.6)';
  });

  button.addEventListener('mouseleave', function() {
    this.style.transform = 'scale(1)';
    this.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
  });

  // Create iframe for widget
  const iframe = document.createElement('iframe');
  iframe.id = 'leadrat-chatbot-iframe';
  iframe.src = config.chatbotUrl + '/embed';
  iframe.style.position = 'fixed';
  iframe.style.right = '24px';
  iframe.style.bottom = '90px';
  iframe.style.width = '360px';
  iframe.style.height = '520px';
  iframe.style.maxWidth = 'calc(100vw - 32px)';
  iframe.style.maxHeight = 'calc(100vh - 120px)';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '16px';
  iframe.style.overflow = 'hidden';
  iframe.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.25)';
  iframe.style.zIndex = '999999';
  iframe.style.display = 'none';
  iframe.style.background = '#ffffff';

  // Add to page
  container.appendChild(button);
  container.appendChild(iframe);
  document.body.appendChild(container);

  let isOpen = false;

  // Toggle function
  function toggle() {
    isOpen = !isOpen;
    iframe.style.display = isOpen ? 'block' : 'none';
  }

  function open() {
    if (!isOpen) {
      isOpen = true;
      iframe.style.display = 'block';
    }
  }

  function close() {
    if (isOpen) {
      isOpen = false;
      iframe.style.display = 'none';
    }
  }

  // Button click
  button.addEventListener('click', toggle);

  // Global API
  window.leadratChatbot = {
    open: open,
    close: close,
    toggle: toggle,
  };

  console.log('✅ Leadrat AI Chatbot initialized');
  console.log('🌐 URL:', config.chatbotUrl);
  console.log('💡 API: window.leadratChatbot.open() / .close() / .toggle()');
})();
