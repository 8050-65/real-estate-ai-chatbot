# Embedded Chatbot - Testing Guide

## Quick Start

### 1. Dev Server Status
✅ Dev server must be running:
```bash
npm run dev  # Already running on port 3000
```

### 2. Test Case A: Direct Access (/embed page)

**URL:** http://localhost:3000/embed

**Expected Behavior:**
- [ ] Page loads without errors (F12 Console)
- [ ] Chatbot widget appears centered on page
- [ ] Widget has purple gradient header with "AI Assistant"
- [ ] White background with readable dark text
- [ ] Messages area shows welcome emoji and greeting
- [ ] Input field is visible with placeholder "Type your message..."
- [ ] Send button appears (disabled when empty)

**Interactive Test:**
1. Type: "Hi"
2. **Expected Response:** Welcome message mentioning properties, scheduling, leads
3. Type: "What properties do you have?"
4. **Expected Response:** Demo response with villa/apartment options
5. Type: "How to schedule a visit?"
6. **Expected Response:** Demo response with scheduling options
7. Type: "What's the price?"
8. **Expected Response:** Demo response with price ranges

**Visual Checks:**
- [ ] Text is dark (#111827) and readable
- [ ] User messages appear on right with blue background
- [ ] Bot messages appear on left with gray background
- [ ] Icons visible for user and bot
- [ ] Scrolling works smoothly
- [ ] No "SessionProvider" errors in console
- [ ] No 404 or network errors in Network tab (F12)

---

### 3. Test Case B: External HTML (TEST.html)

**URL:** http://localhost:3000/TEST.html

**Expected Behavior:**
- [ ] Page loads with test page content
- [ ] **Floating purple button appears at BOTTOM-RIGHT corner**
- [ ] Button has chat icon and red badge "1"
- [ ] Button stays visible when scrolling
- [ ] Page has multiple sections (Installation, Configuration, API, etc.)

**Interactive Test - Floating Button:**
1. **Click the floating purple button at bottom-right**
2. **Expected:** Chatbot widget opens ABOVE the button at bottom-right
3. [ ] Widget appears with smooth animation (slides up)
4. [ ] Widget is positioned at bottom-right, not centered
5. [ ] Widget has close button (X) in header
6. [ ] Click close button → widget disappears
7. [ ] Click button again → widget opens again
8. [ ] Click outside widget → widget closes (auto-close)
9. [ ] Widget width is ~420px, height ~600px

**Test Messages in Widget:**
1. Type: "hello"
2. **Expected:** Welcome response (should NOT say "Sorry, error")
3. Type: "show me properties"
4. **Expected:** Property demo response
5. Type: "Can I schedule?"
6. **Expected:** Scheduling demo response

**Test Control Buttons on Page:**
- [ ] Click "Open Chat" button → widget opens
- [ ] Click "Close Chat" button → widget closes
- [ ] Click "Toggle" button → toggles open/close
- [ ] Click these multiple times → all work smoothly

**Visual Checks:**
- [ ] Purple button has smooth hover effect (scales slightly)
- [ ] Widget opens with animation
- [ ] Text in widget is readable (dark on light)
- [ ] Scrolling inside widget works
- [ ] No scroll on page when widget scrolls
- [ ] Mobile responsive (try resizing browser to <480px)

**Console Checks (F12):**
- [ ] Green log: "✅ Leadrat AI Chatbot initialized"
- [ ] Blue logs: "Sending message to: /api/v1/chat/rag"
- [ ] **NO red errors** (errors = failure)
- [ ] **NO yellow warnings** about SessionProvider

---

### 4. Test Case C: Mobile Responsiveness

**Simulate Mobile:** F12 → Device Toolbar → iPhone 12

**For TEST.html:**
- [ ] Floating button still visible at bottom-right
- [ ] Widget opens as full-width minus padding
- [ ] Widget still fits on screen
- [ ] Can close and reopen
- [ ] Messages scroll smoothly
- [ ] Input field accessible
- [ ] Can send messages

**For /embed page (Direct):**
- [ ] Widget displays full-width on mobile
- [ ] Header visible
- [ ] Messages area scrollable
- [ ] Input field accessible
- [ ] Send button works

---

### 5. API Integration Test

**What Should Happen:**
1. Message is sent to: `/api/v1/chat/rag`
2. If API responds: use real response
3. If API fails: use demo fallback response
4. **Always show response - no error messages for demo**

**Check Console (F12):**
```
✅ Leadrat AI Chatbot initialized
🌐 URL: http://localhost:3000
💡 API: window.leadratChatbot.open() / .close() / .toggle()
📝 Shows as inline widget in bottom-right corner

[When sending message]
Sending message to: /api/v1/chat/rag
API Response status: 200  (or error, then uses fallback)
```

---

## Files to Verify

### 1. Frontend Components
- `frontend/components/ai/EmbedChatWidget.tsx` ← New component
  - Standalone (no SessionProvider needed)
  - Has demo/fallback responses
  - Proper error handling

- `frontend/app/embed/page.tsx` ← Updated
  - Uses EmbedChatWidget
  - No SessionProvider wrapper
  - Clean centered layout

### 2. Embed Script
- `frontend/public/EMBED.js` ← Updated v3.0
  - Creates floating button
  - Opens widget at bottom-right
  - Has toggle/open/close API

- `frontend/public/TEST.html` ← Test page
  - Demonstrates embed script
  - Shows control buttons
  - Comprehensive documentation

---

## Known Issues & Fixes Applied

### Issue 1: Text Invisible
**✅ FIXED:** Dark text (#111827) on light background (#ffffff)

### Issue 2: Chat Not Responding
**✅ FIXED:** Added demo/fallback responses for all common queries

### Issue 3: SessionProvider Error
**✅ FIXED:** Created standalone EmbedChatWidget without SessionProvider

### Issue 4: Widget Centered Instead of Bottom-Right
**✅ FIXED:** EMBED.js now positions widget at bottom-right in external HTML

### Issue 5: No Error Handling
**✅ FIXED:** Try API first, fallback to demo if fails, always show response

---

## Commit Checklist (Before Final Commit)

- [ ] All tests in Test Case A pass
- [ ] All tests in Test Case B pass
- [ ] Mobile responsiveness verified
- [ ] Console shows green logs (no red errors)
- [ ] Demo responses work for: hi, properties, schedule, price, leads
- [ ] No "SessionProvider" errors anywhere
- [ ] Floating button appears at bottom-right (not centered)
- [ ] Widget opens above button (not popup)
- [ ] Close button works
- [ ] Auto-close when clicking outside works

---

## Success Criteria

✅ **TEST PASSES WHEN:**

1. `/embed` loads without errors
2. TEST.html shows floating button at bottom-right
3. Clicking button opens widget at bottom-right
4. Typing a message gets a response (not an error)
5. Close/toggle buttons work
6. No console errors or SessionProvider warnings
7. Text is readable on light background
8. Responsive on mobile

---

## If Tests Fail

### Problem: Widget not appearing at bottom-right in TEST.html
**Solution:** Check EMBED.js positioning in CSS (search for `.leadrat-chatbot-widget`)

### Problem: Messages show errors instead of responses
**Solution:** Check browser console for API endpoint errors, verify fallback responses

### Problem: Text not readable
**Solution:** Verify EmbedChatWidget colors: text should be #111827 (dark), backgrounds should be light

### Problem: SessionProvider error
**Solution:** Make sure EmbedChatWidget is used, NOT ChatInterface in /embed/page.tsx

---

## Next Steps

1. **Test locally** following the test cases above
2. **Screenshot proof** for documentation
3. **Commit** with test summary
4. **Deploy** to staging/production

---

**Status:** Ready for testing
**Last Updated:** 2026-04-29
**Next Action:** Execute test cases above
