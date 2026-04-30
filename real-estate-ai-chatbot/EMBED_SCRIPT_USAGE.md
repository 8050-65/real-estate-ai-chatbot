# Leadrat Chatbot Embed Script - Production Usage Guide

**Production URL:** `https://chatbot-leadrat.vercel.app`

**Embed Script URL:** `https://chatbot-leadrat.vercel.app/chatbot-embed.js`

---

## Quick Start (30 seconds)

Copy and paste this single line into your HTML file before `</body>`:

```html
<script async src="https://chatbot-leadrat.vercel.app/chatbot-embed.js"></script>
```

That's it! A floating chat button will appear on your page.

---

## Configuration Options

### Option 1: Simple (Uses Production URL)
```html
<script async src="https://chatbot-leadrat.vercel.app/chatbot-embed.js"></script>
```

### Option 2: Custom URL (Override Production URL)
```html
<script async src="https://chatbot-leadrat.vercel.app/chatbot-embed.js"
  data-chatbot-url="https://your-custom-chatbot-url.com">
</script>
```

### Option 3: All Configuration Options
```html
<script async src="https://chatbot-leadrat.vercel.app/chatbot-embed.js"
  data-chatbot-url="https://chatbot-leadrat.vercel.app"
  data-position="bottom-right"
  data-theme="dark">
</script>
```

---

## Configuration Attributes

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `data-chatbot-url` | URL string | `https://chatbot-leadrat.vercel.app` | The chatbot application URL |
| `data-position` | `bottom-right` `bottom-left` `top-right` `top-left` | `bottom-right` | Where to position the floating button |
| `data-theme` | `dark` `light` | `dark` | UI color theme |

---

## Usage Examples

### Example 1: Real Estate Website (Dark Theme, Bottom-Right)
```html
<!DOCTYPE html>
<html>
<head>
  <title>Real Estate Company</title>
</head>
<body>
  <h1>Welcome to Our Properties</h1>
  <p>Content here...</p>
  
  <!-- Chatbot Embed -->
  <script async src="https://chatbot-leadrat.vercel.app/chatbot-embed.js"></script>
</body>
</html>
```

**Result:** Floating button appears in bottom-right corner with dark theme

---

### Example 2: Portfolio Website (Light Theme, Bottom-Left)
```html
<script async src="https://chatbot-leadrat.vercel.app/chatbot-embed.js"
  data-position="bottom-left"
  data-theme="light">
</script>
```

**Result:** Light themed chat widget on bottom-left corner

---

### Example 3: Real Estate Portal (Top-Right, Custom URL)
```html
<script async src="https://chatbot-leadrat.vercel.app/chatbot-embed.js"
  data-chatbot-url="https://your-chatbot-instance.com"
  data-position="top-right">
</script>
```

**Result:** Floating button in top-right corner, loads custom chatbot URL

---

## JavaScript API (Programmatic Control)

Once initialized, you can control the chatbot via `window.leadratChatbot`:

```javascript
// Open the chat window
window.leadratChatbot.open();

// Close the chat window
window.leadratChatbot.close();

// Toggle the chat window
window.leadratChatbot.toggle();
```

### Example: Open Chat on Button Click
```html
<button onclick="window.leadratChatbot.open()">
  Chat with our team
</button>

<script async src="https://chatbot-leadrat.vercel.app/chatbot-embed.js"></script>
```

### Example: Open Chat After Page Load
```html
<script async src="https://chatbot-leadrat.vercel.app/chatbot-embed.js"></script>

<script>
  // Wait for chatbot to initialize
  setTimeout(() => {
    window.leadratChatbot.open();
  }, 2000);
</script>
```

---

## Real-World Integration Examples

### 1. Real Estate Listing Site
```html
<script async src="https://chatbot-leadrat.vercel.app/chatbot-embed.js"
  data-position="bottom-right"
  data-theme="dark">
</script>
```

Place this in the footer of every page. Users can ask:
- "Show me 2BHK apartments"
- "What are your payment plans?"
- "Schedule a site visit"

---

### 2. Property Developer Website
```html
<script async src="https://chatbot-leadrat.vercel.app/chatbot-embed.js"
  data-position="bottom-right"
  data-theme="light">
</script>
```

Users landing on project pages can:
- Ask about amenities
- Check RERA registration
- Schedule site visits
- Get financing information

---

### 3. Real Estate CRM System
```html
<script async src="https://chatbot-leadrat.vercel.app/chatbot-embed.js"
  data-chatbot-url="https://crm-chatbot.company.com">
</script>
```

Internal CRM users access the chatbot with custom domain.

---

## Features

✅ **No Dependencies** - Pure JavaScript, works everywhere  
✅ **Lightweight** - ~15KB minified  
✅ **Responsive** - Works on mobile and desktop  
✅ **Configurable** - Theme, position, URL customization  
✅ **Clean UI** - Floating button with animated chat window  
✅ **Embedded Mode** - Loads chatbot in `?embedded=true` mode (clean UI, no header)  
✅ **Status Indicators** - Shows service health  
✅ **Global API** - Control via `window.leadratChatbot`  

---

## What Happens When User Clicks Button

1. **Floating Button** → User clicks chat button
2. **Chat Window Opens** → Animated slide-up effect
3. **iframe Loads** → Chatbot page loads with `?embedded=true` parameter
4. **Clean UI** → REIA header and status bar are hidden (embedded mode)
5. **Ready to Chat** → User can start typing

---

## Chat Window Behavior

### Desktop (420px wide, 600px tall)
- Floats at configured position
- Slides up with animation
- Can be closed with X button or toggle
- Status indicators show service health

### Mobile (Full Screen)
- Takes up entire screen
- Button hidden (just shows chat)
- Swipe/back gesture to close
- Optimized touch targets

---

## Troubleshooting

### Chat Button Not Appearing
**Problem:** Floating button doesn't show  
**Solution:**
1. Check browser console for errors (F12 → Console)
2. Verify script URL is correct: `https://chatbot-leadrat.vercel.app/chatbot-embed.js`
3. Check z-index conflicts with other elements

```css
/* If z-index conflict, add this to your CSS */
#leadrat-chatbot-container {
  z-index: 999999 !important;
}
```

---

### Chat Window Blank/Not Loading
**Problem:** Chat opens but shows blank white area  
**Solution:**
1. Check chatbot URL is accessible: `https://chatbot-leadrat.vercel.app/ai-assistant?embedded=true`
2. Verify CORS is enabled on your domain
3. Check browser console for iframe loading errors

---

### Chatbot Doesn't Respond to Messages
**Problem:** Type message but no response  
**Solution:**
1. Check backend APIs are running (if self-hosted)
2. Verify Leadrat API connectivity
3. Check network tab in developer console for failed requests

---

## Security Notes

✅ **Safe to Use:**
- No external dependencies (no npm packages)
- No tracking or analytics
- No data sent to third parties
- HTTPS enforced in production

⚠️ **Best Practices:**
- Use HTTPS on your domain
- Don't modify script if possible
- Keep embedded URL updated with production changes
- Monitor console for errors in development

---

## Support & Updates

- **Production URL:** https://chatbot-leadrat.vercel.app
- **Issues:** Check the troubleshooting section above
- **Feature Requests:** Contact your Leadrat team

---

## Integration Checklist

- [ ] Copy embed script line
- [ ] Add to your website HTML (before `</body>`)
- [ ] Test on desktop
- [ ] Test on mobile
- [ ] Verify chat window opens/closes
- [ ] Test sending a message
- [ ] Check console for errors

---

## Next Steps

1. **Add Script** - Copy the line above to your HTML
2. **Test Locally** - Open your HTML file and verify
3. **Deploy** - Push changes to your live website
4. **Monitor** - Check console logs for any issues

Ready to go! 🚀
