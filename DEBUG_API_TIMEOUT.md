# API Timeout Debugging Guide

## Error Observed
```
The request took too long. Please try again or try a simpler search.
```

This means:
- ✅ Browser sent POST to http://localhost:8000/api/v1/chat/message
- ❌ FastAPI responded with timeout (10-second threshold)
- ❌ Request never completed

---

## Step 1: Verify FastAPI is Running

```bash
# Terminal where FastAPI is running should show:
INFO:     Uvicorn running on http://0.0.0.0:8000

# If you see errors like:
ImportError: No module named 'app'
ModuleNotFoundError: 
# FastAPI is NOT running properly

# Solution: Check error and install dependencies
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

---

## Step 2: Check FastAPI Startup Logs

**Expected startup output:**
```
INFO:     environment_configuration
  environment=development
  leadrat_base_url=https://connect.leadrat.com/api/v1
  ollama_base_url=http://localhost:11434
  spring_boot_url=http://localhost:8080

INFO:     service_ready
  status=healthy
  llm_provider=ollama
  environment=development
```

**If you see errors:**
- Connection refused to Ollama → Ollama not running (OK for now, should gracefully degrade)
- Connection refused to Spring Boot → Spring Boot not running on :8080
- Import errors → Missing dependencies
- RAG initialization error → Chroma DB disabled (should be OK from previous fix)

---

## Step 3: Make Direct API Call with Curl

Run this command and **provide exact response**:

```powershell
# Test 1: Try with tenantId (snake_case)
curl -X POST http://localhost:8000/api/v1/chat/message `
  -H "Content-Type: application/json" `
  -d '{"message":"find properties","tenant_id":"dubait11","sessionId":"test-1"}'

# Wait for response - paste full output below
```

**Copy-paste output here:**
```
[PASTE CURL OUTPUT HERE]
```

---

## Step 4: Check Network Request Details

**In browser DevTools:**

1. Click "Find Properties" button
2. DevTools → Network tab
3. Find the POST request to `localhost:8000/api/v1/chat/message`
4. Click on it
5. Screenshot/paste:

**Request tab:**
```
POST http://localhost:8000/api/v1/chat/message
Headers:
- Content-Type: application/json

Body:
{
  "message": "...",
  "tenant_id": "...",
  "sessionId": "..."
}
```

**Response tab:**
```
Status: ???
Headers: ???
Body: ???
```

**Timing tab:**
```
Duration: ??? ms
Wait (TTFB): ??? ms
Download: ??? ms
```

---

## Step 5: Check FastAPI Logs During Request

**What to look for in FastAPI terminal:**

```
# When message is sent from browser, FastAPI should log:

[ChatAPI] Processing: {
  intent: "unit_availability",
  tenant: "dubait11",
  backend: "http://localhost:8000/api/v1/chat/message"
}

# Then logs for each step:

[ChatAPI] Attempt 1/3 - POST http://localhost:8000/api/v1/chat/message

# If it times out, you should see:
ERROR: Request timeout after 10 seconds
# OR: Connection refused to http://localhost:8000/api/v1/chat/message (double endpoint!)

# If downstream fails:
[ERROR] Failed to call Leadrat API: ...
[ERROR] Failed to call Spring Boot: ...
[ERROR] Ollama connection refused: ... (this is OK, should fallback)
```

---

## Common Timeout Causes & Fixes

### Cause 1: Wrong Backend URL
**Symptom:** `Connection refused http://localhost:8000/api/v1/chat/message/api/v1/chat/message`

**Fix:** Check ChatInterface.tsx line 301 - should detect if path is already included
```javascript
const chatEndpoint = backendUrl.endsWith('/api/v1/chat/message')
  ? backendUrl
  : `${backendUrl}/api/v1/chat/message`;
```

### Cause 2: FastAPI Not Running
**Symptom:** `Connection refused: No connection could be made because the target machine actively refused it`

**Fix:** Start FastAPI
```bash
cd backend-ai
python -m uvicorn app.main:app --reload --port 8000
```

### Cause 3: RAG/Chroma DB Hanging
**Symptom:** Logs show RAG initialization or slow vector search

**Fix:** Already commented out in main.py (lines 136-138) - verify it's still commented

### Cause 4: Downstream API Timeout
**Symptom:** FastAPI logs show "Waiting for Leadrat API..." or "Waiting for Spring Boot..."

**Scenarios:**
- **Leadrat API** - needs valid API key in .env.local
- **Spring Boot** - needs to be running on :8080 OR have fallback in FastAPI
- **Ollama** - internal only, timeout is OK (should have fallback)

**Fix Options:**
1. Ensure Spring Boot running: `docker run -p 8080:8080 leadrat-backend`
2. Check LEADRAT credentials in .env.local
3. Reduce timeout if API is slow: `LLM_TIMEOUT_SECONDS=30` in .env.local

### Cause 5: Payload Format Wrong
**Symptom:** FastAPI returns 422 Unprocessable Entity or silent timeout

**Check:**
- Field names: `tenant_id` (not `tenantId`)
- Required fields present: message, tenant_id
- No extra/unknown fields
- JSON is valid

---

## Quick Diagnostic Test

Run this in browser console and **provide output:**

```javascript
// Check resolved URLs
console.log('Environment:', {
  isLocalhost: window.location.hostname === 'localhost',
  apiUrl: document.URL // or check from sessionStorage
});

// Try direct fetch to test endpoint
fetch('http://localhost:8000/api/v1/chat/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'test',
    tenant_id: 'dubait11',
    sessionId: 'browser-test'
  })
})
  .then(r => {
    console.log('Status:', r.status);
    return r.json();
  })
  .then(data => console.log('Response:', data))
  .catch(e => console.error('Error:', e.message));
```

**Paste console output here:**
```
[PASTE OUTPUT]
```

---

## If Still Timing Out

**Provide ALL of:**

1. FastAPI startup logs (first 30 lines)
2. FastAPI logs when you click "Find Properties"
3. Browser Network tab screenshot of POST request
4. Browser Console logs (all output)
5. Curl response from Step 3
6. Output of diagnostic test above

---

## Expected Working Flow

```
Browser sends:
POST http://localhost:8000/api/v1/chat/message
{
  "message": "find properties",
  "tenant_id": "dubait11"
}
  ↓
FastAPI receives (logs step):
[ChatAPI] Processing: intent=unit_availability, tenant=dubait11
  ↓
FastAPI calls Spring Boot (or returns mock):
GET http://localhost:8080/api/properties
  ↓
FastAPI returns (logs response):
200 OK with {
  "content": "Found 5 properties...",
  "data": [...]
}
  ↓
Browser receives and displays in chat
  ✅ No timeout
```

---

## Next Steps

1. **Provide all diagnostics above**
2. **Once we have logs**, we can pinpoint exact issue
3. **Fix the root cause**
4. **Verify working**
