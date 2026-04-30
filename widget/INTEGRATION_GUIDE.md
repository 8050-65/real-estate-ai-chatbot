# Leadrat Chat Widget - Integration Guide

This guide shows how to integrate the Leadrat Chat Widget into different platforms and frameworks.

## Prerequisites

- The widget must be deployed to a CDN (see deployment section in README.md)
- Your backend `/api/v1/chat/message` endpoint must be accessible and have CORS enabled
- Supported browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## 1. Plain HTML / Static Sites

### Basic Integration

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <h1>Welcome to Our Site</h1>
  <p>Chat with our AI assistant in the bottom-right corner.</p>

  <!-- Configure the widget -->
  <script>
    window.LeadratChatConfig = {
      apiUrl: "https://your-api.com/api/v1/chat",
      botName: "Real Estate Assistant",
      botSubtitle: "Ask me anything",
      primaryColor: "#6C63FF",
      position: "bottom-right",
      tenantId: "your-tenant-id"
    };
  </script>

  <!-- Load the widget -->
  <script src="https://cdn.yourdomain.com/chatbot/leadrat-chat.js" async></script>
</body>
</html>
```

## 2. React Applications

### Method A: Add to public/index.html (Recommended)

```html
<!-- public/index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>My React App</title>
</head>
<body>
  <div id="root"></div>

  <script>
    window.LeadratChatConfig = {
      apiUrl: "https://your-api.com/api/v1/chat",
      botName: "AI Assistant",
      primaryColor: "#6C63FF"
    };
  </script>
  <script src="https://cdn.yourdomain.com/chatbot/leadrat-chat.js" async></script>
</body>
</html>
```

### Method B: Dynamically Load in React Component

```jsx
// components/ChatWidget.tsx
import { useEffect } from 'react';

export function ChatWidget() {
  useEffect(() => {
    // Configure widget
    window.LeadratChatConfig = {
      apiUrl: "https://your-api.com/api/v1/chat",
      botName: "AI Assistant",
      primaryColor: "#6C63FF"
    };

    // Load widget script
    const script = document.createElement('script');
    script.src = 'https://cdn.yourdomain.com/chatbot/leadrat-chat.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return null; // Widget is injected into DOM by the script
}

// App.tsx
import { ChatWidget } from './components/ChatWidget';

export default function App() {
  return (
    <>
      <ChatWidget />
      <main>
        {/* Your app content */}
      </main>
    </>
  );
}
```

### Method C: Environment-Based Config

```jsx
// lib/chatwidget.ts
export function initChatWidget() {
  const config = {
    apiUrl: process.env.REACT_APP_CHAT_API_URL || "https://api.example.com/api/v1/chat",
    botName: process.env.REACT_APP_BOT_NAME || "AI Assistant",
    primaryColor: process.env.REACT_APP_PRIMARY_COLOR || "#6C63FF",
    tenantId: process.env.REACT_APP_TENANT_ID || "default"
  };

  window.LeadratChatConfig = config;

  const script = document.createElement('script');
  script.src = process.env.REACT_APP_CHAT_WIDGET_URL || 
    'https://cdn.yourdomain.com/chatbot/leadrat-chat.js';
  script.async = true;
  document.body.appendChild(script);
}

// App.tsx
import { useEffect } from 'react';
import { initChatWidget } from './lib/chatwidget';

export default function App() {
  useEffect(() => {
    initChatWidget();
  }, []);

  return <main>{/* Your app */}</main>;
}
```

## 3. Next.js Applications

### With _app.tsx (App Router)

```tsx
// app/layout.tsx
'use client';

import { useEffect } from 'react';

export default function RootLayout({ children }) {
  useEffect(() => {
    window.LeadratChatConfig = {
      apiUrl: process.env.NEXT_PUBLIC_CHAT_API_URL,
      botName: "AI Assistant",
      primaryColor: "#6C63FF"
    };

    const script = document.createElement('script');
    script.src = process.env.NEXT_PUBLIC_CHAT_WIDGET_URL;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### Or in public/index.html (Pages Router)

```html
<!-- public/index.html or included in _document.tsx -->
<script>
  window.LeadratChatConfig = {
    apiUrl: "${process.env.NEXT_PUBLIC_CHAT_API_URL}",
    botName: "AI Assistant",
    primaryColor: "#6C63FF"
  };
</script>
<script src="${process.env.NEXT_PUBLIC_CHAT_WIDGET_URL}" async></script>
```

## 4. Vue.js Applications

```vue
<!-- App.vue or ChatWidget.vue -->
<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  window.LeadratChatConfig = {
    apiUrl: import.meta.env.VITE_CHAT_API_URL,
    botName: "AI Assistant",
    primaryColor: "#6C63FF"
  };

  const script = document.createElement('script');
  script.src = import.meta.env.VITE_CHAT_WIDGET_URL;
  script.async = true;
  document.body.appendChild(script);
});
</script>

<template>
  <div>
    <!-- Your app content -->
  </div>
</template>
```

## 5. WordPress

### Method A: Via Code Snippets Plugin

1. Install & activate "Code Snippets" plugin
2. Create new snippet:

```html
<!-- <head> section -->
<script>
  window.LeadratChatConfig = {
    apiUrl: "https://your-api.com/api/v1/chat",
    botName: "AI Assistant",
    primaryColor: "#6C63FF"
  };
</script>
<script src="https://cdn.yourdomain.com/chatbot/leadrat-chat.js" async></script>
```

3. Set to "Run everywhere"

### Method B: Via Child Theme

```php
<!-- wp-content/themes/your-child-theme/functions.php -->
<?php
function add_leadrat_chat_widget() {
  ?>
  <script>
    window.LeadratChatConfig = {
      apiUrl: "https://your-api.com/api/v1/chat",
      botName: "AI Assistant",
      primaryColor: "#6C63FF"
    };
  </script>
  <script src="https://cdn.yourdomain.com/chatbot/leadrat-chat.js" async></script>
  <?php
}
add_action('wp_footer', 'add_leadrat_chat_widget');
?>
```

### Method C: Via Theme Customizer

1. Go to Appearance → Customize
2. Find "Additional CSS" or "Custom Code"
3. Add the script tags in the custom code section

## 6. Webflow

1. Go to Project Settings → Custom Code → Footer Code
2. Add:

```html
<script>
  window.LeadratChatConfig = {
    apiUrl: "https://your-api.com/api/v1/chat",
    botName: "AI Assistant",
    primaryColor: "#6C63FF"
  };
</script>
<script src="https://cdn.yourdomain.com/chatbot/leadrat-chat.js" async></script>
```

## 7. Shopify

### Via Theme Code

1. Go to Online Store → Themes → Edit Code
2. Open `theme.liquid`
3. Add before `</body>`:

```liquid
<script>
  window.LeadratChatConfig = {
    apiUrl: "https://your-api.com/api/v1/chat",
    botName: "AI Assistant",
    primaryColor: "#6C63FF"
  };
</script>
<script src="https://cdn.yourdomain.com/chatbot/leadrat-chat.js" async></script>
```

## 8. Wix

1. Go to Website → Pages (or specific page)
2. Add → Embed Code
3. Paste:

```html
<script>
  window.LeadratChatConfig = {
    apiUrl: "https://your-api.com/api/v1/chat",
    botName: "AI Assistant",
    primaryColor: "#6C63FF"
  };
</script>
<script src="https://cdn.yourdomain.com/chatbot/leadrat-chat.js" async></script>
```

## 9. Squarespace

1. Go to Settings → Advanced → Code Injection
2. Paste in Footer Code section:

```html
<script>
  window.LeadratChatConfig = {
    apiUrl: "https://your-api.com/api/v1/chat",
    botName: "AI Assistant",
    primaryColor: "#6C63FF"
  };
</script>
<script src="https://cdn.yourdomain.com/chatbot/leadrat-chat.js" async></script>
```

## 10. Angular Applications

```typescript
// app.component.ts
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `<div></div>`
})
export class AppComponent implements OnInit {
  ngOnInit() {
    this.initChatWidget();
  }

  private initChatWidget() {
    (window as any).LeadratChatConfig = {
      apiUrl: environment.chatApiUrl,
      botName: "AI Assistant",
      primaryColor: "#6C63FF"
    };

    const script = document.createElement('script');
    script.src = environment.chatWidgetUrl;
    script.async = true;
    document.body.appendChild(script);
  }
}
```

## 11. Svelte Applications

```svelte
<!-- App.svelte -->
<script>
  import { onMount } from 'svelte';

  onMount(() => {
    window.LeadratChatConfig = {
      apiUrl: "https://your-api.com/api/v1/chat",
      botName: "AI Assistant",
      primaryColor: "#6C63FF"
    };

    const script = document.createElement('script');
    script.src = "https://cdn.yourdomain.com/chatbot/leadrat-chat.js";
    script.async = true;
    document.body.appendChild(script);
  });
</script>

<main>
  <!-- Your app content -->
</main>
```

## Configuration Best Practices

### 1. Use Environment Variables

```bash
# .env or .env.local
VITE_CHAT_API_URL=https://api.example.com/api/v1/chat
VITE_CHAT_WIDGET_URL=https://cdn.example.com/chatbot/leadrat-chat.js
VITE_BOT_NAME=My AI Assistant
VITE_PRIMARY_COLOR=#6C63FF
VITE_TENANT_ID=my-tenant
```

### 2. Handle Different Environments

```javascript
const isDev = window.location.hostname === 'localhost';
const apiUrl = isDev 
  ? 'http://localhost:8000/api/v1/chat'
  : 'https://api.example.com/api/v1/chat';

window.LeadratChatConfig = {
  apiUrl: apiUrl,
  botName: "AI Assistant",
  primaryColor: "#6C63FF"
};
```

### 3. Defer Non-Critical

```html
<!-- Load chat widget after main content -->
<script defer src="https://cdn.yourdomain.com/chatbot/leadrat-chat.js"></script>
```

## Customization by Platform

### Dark Mode Support

```javascript
const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
const primaryColor = isDarkMode ? '#8B81FF' : '#6C63FF';

window.LeadratChatConfig = {
  apiUrl: "https://your-api.com/api/v1/chat",
  primaryColor: primaryColor
};
```

### Branding per Region

```javascript
const region = document.documentElement.lang;
const botNames = {
  en: "AI Assistant",
  es: "Asistente de IA",
  fr: "Assistant IA",
  de: "KI-Assistent"
};

window.LeadratChatConfig = {
  apiUrl: "https://your-api.com/api/v1/chat",
  botName: botNames[region] || "AI Assistant",
  tenantId: region
};
```

## Testing Integration

### Before Going Live

1. **Test in all target browsers**
   ```bash
   # Use BrowserStack or similar for cross-browser testing
   ```

2. **Check CORS headers**
   ```bash
   curl -H "Origin: https://yourdomain.com" \
        -H "Access-Control-Request-Method: POST" \
        -X OPTIONS https://api.example.com/api/v1/chat/message
   ```

3. **Test network conditions**
   - Use Chrome DevTools Network throttling
   - Test on slow 3G, fast 4G
   - Verify behavior with offline mode

4. **Verify API response format**
   ```bash
   curl -X POST https://your-api.com/api/v1/chat/message \
     -H "Content-Type: application/json" \
     -d '{"message":"test","session_id":"test","tenant_id":"test","conversation_history":[]}'
   ```

## Troubleshooting Integration

### Widget Not Appearing

```javascript
// Debug: Check if config is set
console.log(window.LeadratChatConfig);

// Debug: Check if script loaded
console.log(typeof window.LeadratChat);
```

### CORS Errors

Make sure backend has:
```
Access-Control-Allow-Origin: * (or your specific domain)
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### API Connection Failing

```javascript
// Test API manually
fetch('https://your-api.com/api/v1/chat/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'test',
    session_id: 'test',
    tenant_id: 'test',
    conversation_history: []
  })
}).then(r => r.json()).then(console.log);
```

## Performance Tips

1. **Use async loading** - Add `async` to script tag
2. **Defer if not critical** - Use `defer` attribute
3. **Lazy load** - Load script on user interaction
4. **Cache aggressively** - Set long Cache-Control headers
5. **Use CDN edge locations** - Serve from closest region

## Security Considerations

1. **Verify CORS origin** - Backend should validate requesting domain
2. **Don't expose secrets** - Never put API keys in config
3. **Validate messages** - Backend validates all user input
4. **Rate limiting** - Implement rate limits on chat endpoint
5. **Content validation** - Sanitize/validate responses

## Monitoring

Add tracking for:
- Widget load failures
- Chat API errors
- User engagement (messages sent)
- Performance metrics
- Browser compatibility issues

## Support

For integration issues:
1. Check browser console for errors
2. Verify API endpoint is responding
3. Check CORS headers
4. Review this guide for your platform
5. Contact support with error details
