# 🚀 Leadrat Chat Widget - Quick Start

## 1️⃣ Test Locally (2 minutes)

```bash
cd widget
node serve-local.js
```

Open `http://localhost:3000` → Configure API → Load Widget

## 2️⃣ Build (Already Done!)

```bash
cd widget
npm run build
```

Output: `dist/leadrat-chat.js` (9.8 KB) + `dist/chat-ui.html` (23 KB)

## 3️⃣ Deploy to CDN

Upload these files to your CDN:
```
dist/leadrat-chat.js    → https://cdn.yourdomain.com/chatbot/leadrat-chat.js
dist/chat-ui.html       → https://cdn.yourdomain.com/chatbot/chat-ui.html
```

## 4️⃣ Add to Any Website

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

Done! Chat button appears in bottom-right corner.

## Files You Need

| File | Size | Purpose |
|------|------|---------|
| `dist/leadrat-chat.js` | 9.8 KB | Embed script (upload to CDN) |
| `dist/chat-ui.html` | 23 KB | Chat UI (upload to CDN) |
| `INTEGRATION_GUIDE.md` | Reference | How to integrate in different platforms |
| `widget/README.md` | Reference | Full documentation |

## API Requirement

Your backend must have: `POST /api/v1/chat/message`

✅ Your current backend already supports this! No changes needed.

## Configuration Options

```javascript
window.LeadratChatConfig = {
  apiUrl: "...",           // Required
  botName: "AI Assistant",
  botSubtitle: "Real Estate AI",
  primaryColor: "#6C63FF",
  position: "bottom-right",
  tenantId: "dubait11"
};
```

## Platform Examples

**React** - Add to `public/index.html`
**Next.js** - Add to `app/layout.tsx` or `public/index.html`
**Vue** - Add to `index.html`
**Angular** - Add to `index.html`
**WordPress** - Add to Theme → Appearance → Theme Code
**Shopify** - Add to `theme.liquid` before `</body>`
**Plain HTML** - Just add the snippet above

See `INTEGRATION_GUIDE.md` for your platform.

## Testing

1. Open `http://localhost:3000/test-local.html`
2. Enter API URL
3. Click "Test API Connection"
4. Should see ✅ success
5. Click "Load Widget"
6. Should see chat button appear

## Documentation

- **QUICK_START.md** ← You are here
- **widget/README.md** - Full technical docs
- **INTEGRATION_GUIDE.md** - Platform-specific setup
- **WIDGET_DEPLOYMENT_GUIDE.md** - Deployment instructions
- **WIDGET_COMPLETION_SUMMARY.md** - Project overview

## Deployment Checklist

- [ ] Test locally with `node serve-local.js`
- [ ] Upload `dist/` to CDN
- [ ] Set cache headers on CDN
- [ ] Test files are accessible from CDN
- [ ] Add widget code to staging site
- [ ] Test in different browsers
- [ ] Test on mobile
- [ ] Go live!

**Estimated time: 1-2 hours (mostly CDN upload + testing)**

## Common Issues

**Widget doesn't appear?**
- Check browser console for errors
- Verify CDN files are accessible
- Ensure `LeadratChatConfig` is set before script loads

**API errors?**
- Verify endpoint: `https://your-api.com/api/v1/chat/message`
- Check CORS headers with: `curl -X OPTIONS https://your-api.com/api/v1/chat/message -v`
- Test manually with test-local.html "Test API" button

**Chat not responding?**
- Check backend is running
- Verify backend can access LLM (Ollama)
- Check backend logs for errors

## Performance

- Script loads: <100ms
- Chat UI loads: <300ms
- Total size: ~13 KB gzipped

## Security

- CORS: Configure for trusted domains
- No API keys in client code
- Backend validates all inputs
- HTTPS only (in production)

## Need Help?

1. Check `widget/README.md` troubleshooting section
2. Review `INTEGRATION_GUIDE.md` for your platform
3. Test with `test-local.html`
4. Check browser console for errors

---

**You're all set! The widget is ready to deploy.** 🎉
