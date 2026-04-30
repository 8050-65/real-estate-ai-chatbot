# Leadrat AI Chatbot - Embeddable Widget

A self-contained, single-script embeddable AI chatbot widget that can be integrated into any website with a single `<script>` tag.

## Features

- ✅ **Single Script Tag** - Add to any HTML page with just one line
- ✅ **Isolated Iframe** - Chat UI runs in isolated iframe (no CSS/JS conflicts)
- ✅ **Responsive** - Works on desktop and mobile
- ✅ **Configurable** - Customize bot name, colors, API endpoint
- ✅ **Zero Dependencies** - Pure vanilla JS, no frameworks
- ✅ **Rich UI** - Message bubbles, typing indicators, quick replies, entity cards
- ✅ **CORS Enabled** - Works across different domains
- ✅ **Production Ready** - Minified, optimized for CDN delivery

## Quick Start

### 1. Build the Widget

```bash
cd widget

# Install dependencies
npm install

# Build for production
npm run build

# Or build for development (watch mode)
npm run dev
```

This creates two files in `dist/`:
- `leadrat-chat.js` - Main embed script (minified, ~8KB gzipped)
- `chat-ui.html` - Chat UI for iframe

### 2. Test Locally

Start a local HTTP server:

```bash
# Using Python 3
python -m http.server 8080

# Or using Node.js
npx http-server -p 8080
```

Open `http://localhost:8080/test-local.html` in your browser.

Configure the API endpoint and click "Load Widget" to test.

### 3. Deploy to CDN

Option A - AWS S3 + CloudFront:
```bash
bash deploy/upload-to-cdn.sh
```

Option B - Manual upload to your CDN:
```bash
# Upload these files from dist/ folder:
# - leadrat-chat.js
# - chat-ui.html
```

Make sure to set CORS headers:
```
Access-Control-Allow-Origin: *
```

## Integration Guide

Once deployed, add this to any website:

```html
<!-- In <head> or before </body> -->
<script>
  window.LeadratChatConfig = {
    apiUrl: "https://your-api.com/api/v1/chat",
    botName: "AI Assistant",
    botSubtitle: "Real Estate AI",
    primaryColor: "#6C63FF",
    position: "bottom-right",
    tenantId: "dubait11"
  };
</script>
<script src="https://cdn.yourdomain.com/chatbot/leadrat-chat.js" async></script>
```

That's it! The widget will automatically appear in the bottom-right corner.

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiUrl` | string | **required** | Backend chat API endpoint |
| `botName` | string | "AI Assistant" | Display name of bot |
| `botSubtitle` | string | "Powered by Leadrat" | Subtitle under bot name |
| `primaryColor` | string | "#6C63FF" | Hex color for header, buttons |
| `position` | string | "bottom-right" | Widget position (bottom-right, bottom-left) |
| `tenantId` | string | "dubait11" | Tenant ID for backend |

## API Endpoint

The widget expects a POST endpoint at `{apiUrl}/message` with this request:

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

Expected response:

```json
{
  "response": "Bot message",
  "intent": "general|lead|property|project",
  "source": "ollama_rag|leadrat_api|error",
  "rag_used": true,
  "needs_api_call": false,
  "metadata": {...}
}
```

## File Structure

```
widget/
├── src/
│   ├── leadrat-chat.ts      # Main embed script (TypeScript)
│   └── chat-ui.html         # Chat UI for iframe
├── dist/                    # Build output
│   ├── leadrat-chat.js      # Minified embed script
│   └── chat-ui.html         # Chat UI file
├── deploy/
│   └── upload-to-cdn.sh     # Deployment script
├── package.json             # Dependencies & build scripts
├── tsconfig.json            # TypeScript config
├── test-local.html          # Local testing page
└── README.md               # This file
```

## Build Scripts

```bash
npm run build        # Build for production (minified)
npm run build:js     # Build only JS
npm run build:html   # Copy HTML
npm run build:dev    # Build unminified (development)
npm run dev          # Watch mode - rebuild on file changes
npm run clean        # Remove dist/ folder
```

## Testing

### Local Testing

1. Run `npm run build` to create dist files
2. Start HTTP server: `python -m http.server 8080`
3. Open `test-local.html`
4. Enter your API URL and click "Load Widget"
5. Test the chat interface

### Production Testing

1. Deploy files to CDN
2. Update CDN URL in your test HTML
3. Test from different domains to verify CORS works

## Styling & Customization

The widget uses an inline `<style>` tag in `chat-ui.html`, so all styling is self-contained. To customize:

1. Edit the CSS in `src/chat-ui.html`
2. Run `npm run build`
3. Re-deploy to CDN

Key color variables to change:
- Primary color: `#6C63FF` (appears in header, buttons)
- Message bubble colors: `#F3F4F6` (bot), `#6C63FF` (user)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

Requires ES2020 support. For older browsers, rebuild with `--target=es2017`.

## Performance

- **Script size**: ~8KB gzipped
- **Load time**: <100ms on fast networks
- **First interaction**: <300ms
- **Memory usage**: ~2MB (chat UI + iframe)

### Optimization Tips

1. Host on CDN with edge caching
2. Set Cache-Control headers:
   - Script: `max-age=604800` (7 days)
   - HTML: `max-age=3600` (1 hour)
3. Enable gzip compression
4. Use HTTP/2 server push

## Troubleshooting

### Widget doesn't appear

- Check browser console for errors
- Verify `window.LeadratChatConfig` is set before loading script
- Check that dist files exist and script path is correct

### Chat not connecting to API

- Check API URL is correct and includes `/api/v1/chat`
- Verify CORS headers are set to `Access-Control-Allow-Origin: *`
- Check API endpoint is working: `curl -X POST https://your-api/api/v1/chat/message ...`
- Verify network tab in browser dev tools

### Styling issues

- Check browser dev tools for CSS conflicts
- Remember widget CSS is isolated in iframe
- Try clearing cache and rebuilding

### TypeError: Cannot read property 'postMessage'

- Usually means iframe isn't fully loaded
- Wait 100ms after iframe.load before sending config
- Check browser console for iframe loading errors

## Security Considerations

1. **CORS** - Ensure API allows requests from your domains
2. **API Key** - Don't hardcode API keys in config; pass in request body if needed
3. **Content Validation** - Backend should validate all messages
4. **XSS** - Widget sanitizes user input; backend should also validate

## Development

### Adding New Features

1. Edit `src/leadrat-chat.ts` for parent script changes
2. Edit `src/chat-ui.html` for chat UI changes
3. Run `npm run build` to rebuild
4. Test in `test-local.html`

### Debugging

Enable debug logging:

```javascript
window.LeadratChatDebug = true;
```

This will log all postMessage communications between parent and iframe.

## Deployment Checklist

- [ ] Run `npm run build` to create dist files
- [ ] Test locally with `test-local.html`
- [ ] Test API connectivity with "Test API Connection" button
- [ ] Upload dist files to CDN
- [ ] Set CORS headers on CDN
- [ ] Set Cache-Control headers
- [ ] Test integration on staging site
- [ ] Update documentation with CDN URL
- [ ] Deploy to production

## Support

For issues or questions:
1. Check browser console for errors
2. Review API response format
3. Test with curl: `curl -X POST https://your-api/api/v1/chat/message -d '{"message":"test"}'`
4. Check this README's troubleshooting section

## License

MIT

## Next Steps

1. Configure `src/chat-ui.html` with your branding
2. Deploy dist files to your CDN
3. Test integration on a staging site
4. Share CDN URL with partners/clients
5. Monitor widget analytics and user feedback
