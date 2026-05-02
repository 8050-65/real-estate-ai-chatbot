# Immediate Actions Required

## Status
✅ Code fixes applied:
- Session context safe fallback
- Environment-based URLs
- Demo page text updated (customer-facing)
- API URL path handling fixed

❌ NOT YET VERIFIED:
- API actually works (timeout error)
- Widget behavior correct
- Properties/projects data showing

---

## Your Next Steps (In Order)

### STEP 1: Run Critical Tests (5 minutes)
**File:** `CRITICAL_TEST.md`

Run these commands and paste exact output:

```powershell
# Test 1: FastAPI running?
curl http://localhost:8000/api/v1/chat/health

# Test 2: Simple message
curl -X POST http://localhost:8000/api/v1/chat/message `
  -H "Content-Type: application/json" `
  -d '{"message":"hello","tenant_id":"dubait11"}'

# Test 3: Find properties
curl -X POST http://localhost:8000/api/v1/chat/message `
  -H "Content-Type: application/json" `
  -d '{"message":"find properties","tenant_id":"dubait11"}'
```

**Expected:**
- Test 1: `{"status":"ok"}`
- Test 2: Response within 2 seconds
- Test 3: Response within 5 seconds

**If timeout:** FastAPI backend is hanging

---

### STEP 2: Check FastAPI Terminal
While running curl tests, watch FastAPI terminal for logs:

```
[ChatAPI] Processing: ...
INFO: "POST /api/v1/chat/message HTTP/1.1" 200
```

**If you see errors:** Copy-paste them

---

### STEP 3: Report Findings
Send me:
1. Curl test outputs
2. FastAPI logs during requests
3. Network request details from DevTools
4. Any error messages

**THEN** I can identify exact root cause and fix it

---

## Possible Issues & Quick Fixes

### If Ollama is slow
```bash
# Check if Ollama is running:
curl http://localhost:11434/api/tags

# If not running - it's OK, should have fallback
# But if it's slow, add timeout to .env.local:
OLLAMA_TIMEOUT_SECONDS=5
```

### If Spring Boot is needed
```bash
# Start Spring Boot for property data:
cd backend-java
docker run -p 8080:8080 leadrat-backend
```

### If RAG is hanging
- Already disabled in main.py (lines 136-138 commented out)
- Verify it's still commented

### If Leadrat API is slow
- Check LEADRAT_API_KEY in .env.local
- Or use mock data mode if available

---

## DO NOT PROCEED UNTIL:

1. ✅ API calls complete within 5 seconds
2. ✅ Browser shows properties/projects data (not error)
3. ✅ FastAPI logs show successful endpoint calls
4. ✅ Network shows POST to localhost:8000 (not 11434)

---

## Files Changed (For Reference)

```
frontend/public/chatbot-demo.html         - Customer-friendly text
frontend/lib/session-context.tsx          - Safe no-op fallback
frontend/components/ai/ChatInterface.tsx  - API path handling
CRITICAL_TEST.md                          - Diagnostic tests
DEBUG_API_TIMEOUT.md                      - Detailed debugging
```

---

**RUN TESTS NOW - Send me output → I'll fix the backend issue**
