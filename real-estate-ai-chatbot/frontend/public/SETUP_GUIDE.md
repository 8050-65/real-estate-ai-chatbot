# 🤖 Leadrat AI Chatbot - Team Setup Guide

**Production-ready embed script for real estate websites**

---

## ⚡ Quick Start (2 minutes)

### For Most Users - Just Copy & Paste

Add this **ONE LINE** to your HTML before the closing `</body>` tag:

```html
<script async src="https://real-estate-ai-chatbot.pages.dev/chatbot-embed.js"></script>
```

**That's it!** The chatbot appears automatically in the bottom-right corner.

---

## 📋 Step-by-Step Integration

### Step 1: Open Your HTML File
Find your website's HTML file (usually `index.html` or your main template)

### Step 2: Add the Embed Script
Paste this before `</body>`:

```html
<!DOCTYPE html>
<html>
<head>
    <!-- Your existing head content -->
</head>
<body>
    <!-- Your website content -->
    
    <!-- Add this line at the end -->
    <script async src="https://real-estate-ai-chatbot.pages.dev/chatbot-embed.js"></script>
</body>
</html>
```

### Step 3: Clear Browser Cache
1. Press **Ctrl+Shift+Delete** (Windows) or **Cmd+Shift+Delete** (Mac)
2. Select "All time" and click "Clear data"

### Step 4: Hard Refresh
Press **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)

### Step 5: Verify
Look for a **purple floating button** in the bottom-right corner ✅

---

## 🎨 Custom Branding (Optional)

If you want to customize colors, bot name, or position:

```html
<script>
window.LeadratChatConfig = {
  chatbotUrl: 'https://real-estate-ai-chatbot.pages.dev',
  apiUrl: 'https://real-estate-api-dev.onrender.com/api/v1/chat/message',
  tenantId: 'dubai11',
  botName: 'Aria',                    // Change bot name
  botSubtitle: 'Real Estate AI',      // Change subtitle
  primaryColor: '#6C63FF'              // Change button color
};
</script>
<script async src="https://real-estate-ai-chatbot.pages.dev/chatbot-embed.js"></script>
```

### Position Options
Use data attributes to change position:

```html
<script async src="https://real-estate-ai-chatbot.pages.dev/chatbot-embed.js"
  data-position="bottom-right"
  data-theme="dark">
</script>
```

**Positions:** `bottom-right`, `bottom-left`, `top-right`, `top-left`  
**Themes:** `dark` (default), `light`

---

## 🧪 Test the Chatbot

Before deploying to production, test on these pages:

| Page | URL | What to Test |
|------|-----|--------------|
| **Home** | https://real-estate-ai-chatbot.pages.dev | Basic functionality |
| **Demo** | https://real-estate-ai-chatbot.pages.dev/chatbot-demo.html | Full chatbot demo |
| **Test Controls** | https://real-estate-ai-chatbot.pages.dev/TEST | Button interactions |
| **Documentation** | https://real-estate-ai-chatbot.pages.dev/embed-example.html | Full docs & examples |

---

## ✅ Verification Checklist

After adding the embed script, check:

- [ ] Floating button appears in bottom-right corner
- [ ] Button has purple gradient background
- [ ] Click button → chatbot opens
- [ ] Chatbot shows chat interface
- [ ] Can type messages
- [ ] Can see AI responses
- [ ] Close button works
- [ ] No console errors (Press F12 → Console tab)

---

## 🔧 API Endpoints

Keep these for reference:

```
Frontend (Chatbot UI):
https://real-estate-ai-chatbot.pages.dev

API (Backend):
https://real-estate-api-dev.onrender.com/api/v1/chat/message

Embed Script:
https://real-estate-ai-chatbot.pages.dev/chatbot-embed.js
```

---

## 🎮 JavaScript Control (Advanced)

Control chatbot programmatically:

```javascript
// Open chatbot
window.leadratChatbot.open()

// Close chatbot
window.leadratChatbot.close()

// Toggle open/close
window.leadratChatbot.toggle()
```

Example button:
```html
<button onclick="window.leadratChatbot.open()">
  💬 Open Chat
</button>
```

---

## 🐛 Troubleshooting

### Button not showing?
1. Clear browser cache: **Ctrl+Shift+Delete**
2. Hard refresh: **Ctrl+Shift+R**
3. Open DevTools (**F12**) → **Console** tab
4. Look for green ✅ message: "Leadrat AI Chatbot initialized"

### Chatbot not opening?
1. Check console for errors
2. Try: `window.leadratChatbot.open()` in console
3. Verify script is loading (Network tab in DevTools)

### Text not readable?
1. Try light theme: `data-theme="light"`
2. Clear cache and refresh
3. Check browser console for CSS errors

### API Connection Issues?
1. Check: https://real-estate-api-dev.onrender.com is accessible
2. Verify API URL in config matches exactly
3. Check browser console for CORS errors

---

## 📱 Mobile Responsive

Chatbot is fully mobile-responsive:
- Automatically fullscreen on mobile
- Touch-friendly buttons
- Optimized for small screens

---

## 🔐 Security Notes

- Script loads from Cloudflare Pages (secure CDN)
- API calls to Render (secure backend)
- No sensitive data stored in browser
- All HTTPS connections

---

## 📊 Features

✅ AI-powered real estate assistant  
✅ Answer property questions instantly  
✅ Schedule site visits and callbacks  
✅ Mobile responsive design  
✅ Dark & light theme support  
✅ Powered by Ollama LLM + RAG  
✅ Works on any website  
✅ Zero configuration needed  

---

## 🆘 Need Help?

### For Developers
- Check DevTools Console (F12)
- Verify network requests in Network tab
- Test on the demo pages first

### For Support
- Check this guide again
- Test on: https://real-estate-ai-chatbot.pages.dev/TEST
- Verify all URLs are correct

---

## 📝 Configuration Reference

| Setting | Default | Options |
|---------|---------|---------|
| chatbotUrl | https://real-estate-ai-chatbot.pages.dev | Custom URL |
| apiUrl | https://real-estate-api-dev.onrender.com/api/v1/chat/message | Custom API |
| tenantId | dubai11 | Your tenant ID |
| botName | Aria | Custom name |
| botSubtitle | Real Estate AI | Custom subtitle |
| primaryColor | #6C63FF | Hex color code |
| position | bottom-right | bottom-left, top-right, top-left |
| theme | dark | dark, light |

---

## 🚀 Deployment Checklist

Before going live:

- [ ] Test on demo page: https://real-estate-ai-chatbot.pages.dev/TEST
- [ ] Verify chatbot opens and responds
- [ ] Check mobile view (resize browser)
- [ ] Test on actual website (staging)
- [ ] Verify no console errors
- [ ] Check analytics/tracking (if using)
- [ ] Deploy to production

---

**Version:** 1.0  
**Last Updated:** May 2026  
**Status:** ✅ Production Ready

---

Made with ❤️ by Leadrat Team
