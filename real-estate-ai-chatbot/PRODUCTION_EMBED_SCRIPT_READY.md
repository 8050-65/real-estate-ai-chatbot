# 🚀 Production Embed Script - Ready to Deploy

**Status:** ✅ **READY FOR PRODUCTION**  
**Production URL:** `https://chatbot-leadrat.vercel.app`  
**Date:** 2026-04-29

---

## 📦 What You Get

### 1. **Production Embed Script**
- **File:** `chatbot-embed-production.js`
- **Location:** Served from `https://chatbot-leadrat.vercel.app/chatbot-embed.js`
- **Size:** ~15KB minified
- **Features:** No external dependencies, fully self-contained

### 2. **Installation Guide**
- **File:** `EMBED_SCRIPT_USAGE.md`
- **Contains:** Complete usage instructions, examples, API documentation

### 3. **Test HTML File**
- **File:** `test-embed-production.html`
- **Purpose:** Verify embed script works before deploying to production
- **Features:** Interactive testing, console logs, configuration examples

---

## ⚡ Quick Start (Copy & Paste)

### Option 1: Basic Installation (Recommended)
```html
<script async src="https://chatbot-leadrat.vercel.app/chatbot-embed.js"></script>
```

Add this ONE LINE anywhere in your HTML before `</body>`.

### Option 2: With Custom URL
```html
<script async src="https://chatbot-leadrat.vercel.app/chatbot-embed.js"
  data-chatbot-url="https://your-domain.com"
  data-position="bottom-right"
  data-theme="dark">
</script>
```

### Option 3: Full Configuration
```html
<script async 
  src="https://chatbot-leadrat.vercel.app/chatbot-embed.js"
  data-chatbot-url="https://chatbot-leadrat.vercel.app"
  data-position="bottom-right"
  data-theme="dark">
</script>
```

---

## 📋 Configuration Options

| Option | Default | Values | Purpose |
|--------|---------|--------|---------|
| `data-chatbot-url` | `https://chatbot-leadrat.vercel.app` | Any URL | Override chatbot URL |
| `data-position` | `bottom-right` | `bottom-right`, `bottom-left`, `top-right`, `top-left` | Button position |
| `data-theme` | `dark` | `dark`, `light` | UI theme |

---

## 🎯 What Happens When Installed

1. ✅ Floating button appears (bottom-right by default)
2. ✅ User clicks button → chat window opens
3. ✅ iframe loads: `https://chatbot-leadrat.vercel.app/ai-assistant?embedded=true`
4. ✅ Clean chat UI (REIA header hidden in embedded mode)
5. ✅ User can ask questions and interact with chatbot
6. ✅ API routes to Leadrat backend or RAG system

---

## 🧪 Testing Before Production

### Step 1: Test Locally
1. Open `test-embed-production.html` in a browser
2. Verify floating button appears in bottom-right corner
3. Click button → chat window opens with animation
4. Type a message → should get a response
5. Check console (F12) for "✅ Leadrat AI Chatbot initialized"

### Step 2: Test on Staging
1. Add script to your staging website
2. Test on desktop and mobile
3. Verify button position and theme
4. Test message flow
5. Check console for errors

### Step 3: Deploy to Production
1. Copy script line to your production HTML
2. Deploy changes
3. Verify on live site
4. Monitor console for errors (first 24 hours)

---

## 💻 Code Examples

### Example 1: Real Estate Website
```html
<!DOCTYPE html>
<html>
<head>
  <title>Luxury Real Estate</title>
</head>
<body>
  <h1>Premium Properties</h1>
  <p>Explore our collection of exclusive homes...</p>
  
  <!-- Add chatbot -->
  <script async src="https://chatbot-leadrat.vercel.app/chatbot-embed.js"></script>
</body>
</html>
```

### Example 2: Developer Portal (Custom URL)
```html
<script async 
  src="https://chatbot-leadrat.vercel.app/chatbot-embed.js"
  data-chatbot-url="https://dev-portal.company.com">
</script>
```

### Example 3: Open Chat on Page Load
```html
<script async src="https://chatbot-leadrat.vercel.app/chatbot-embed.js"></script>

<script>
  // Wait for chatbot to initialize, then open it
  setTimeout(() => {
    window.leadratChatbot.open();
  }, 2000);
</script>
```

### Example 4: Custom Button Trigger
```html
<button onclick="window.leadratChatbot.toggle()">
  💬 Talk to Aria
</button>

<script async src="https://chatbot-leadrat.vercel.app/chatbot-embed.js"></script>
```

---

## 🔧 JavaScript API

Once initialized, control via `window.leadratChatbot`:

```javascript
// Open chat window
window.leadratChatbot.open();

// Close chat window
window.leadratChatbot.close();

// Toggle chat window
window.leadratChatbot.toggle();
```

---

## ✨ Key Features

✅ **No Dependencies**  
- Pure JavaScript
- No npm packages required
- No build process needed
- Works everywhere

✅ **Lightweight**  
- Only ~15KB
- Fast load time
- Minimal bandwidth usage

✅ **Responsive**  
- Desktop: Floating button with chat window
- Mobile: Full-screen chat interface
- Auto-responsive design

✅ **Configurable**  
- Position: 4 corners available
- Theme: Dark or light mode
- URL: Can override chatbot URL

✅ **Secure**  
- HTTPS enforced
- No external tracking
- No data sent to third parties
- CORS properly configured

✅ **User-Friendly**  
- Animated open/close
- Status indicators
- Clean embedded UI
- Smooth interactions

---

## 🚨 Common Issues & Solutions

### Issue: Button not appearing
**Solution:**
1. Check browser console (F12 → Console)
2. Verify script URL is accessible
3. Check z-index with your CSS (may need to increase)
4. Clear cache and refresh

### Issue: Chat window blank
**Solution:**
1. Verify chatbot URL is correct and accessible
2. Check Network tab for iframe load errors
3. Ensure CORS is enabled
4. Check for JavaScript errors in console

### Issue: No response to messages
**Solution:**
1. Check backend API availability
2. Verify Leadrat API connectivity
3. Check browser Network tab for failed API calls
4. View browser console for error messages

---

## 📍 Deployment Checklist

Before going to production:

- [ ] Test on `test-embed-production.html` locally
- [ ] Verify button appears and opens/closes
- [ ] Test sending message and receiving response
- [ ] Test on desktop browser
- [ ] Test on mobile browser
- [ ] Check console for no errors
- [ ] Add script to staging website
- [ ] Test on staging for 24+ hours
- [ ] Monitor browser console for errors
- [ ] Deploy to production
- [ ] Verify on live site
- [ ] Monitor error logs for first week

---

## 📚 Files Provided

| File | Purpose |
|------|---------|
| `chatbot-embed-production.js` | Main embed script (production version) |
| `EMBED_SCRIPT_USAGE.md` | Complete usage documentation |
| `test-embed-production.html` | Test file to verify functionality |
| `PRODUCTION_EMBED_SCRIPT_READY.md` | This file |

---

## 🔗 URLs Reference

| Service | URL |
|---------|-----|
| **Chatbot App** | https://chatbot-leadrat.vercel.app |
| **AI Assistant** | https://chatbot-leadrat.vercel.app/ai-assistant |
| **Embedded Mode** | https://chatbot-leadrat.vercel.app/ai-assistant?embedded=true |
| **Embed Script** | https://chatbot-leadrat.vercel.app/chatbot-embed.js |
| **API Health** | https://chatbot-leadrat.vercel.app/api/health |

---

## 🎓 How It Works (Technical Details)

1. **Script Load**
   - User adds script to HTML
   - Script downloads from CDN (Vercel)
   - Script initializes on DOM ready

2. **UI Creation**
   - Creates floating button with CSS
   - Creates chat window container
   - Injects styles into page

3. **Interaction**
   - User clicks button
   - Chat window opens with animation
   - iframe loads chatbot app with `?embedded=true` param

4. **Embedded Mode**
   - Chatbot URL has `?embedded=true` query param
   - Frontend detects this and hides:
     - REIA header
     - Status bar
     - Language selector
   - Shows only clean chat interface

5. **Communication**
   - Messages sent to FastAPI backend
   - Routes to Leadrat API or RAG system
   - Responses displayed in chat window

---

## 🔐 Security Features

✅ **HTTPS Required**
- All production URLs use HTTPS
- No mixed content warnings

✅ **No Tracking**
- No analytics loaded
- No user data sent externally
- Privacy-first design

✅ **CORS Protected**
- Only allowed domains can access APIs
- Browser same-origin policy enforced

✅ **Safe Initialization**
- Prevents multiple initializations
- Checks for existing instances
- Graceful error handling

---

## 📞 Support

### Testing Issues?
1. Check browser console (F12 → Console tab)
2. Look for red error messages
3. Check Network tab for failed requests
4. Open test-embed-production.html locally

### Production Issues?
1. Verify chatbot service is running
2. Check backend API availability
3. Verify network connectivity
4. Review error logs

### Documentation?
- See `EMBED_SCRIPT_USAGE.md` for complete guide
- Check `test-embed-production.html` for examples
- Review code comments in embed script

---

## 🎯 Success Criteria

Your embed script is working correctly if:

✅ Floating button appears on page  
✅ Button has animated hover effect  
✅ Clicking opens chat window  
✅ Chat window shows "Aria" header  
✅ Status bar shows green "Ready" indicator  
✅ Can type message and get response  
✅ Close button works  
✅ No JavaScript errors in console  
✅ Works on desktop and mobile  
✅ No CORS errors in Network tab  

---

## 🚀 Next Steps

1. **Download Files**
   - Copy `chatbot-embed-production.js` OR use production URL
   - Review `EMBED_SCRIPT_USAGE.md`

2. **Test Locally**
   - Open `test-embed-production.html` in browser
   - Verify button appears and works
   - Check console for initialization message

3. **Add to Your Site**
   - Copy embed script line to your HTML
   - Place before `</body>` tag
   - Deploy to staging first

4. **Monitor & Verify**
   - Test on desktop and mobile
   - Monitor browser console for errors
   - Check first 24 hours after production deploy

---

## ✅ Verification

**Last Verified:** 2026-04-29  
**Status:** ✅ Production Ready  
**All Services:** Online and Operational

- ✅ Frontend: Running
- ✅ APIs: Operational  
- ✅ Embed Script: Tested
- ✅ Documentation: Complete

---

## 📝 Version Info

- **Version:** 1.0
- **Release Date:** 2026-04-29
- **Production URL:** https://chatbot-leadrat.vercel.app
- **Maintained By:** Leadrat Team

---

**🎉 You're all set! The embed script is production-ready and fully tested.**

For questions or issues, refer to the troubleshooting section above or contact your Leadrat team.

Happy integrating! 🚀
