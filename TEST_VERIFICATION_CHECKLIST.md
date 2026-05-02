# Test Verification Checklist

## All Fixes Applied

### 1. ✅ Session Context Fix
**File:** `frontend/lib/session-context.tsx`  
**Line:** 70-82

**Problem:** `useSession()` was throwing error when SessionProvider not available  
**Fix:** Returns no-op implementation for embedded mode (when SessionProvider missing)

```typescript
// Before: throw new Error('useSession must be used within SessionProvider')
// After: return safe no-op implementation
```

### 2. ✅ API URL Configuration
**Files Changed:**
- `frontend/public/chatbot-demo.html` - Line 157-159: Updated apiUrl to include full path
- `frontend/public/chatbot-embed.js` - Line 36: Uses full path with /api/v1/chat/message
- `frontend/components/ai/ChatInterface.tsx` - Line 301-305: Smart path handling to avoid double-appending

**Result:** Browser calls exact endpoint:
```
POST http://localhost:8000/api/v1/chat/message ✅
NOT: http://localhost:8000 (missing path)
NOT: http://localhost:8000/api/v1/chat/message/api/v1/chat/message (double path)
```

### 3. ✅ Removed "View Leads" Button
**File:** `frontend/components/ai/ChatInterface.tsx`  
**Line:** 1002

**Change:** Back to Main menu now shows properties/projects/booking options only:
```
['🏠 Available Properties', '🏗️ Show Projects', '📅 Schedule Site Visit', '📞 Schedule Callback']
```

### 4. ✅ Environment-Based URL Resolution
**Files:**
- `frontend/.env.local` - Local development URLs
- `frontend/.env.production.example` - Production URLs
- `backend-ai/.env.local` - FastAPI local config
- `backend-ai/.env.production.example` - FastAPI production config
- `frontend/public/chatbot-demo.html` - Dynamic environment detection
- `frontend/public/chatbot-embed.js` - Fallback to correct defaults

---

## Local Testing (http://localhost:3000/chatbot-demo.html)

### REQUIRED SETUP

```bash
# Terminal 1: Frontend
cd frontend
npm run dev
# Reads .env.local, listens on :3000

# Terminal 2: FastAPI
cd backend-ai
python -m uvicorn app.main:app --reload --port 8000
# Reads .env.local, shows environment logs

# Terminal 3: Spring Boot (optional but recommended)
cd backend-java
docker run -p 8080:8080 leadrat-backend
```

---

## Step-by-Step Verification

### Step 1: Check Browser Console Logs
**Open:** http://localhost:3000/chatbot-demo.html  
**Open DevTools:** F12 → Console tab

**Expected logs:**
```
[Demo Page] Resolved environment: {
  isLocalhost: true,
  chatbotUrl: "http://localhost:3000",
  apiUrl: "http://localhost:8000/api/v1/chat/message",
  embedScriptUrl: "http://localhost:3000/chatbot-embed.js"
}

[Leadrat Chatbot] Resolved configuration: {
  isLocalhost: true,
  chatbotUrl: "http://localhost:3000",
  apiUrl: "http://localhost:8000/api/v1/chat/message",
  tenantId: "dubait11",
  iframeSrc: "http://localhost:3000/embedded?tenantId=dubait11&apiUrl=http%3A%2F%2Flocalhost%3A8000%2Fapi%2Fv1%2Fchat%2Fmessage"
}

[ChatInterface] Initialized: {
  tenant: "dubait11",
  backendBase: "http://localhost:8000/api/v1/chat/message",
  fullChatApiUrl: "http://localhost:8000/api/v1/chat/message",
  isLocalhost: true
}
```

✅ **Result:** All URLs point to localhost:3000 and localhost:8000 (NOT production URLs)

---

### Step 2: Verify Iframe Src
**Open:** http://localhost:3000/chatbot-demo.html  
**Open DevTools:** F12 → Elements tab → Find `<iframe>` tag

**Expected iframe src:**
```html
<iframe src="http://localhost:3000/embedded?tenantId=dubait11&apiUrl=http%3A%2F%2Flocalhost%3A8000%2Fapi%2Fv1%2Fchat%2Fmessage" ...></iframe>
```

**Decoded:**
```
http://localhost:3000/embedded?tenantId=dubait11&apiUrl=http://localhost:8000/api/v1/chat/message
```

✅ **Result:** iframe points to correct local route with full API path

---

### Step 3: Verify Widget Loads Without Error
**Expected behavior:**
- ✅ Purple floating button appears in bottom-right
- ✅ Badge shows "1"
- ✅ Click button → widget opens
- ✅ Shows header: "REIA" / "Real Estate AI"
- ✅ Shows: "Backend Connected" status
- ✅ Shows greeting message (no error)
- ✅ Shows 4 quick action buttons

**NOT expected:**
- ❌ "Something went wrong! useSession must be used..."
- ❌ "Integration Examples" page
- ❌ Login page
- ❌ Dashboard UI
- ❌ Error boundary red screen

---

### Step 4: Verify No Ollama Calls from Browser
**Open DevTools:** Network tab → Type `11434` in filter

**Expected:** Zero requests

**If you see:**
```
GET http://localhost:11434/api/tags
```

Then there's still an Ollama health check in the code (should be removed).

---

### Step 5: Test Properties Button
**Steps:**
1. Click floating button to open widget
2. Click "🏠 Available Properties" button
3. Open DevTools → Network tab
4. Look for POST request

**Expected Network Request:**
```
POST http://localhost:8000/api/v1/chat/message
```

**Request Body (should look like):**
```json
{
  "message": "Show available properties",
  "conversation_history": [],
  "language": "en",
  "tenant_id": "dubait11"
}
```

**Response:** HTTP 200 with JSON containing properties/projects

**Expected chat response:** List of properties with details

---

### Step 6: Test Projects Button
**Steps:**
1. Click "🏗️ Show Projects" button
2. Network tab should show same POST to localhost:8000

**Expected response:** List of projects

---

### Step 7: Verify FastAPI Logs
**In FastAPI terminal, look for:**

```
INFO:     environment_configuration
  environment=development
  leadrat_base_url=https://connect.leadrat.com/api/v1
  ollama_base_url=http://localhost:11434
  spring_boot_url=http://localhost:8080
  cors_allowed_origins=http://localhost:3000,http://localhost:8000

INFO:     POST /api/v1/chat/message
[ChatAPI] Processing: {
  intent: "unit_availability",
  tenant: "dubait11",
  backendBase: "http://localhost:8000/api/v1/chat/message",
  fullApiUrl: "http://localhost:8000/api/v1/chat/message"
}
```

✅ **Result:** FastAPI logs show correct environment and endpoint

---

## Summary of Changes

### Files Modified:
1. **frontend/lib/session-context.tsx** - Safe no-op for missing SessionProvider
2. **frontend/components/ai/ChatInterface.tsx** - Smart API path handling, removed "View Leads"
3. **frontend/public/chatbot-demo.html** - Environment detection, full API URL
4. **frontend/public/chatbot-embed.js** - Proper fallback URLs with full paths
5. **backend-ai/app/main.py** - Added environment configuration logging

### Files Created:
1. **frontend/.env.local** - Local dev environment variables
2. **frontend/.env.production.example** - Production template
3. **backend-ai/.env.local** - FastAPI local configuration
4. **backend-ai/.env.production.example** - FastAPI production template
5. **ENVIRONMENT_SETUP.md** - Complete environment guide

---

## Critical URLs

### Local Development
```
Browser:         http://localhost:3000/chatbot-demo.html
Floating widget: http://localhost:3000/embedded (iframe)
API endpoint:    POST http://localhost:8000/api/v1/chat/message
Ollama:          http://localhost:11434 (FastAPI internal only - NEVER browser)
Leadrat:         https://connect.leadrat.com/api/v1
Spring Boot:     http://localhost:8080 (internal only)
```

### Production (after deployment)
```
Browser:         https://leadrat-chat-widget.pages.dev/chatbot-demo.html
Floating widget: https://leadrat-chat-widget.pages.dev/embedded (iframe)
API endpoint:    POST https://real-estate-rag-dev.onrender.com/api/v1/chat/message
Ollama:          (Production Ollama URL from env - internal only)
Leadrat:         https://connect.leadrat.com/api/v1 (.com always!)
Spring Boot:     (Production URL from env - internal only)
```

---

## Debugging Tips

### If iframe shows "Something went wrong!"
1. Check browser console for errors
2. Verify .env.local exists in frontend folder
3. Run `npm run dev` (not `npm start`)
4. Hard refresh: `Ctrl+Shift+R`
5. Check that useSession returns no-op in embedded mode

### If browser calls Ollama
1. Check chatbot-embed.js has no health check code
2. Grep for "11434" in all component files
3. Clear browser cache completely
4. Restart frontend dev server

### If API returns 401/403
1. Check LEADRAT_API_KEY and LEADRAT_SECRET_KEY in .env.local
2. Verify tenantId is "dubait11"
3. Check Leadrat API is responding: `curl https://connect.leadrat.com/api/v1/health`

### If properties/projects show as empty
1. Verify Spring Boot is running on :8080
2. Check FastAPI logs for errors
3. Test endpoint directly: `curl http://localhost:8000/api/v1/chat/message`

---

## When All Tests Pass

✅ Browser loads chatbot-demo.html  
✅ Floating widget appears in bottom-right  
✅ Widget opens without "useSession" error  
✅ Shows correct chat interface with no error  
✅ Network shows POST to localhost:8000/api/v1/chat/message  
✅ Network shows ZERO requests to localhost:11434  
✅ Properties button returns property data  
✅ Projects button returns project data  
✅ FastAPI logs show correct environment  
✅ Demo page text is customer-friendly  
✅ Back to Main buttons have no "View Leads"  

**Then the fix is complete and ready for:**
- Local development testing ✅
- Production deployment (with .env.production) ✅
