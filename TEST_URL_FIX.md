# URL Double-Append Fix - Test Instructions

## 🔧 What Was Fixed

**Problem:** `fullApiUrl` was showing:
```
http://localhost:8000/api/v1/chat/message/api/v1/chat/message
```

**Root Cause:** 
- backendUrl was being set to full path: `http://localhost:8000/api/v1/chat/message`
- Then code was appending `/api/v1/chat/message` again
- Result: Double path

**Solution Applied:**
- backendUrl now stays as FULL path throughout
- callLeadratAPI uses backendUrl directly without appending
- Timeout increased to 30 seconds for debugging

---

## 🧪 Test Now

### Step 1: Hard Refresh Browser
```
Ctrl+Shift+R
```
This clears cache and reloads the app.

### Step 2: Open Widget Test Page
```
http://localhost:3000/chatbot-demo.html
```

**Expected:**
- ✅ Only floating message icon visible (bottom-right)
- ❌ NOT full chat window open

### Step 3: Check Console Before Clicking
**DevTools:** F12 → Console tab

**Expected log on page load:**
```
[ChatInterface] Initialized: {
  tenant: "dubait11",
  chatApiUrl: "http://localhost:8000/api/v1/chat/message",
  isLocalhost: true,
  envChatApiUrl: "http://localhost:8000/api/v1/chat/message"
}
```

**NOT:**
```
chatApiUrl: "http://localhost:8000"
fullChatApiUrl: "http://localhost:8000/api/v1/chat/message/api/v1/chat/message"
```

### Step 4: Click "Find Properties" Button

**Expected console log:**
```
[ChatAPI] Processing: {
  intent: "unit_availability",
  tenant: "dubait11",
  backendUrl: "http://localhost:8000/api/v1/chat/message",
  message: "Find Properties"
}

[ChatAPI] Attempt 1/3 - POST http://localhost:8000/api/v1/chat/message
```

**NOT:**
```
fullApiUrl: "http://localhost:8000/api/v1/chat/message/api/v1/chat/message"
```

### Step 5: Check Network Tab

**DevTools:** Network tab

**Find POST request to:** `localhost:8000/api/v1/chat/message`

**Expected:**
- ✅ POST http://localhost:8000/api/v1/chat/message
- ✅ Status: 200 (or error from backend, but not a network error)
- ✅ Time: < 30 seconds (we increased timeout)

**NOT:**
- ❌ POST http://localhost:8000/api/v1/chat/message/api/v1/chat/message
- ❌ Double path in URL

### Step 6: Verify No Ollama Calls

**Network tab → Filter:** `11434`

**Expected:**
- ZERO requests to localhost:11434/api/tags

---

## 📊 Success Criteria

**All must be true:**

1. ✅ Console shows `chatApiUrl: "http://localhost:8000/api/v1/chat/message"` (NOT double path)
2. ✅ Network shows POST to correct single path
3. ✅ No localhost:11434 requests
4. ✅ Request completes (even if error from backend)
5. ✅ Widget starts hidden (only floating button visible)

---

## If URL is Still Wrong

**Symptom:** Console still shows double path

**Troubleshoot:**
1. Check .env.local exists and has correct URL:
   ```
   NEXT_PUBLIC_CHAT_API_URL=http://localhost:8000/api/v1/chat/message
   ```

2. Did you run `npm run dev`? (not `npm start`)

3. Hard refresh with Ctrl+Shift+R (not just F5)

4. Check if localStorage has stale URL:
   ```javascript
   // In console:
   localStorage.getItem('backendUrl')
   localStorage.clear() // Clear if wrong
   ```

5. Restart frontend:
   ```bash
   cd frontend
   npm run dev
   ```

---

## Next: Debug Backend If URL is Fixed

Once URL is fixed but API still times out:

1. Run curl tests from CRITICAL_TEST.md
2. Check FastAPI logs
3. Verify Spring Boot running (or mock responses working)
4. Check for Ollama/RAG hanging issues

---

## Files Changed

```
frontend/components/ai/ChatInterface.tsx
  - Line 427: Use full path in defaultBackend
  - Line 432-437: Keep full URL throughout
  - Line 261: Use backendUrl directly (no appending)
  - Line 254-260: Timeout increased to 30s
```

---

**Confirm URL is fixed → Then debug backend separately if needed**
