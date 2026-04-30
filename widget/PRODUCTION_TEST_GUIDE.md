# ✅ Production Widget - Complete Testing Guide

## Quick Test (5 minutes)

### Test 1: Direct Access to Landing Page

```bash
# Visit in browser
https://leadrat-chat-widget.pages.dev/index.html
```

**Expected Result:**
- ✅ See professional documentation page
- ✅ "Leadrat Chat Widget" heading visible
- ✅ Quick start guide shown
- ✅ Features list displayed
- ✅ Configuration table visible
- ✅ No errors in console

---

### Test 2: Direct Access to Chat UI

```bash
# Visit in browser
https://leadrat-chat-widget.pages.dev/chat-ui.html
```

**Expected Result:**
- ✅ See clean info page (NOT broken layout)
- ✅ "Leadrat Chat Widget" heading
- ✅ "designed to run inside an iframe" message
- ✅ Embed code snippet shown
- ✅ GitHub link provided
- ✅ No broken chat interface
- ✅ No console errors

---

### Test 3: Widget Embedding

Create `test-production.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Production Widget Test</title>
  <style>
    body { font-family: Arial; padding: 40px; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <h1>🤖 Widget Embedding Test</h1>
  <p>Chat widget should appear in bottom-right corner</p>

  <script>
    window.LeadratChatConfig = {
      apiUrl: "https://real-estate-rag-dev.onrender.com/api/v1/chat/message",
      botName: "Aria",
      botSubtitle: "Real Estate AI",
      primaryColor: "#6C63FF",
      position: "bottom-right",
      tenantId: "dubait11"
    };
  </script>
  <script src="https://leadrat-chat-widget.pages.dev/leadrat-chat.js" async></script>
</body>
</html>
```

Open in browser and verify:

**Visual Checks:**
- ✅ Purple chat button appears bottom-right corner
- ✅ Button has rounded shape (circular)
- ✅ Button says "💬" (chat bubble emoji)
- ✅ Button has subtle shadow
- ✅ No full-page overlay
- ✅ Page content visible around widget
- ✅ Button scales up on hover (1.1x)

**Interaction Checks:**
- ✅ Click button → Widget opens
- ✅ Chat window slides up smoothly
- ✅ Widget is 370px wide, 580px tall
- ✅ Widget has rounded corners
- ✅ Purple header with bot info
- ✅ Close (✕) button in top-right
- ✅ Click close → Widget closes
- ✅ No page layout broken

**Chat Functionality:**
- ✅ Type message in input field
- ✅ Press Enter → Message sends
- ✅ User message appears right-aligned (purple)
- ✅ Bot response appears left-aligned (gray)
- ✅ Typing indicator shows (3 dots)
- ✅ Responses arrive from API
- ✅ Messages scroll if needed
- ✅ Input stays at bottom

---

## Detailed Testing

### Test 4: Dynamic URL Detection

The widget should automatically detect its CDN location:

```javascript
// Check in browser console (F12)
// Open DevTools Network tab and reload

// You should see:
// ✅ leadrat-chat.js from CDN (no localhost)
// ✅ chat-ui.html loaded from same CDN origin
// ✅ Both from leadrat-chat-widget.pages.dev
```

**Verification:**
1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Look for requests to:
   - leadrat-chat.js ✅
   - chat-ui.html ✅
5. Verify both from: `leadrat-chat-widget.pages.dev` (not localhost)

---

### Test 5: Configuration Override

Create `test-config.html`:

```html
<script>
  window.LeadratChatConfig = {
    apiUrl: "https://real-estate-rag-dev.onrender.com/api/v1/chat/message",
    botName: "🏠 Property AI",
    botSubtitle: "Dubai Real Estate Expert",
    primaryColor: "#DC2626",  // Red instead of purple
    position: "bottom-left",  // Left side
    tenantId: "custom-tenant"
  };
</script>
<script src="https://leadrat-chat-widget.pages.dev/leadrat-chat.js" async></script>
```

**Expected Results:**
- ✅ Button appears bottom-LEFT (not right)
- ✅ Button color is RED (#DC2626)
- ✅ Open widget → Bot name is "🏠 Property AI"
- ✅ Subtitle is "Dubai Real Estate Expert"
- ✅ API calls use custom-tenant

---

### Test 6: Multiple Embeds on Same Page

Create `test-multi.html`:

```html
<h1>Widget 1 (bottom-right, blue)</h1>
<script>
  window.LeadratChatConfig = {
    apiUrl: "https://real-estate-rag-dev.onrender.com/api/v1/chat/message",
    botName: "Bot 1",
    primaryColor: "#3B82F6"
  };
</script>
<script src="https://leadrat-chat-widget.pages.dev/leadrat-chat.js" async></script>

<h1>Widget 2 (bottom-left, red)</h1>
<script>
  window.LeadratChatConfig = {
    apiUrl: "https://real-estate-rag-dev.onrender.com/api/v1/chat/message",
    botName: "Bot 2",
    primaryColor: "#EF4444",
    position: "bottom-left"
  };
</script>
<script src="https://leadrat-chat-widget.pages.dev/leadrat-chat.js" async></script>
```

**Expected Results:**
- ✅ Only ONE widget button appears (duplicate prevention works)
- ✅ Button uses first config (Bot 1)
- ✅ Second script load is ignored
- ✅ No console errors about duplicates

---

### Test 7: Mobile Responsiveness

Test on mobile device or DevTools mobile view:

```html
<!-- Same as Test 3 -->
```

**Mobile Checks:**
1. Open DevTools
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test iPhone (375px width)
4. Test Android (360px width)

**Expected Results:**
- ✅ Button still visible in corner
- ✅ Click button → Widget opens full-screen
- ✅ Widget takes full screen (100% width/height)
- ✅ Messages visible and scrollable
- ✅ Input at bottom
- ✅ Close button works
- ✅ No horizontal scrolling
- ✅ Text readable (proper font size)
- ✅ Touch targets big enough (buttons)

---

### Test 8: Console Errors Check

Open DevTools Console and verify:

```bash
# Expected: Clean console with no errors

# BAD (if you see these):
❌ 404 Not Found for leadrat-chat.js
❌ CORS error
❌ Uncaught TypeError
❌ localhost:3000/...
❌ undefined is not a function

# GOOD (expected messages):
✅ [clean console OR]
✅ Normal API calls
✅ No JavaScript errors
✅ No 404s
```

---

### Test 9: Network Requests

Check Network tab (F12):

**Expected Requests:**
1. `leadrat-chat.js` 
   - Status: 200 ✅
   - Size: ~4-5 KB
   - Type: JavaScript
   - Origin: leadrat-chat-widget.pages.dev

2. `chat-ui.html`
   - Status: 200 ✅
   - Size: ~23 KB
   - Type: HTML
   - Origin: leadrat-chat-widget.pages.dev

3. POST to API
   - URL: your-api/api/v1/chat/message
   - Status: 200 ✅
   - Payload: JSON with message, session_id, etc.

**Verify:**
- ✅ No 404 errors
- ✅ No CORS errors
- ✅ No localhost URLs
- ✅ All from correct CDN

---

### Test 10: API Integration

Test actual chat functionality:

```html
<!-- Same as Test 3 -->
```

**Steps:**
1. Open widget
2. Type: "Hello"
3. Press Enter

**Expected Results:**
- ✅ User message appears right (purple)
- ✅ Loading indicator appears
- ✅ Bot response arrives
- ✅ Response displayed in message bubble
- ✅ No API errors
- ✅ No CORS errors
- ✅ Can send multiple messages

---

### Test 11: Browser Compatibility

Test on different browsers:

| Browser | Desktop | Mobile | Status |
|---------|---------|--------|--------|
| Chrome  | ✅ Test | ✅ Test | Should work |
| Firefox | ✅ Test | ✅ Test | Should work |
| Safari  | ✅ Test | ✅ Test | Should work |
| Edge    | ✅ Test | ✅ Test | Should work |

**Expected:** Widget works identically on all browsers

---

### Test 12: CORS & Security

Verify CORS headers:

```bash
curl -I https://leadrat-chat-widget.pages.dev/leadrat-chat.js
```

**Expected Headers:**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Content-Type: application/javascript
Cache-Control: public, max-age=...
```

---

## Final Verification Checklist

### Pre-Deployment
- [ ] `npm run build` succeeds with no errors
- [ ] `widget/dist/` contains 3+ files
- [ ] leadrat-chat.js is minified
- [ ] chat-ui.html has direct access detection
- [ ] index.html exists and renders
- [ ] No TypeScript errors

### Cloudflare Pages
- [ ] Project created
- [ ] GitHub connected
- [ ] Build command correct
- [ ] Output directory is `widget/dist`
- [ ] Deploy successful
- [ ] All 3 files accessible

### Direct Access
- [ ] index.html shows landing page
- [ ] chat-ui.html shows info page (not broken layout)
- [ ] No 404 errors
- [ ] No console errors

### Widget Embedding
- [ ] Button appears in correct position
- [ ] Button color matches config
- [ ] Button is clickable
- [ ] Widget opens/closes
- [ ] Chat UI displays correctly
- [ ] Messages send and receive
- [ ] Mobile responsive
- [ ] No console errors
- [ ] No localhost URLs

### API Integration
- [ ] Requests go to configured API
- [ ] Correct request format
- [ ] Responses handled properly
- [ ] No CORS errors
- [ ] Error handling works

### Browser Compatibility
- [ ] Chrome ✅
- [ ] Firefox ✅
- [ ] Safari ✅
- [ ] Edge ✅
- [ ] Mobile browsers ✅

---

## Troubleshooting

### Widget Not Appearing

1. Check browser console (F12)
2. Verify config is set BEFORE script loads
3. Check script URL is correct
4. Verify backend API is running

### Messages Not Sending

1. Check Network tab → POST requests
2. Verify API endpoint URL
3. Check backend CORS settings
4. Check API response format

### Direct Access Shows Broken Layout

This should NOT happen anymore. If it does:
1. Check chat-ui.html includes direct access detection
2. Rebuild: `npm run build`
3. Clear browser cache
4. Reload page

### Wrong URLs in Production

1. Check leadrat-chat.js includes dynamic URL detection
2. Verify script is loaded from correct CDN
3. Check iframe src in Network tab
4. Should be from same origin as script

---

## Performance Metrics

Expected performance:

| Metric | Target | Check |
|--------|--------|-------|
| Script load | < 100ms | Network tab |
| DOM ready | < 200ms | DevTools |
| First paint | < 300ms | Lighthouse |
| API response | 1-5s | Network tab |
| Total page load | < 1s (widget) | DevTools |

---

## Sign-Off

Once all tests pass:

✅ Widget is **PRODUCTION READY**
✅ Safe to deploy to Cloudflare Pages
✅ Safe to share with external partners
✅ Ready for CEO demo
✅ Enterprise quality

---

*Test Guide Created: April 30, 2026*
*Widget Version: 1.0.0*
*Status: ✅ READY TO TEST*
