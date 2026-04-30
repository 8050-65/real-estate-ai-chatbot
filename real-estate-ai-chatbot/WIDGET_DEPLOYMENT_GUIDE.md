# Leadrat AI Chatbot Widget - Deployment Guide

## Overview

You now have a production-ready embeddable chatbot widget that can be integrated into any website with a single `<script>` tag.

## What's Been Built

```
widget/
├── src/
│   ├── leadrat-chat.ts       # Main embed script (4.3 KB minified)
│   └── chat-ui.html          # Chat UI HTML (20 KB)
│
├── dist/                      # Build output (ready for CDN)
│   ├── leadrat-chat.js        # ✅ Minified embed script
│   └── chat-ui.html           # ✅ Chat UI
│
├── deploy/
│   └── upload-to-cdn.sh       # Deployment script
│
├── README.md                  # Full documentation
├── INTEGRATION_GUIDE.md        # Platform-specific integration
├── serve-local.js             # Local test server
├── test-local.html            # Local testing interface
└── package.json               # Build configuration
```

## Quick Start (5 minutes)

### 1. Test Locally

```bash
# Terminal 1: Start backend (if not running)
cd backend-ai
python main.py  # or docker compose up

# Terminal 2: Start widget test server
cd widget
node serve-local.js
```

Then open `http://localhost:3000` in your browser.

### 2. Verify API Connection

1. Open test page: `http://localhost:3000`
2. Enter API URL: `http://localhost:8000/api/v1/chat`
3. Click "Test API Connection"
4. You should see: ✅ API connection successful!

### 3. Load Widget

1. Click "Load Widget"
2. You should see a purple chat button in the bottom-right corner
3. Click the button to open the chat
4. Type a message and verify it connects to your backend

## Deployment Checklist

- [ ] **Test locally** - Verify widget works with your backend
- [ ] **Check API CORS** - Ensure `/api/v1/chat/message` has CORS headers
- [ ] **Build production** - Run `npm run build` in widget directory
- [ ] **Deploy to CDN** - Upload `dist/` files to your CDN
- [ ] **Set cache headers** - Configure CDN caching
- [ ] **Test from CDN** - Verify widget loads from CDN URL
- [ ] **Integration test** - Add widget to staging site
- [ ] **Performance check** - Verify load time and functionality
- [ ] **Browser testing** - Test in Chrome, Firefox, Safari, Edge
- [ ] **Mobile testing** - Test on iOS and Android
- [ ] **Documentation** - Update team docs with CDN URL
- [ ] **Go live** - Deploy widget URL to all sites

## Integration Examples

### Plain HTML
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

### React
```jsx
import { useEffect } from 'react';

export function App() {
  useEffect(() => {
    window.LeadratChatConfig = {
      apiUrl: "https://your-api.com/api/v1/chat",
      botName: "AI Assistant"
    };
    
    const s = document.createElement('script');
    s.src = 'https://cdn.yourdomain.com/chatbot/leadrat-chat.js';
    document.body.appendChild(s);
  }, []);
  
  return <div>{/* Your app */}</div>;
}
```

### Next.js
```html
<!-- public/index.html or in _document.tsx -->
<script>
  window.LeadratChatConfig = {
    apiUrl: "https://your-api.com/api/v1/chat",
    botName: "AI Assistant"
  };
</script>
<script src="https://cdn.yourdomain.com/chatbot/leadrat-chat.js" async></script>
```

See `INTEGRATION_GUIDE.md` for more platforms (Vue, Svelte, WordPress, Shopify, etc.).

## API Endpoint Requirements

Your backend must have:

1. **Endpoint**: `POST /api/v1/chat/message`
2. **CORS Headers**:
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: POST, OPTIONS
   Access-Control-Allow-Headers: Content-Type
   ```
3. **Request Format**:
   ```json
   {
     "message": "User message",
     "session_id": "web-widget",
     "tenant_id": "dubait11",
     "conversation_history": [
       {"role": "user", "content": "..."},
       {"role": "assistant", "content": "..."}
     ]
   }
   ```
4. **Response Format**:
   ```json
   {
     "response": "Bot message",
     "intent": "general",
     "source": "ollama_rag",
     "rag_used": true,
     "needs_api_call": false,
     "metadata": {}
   }
   ```

## CDN Deployment Options

### Option A: AWS S3 + CloudFront (Recommended)

```bash
# 1. Create S3 bucket
aws s3 mb s3://your-chatbot-bucket

# 2. Upload files
aws s3 cp dist/leadrat-chat.js s3://your-chatbot-bucket/chatbot/ \
  --cache-control "public,max-age=604800" \
  --content-type "application/javascript"

aws s3 cp dist/chat-ui.html s3://your-chatbot-bucket/chatbot/ \
  --cache-control "public,max-age=3600" \
  --content-type "text/html"

# 3. Create CloudFront distribution
# Access CDN at: https://d[ID].cloudfront.net/chatbot/leadrat-chat.js
```

### Option B: Cloudflare R2

```bash
# Upload with Wrangler
wrangler r2 object put your-bucket/chatbot/leadrat-chat.js \
  --file dist/leadrat-chat.js

# Access at: https://your-bucket.cdn.r2.io/chatbot/leadrat-chat.js
```

### Option C: Google Cloud Storage

```bash
# Upload files
gsutil cp dist/leadrat-chat.js \
  gs://your-bucket/chatbot/leadrat-chat.js

# Access at: https://storage.googleapis.com/your-bucket/chatbot/leadrat-chat.js
```

### Option D: Your Own Server

```bash
# Copy dist files to your web server
scp -r dist/* user@server:/var/www/chatbot/

# Access at: https://yourdomain.com/chatbot/leadrat-chat.js
```

## Cache Configuration

Set these headers on your CDN:

```
# Script (reused heavily, can cache longer)
Cache-Control: public, max-age=604800  # 7 days

# HTML (changes more often, shorter cache)
Cache-Control: public, max-age=3600    # 1 hour
```

## Customization

### Styling

Edit colors in `widget/src/chat-ui.html`:

```css
#chat-header {
  background: #6C63FF;  /* Header color */
}

.message.user .message-bubble {
  background: #6C63FF;  /* User message color */
}

.quick-reply {
  border-color: #6C63FF;  /* Button color */
  color: #6C63FF;
}
```

Then rebuild: `npm run build`

### Bot Behavior

The widget sends to your backend at `/api/v1/chat/message`. You control:
- Responses (from LLM/RAG)
- Entity cards (lead, property, project)
- Quick reply suggestions
- User intent detection

## Monitoring & Analytics

### Basic Tracking

```javascript
// Track widget loads
window.addEventListener('message', (e) => {
  if (e.data.type === 'WIDGET_LOADED') {
    console.log('Chat widget loaded');
    // Send to analytics
  }
});

// Track messages sent
window.addEventListener('message', (e) => {
  if (e.data.type === 'MESSAGE_SENT') {
    console.log('User sent:', e.data.message);
    // Send to analytics
  }
});
```

### Recommended Metrics

- Widget load time
- Number of chats started
- Messages per conversation
- API response time
- Error rates
- Browser/device breakdown

## Troubleshooting

### Widget Doesn't Load

1. Check browser console for errors
2. Verify `LeadratChatConfig` is set before script loads
3. Check script URL is accessible (test with curl)
4. Verify CDN CORS headers

### API Errors

```bash
# Test API manually
curl -X POST https://your-api.com/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "hello",
    "session_id": "test",
    "tenant_id": "dubait11",
    "conversation_history": []
  }' \
  -v  # Verbose to see headers
```

### CORS Issues

Verify backend includes:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### Chat Not Responding

1. Check API endpoint is running
2. Verify backend can access LLM (Ollama)
3. Check backend logs for errors
4. Test with test-local.html "Test API" button

## Performance Tips

- **Minified JS**: 4.3 KB (already done)
- **Lazy Load**: Load script after page content
- **Async Script Tag**: Use `async` attribute
- **Cache Aggressively**: Long max-age for CDN
- **Use Edge Locations**: Deploy to closest CDN region

## Security Checklist

- [ ] CORS headers restricted to trusted domains (optional)
- [ ] API validates all inputs
- [ ] No API keys hardcoded in widget
- [ ] Backend rate-limits chat endpoint
- [ ] Messages logged securely
- [ ] User data encrypted in transit (HTTPS)
- [ ] Iframe sandbox attributes applied

## File Sizes

```
leadrat-chat.js  ~4.3 KB (minified & gzipped: ~2 KB)
chat-ui.html     ~20 KB
Total            ~24 KB
```

Load time estimate:
- 2G (good): ~500ms
- 3G (good): ~200ms
- 4G/LTE: ~100ms
- WiFi: <50ms

## Next Steps

1. **Deploy to staging** - Test on a staging site first
2. **Get team feedback** - Verify UI/UX matches requirements
3. **Load test** - Test with multiple concurrent users
4. **Monitor production** - Track performance metrics
5. **Iterate** - Improve based on user feedback

## Support & Help

For issues:
1. Check `widget/README.md` for detailed documentation
2. Review `INTEGRATION_GUIDE.md` for your platform
3. Test with `widget/test-local.html`
4. Check browser console for errors
5. Verify API response format matches expectations

## File Reference

- **README.md** - Full widget documentation
- **INTEGRATION_GUIDE.md** - Platform-specific integration
- **test-local.html** - Local testing interface
- **serve-local.js** - Local dev server
- **deploy/upload-to-cdn.sh** - CDN deployment script

## Success Criteria

✅ Widget appears on any website with single script tag
✅ Chat connects to backend and gets responses
✅ Typing indicators show while waiting for API
✅ Entity cards render correctly (lead, property, project)
✅ Quick reply chips are clickable
✅ Mobile responsive (works on all screen sizes)
✅ No console errors
✅ API response < 2 seconds
✅ Widget loads in < 1 second
✅ CORS working across different domains

## Questions?

See the documentation files in the widget directory or contact your development team.
