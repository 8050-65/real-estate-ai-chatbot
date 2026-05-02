# Final Fixes Needed - 3 Critical Issues

## Issue 1: Chat Window Auto-Opens (Not Hidden on Load)

### Current: ❌
- Page loads → chat window already open
- No floating button-only state

### Expected: ✅
- Page loads → only message icon visible (bottom-right)
- User clicks icon → chat panel opens
- User clicks X → chat closes, only icon visible again

### Root Cause:
- Need to verify chatbot-embed.js doesn't auto-call `.open()`
- Or something in demo page is opening it

### Quick Fix:
Check if demo page or embed script has this code:
```javascript
window.leadratChatbot.open()  // ← Should NOT be here
```

**If found:** Remove it
**If not:** Widget starts correctly hidden, this is OK

---

## Issue 2: Widget Shows Internal CRM UI

### Current: ❌
Shows:
- "Real Estate CRM Assistant"
- "Online" status badge
- "Leadrat Connected" text
- Language selector
- "Ask AI?" button
- Internal dark CRM styling

### Expected: ✅
Shows ONLY:
- Simple header "REIA"
- "Real Estate AI"
- Customer greeting
- Chat messages
- Input box
- Quick actions (Find Properties, View Projects, etc.)

### Root Cause:
ChatInterface is designed for internal CRM dashboard, not customer widget.

### Solution:
Create embedded-only ChatInterface styling/variant:
1. Hide internal CRM elements in embedded mode
2. OR create separate simpler component for widget

### Quick CSS Hide:
Add to embedded/page.tsx or ChatInterface:
```css
[data-embedded="true"] .crm-badge,
[data-embedded="true"] .status-indicator,
[data-embedded="true"] .language-selector,
[data-embedded="true"] .online-status {
  display: none !important;
}

[data-embedded="true"] .header {
  padding: 12px;
  font-size: 14px;
}

[data-embedded="true"] {
  background: #1f2937;
  color: white;
}
```

**Priority:** Fix after backend timeout is resolved

---

## Issue 3: Backend API Times Out (10+ seconds)

### Current: ❌
```
The request took too long. Please try again or try a simpler search.
```

### Root Cause:
FastAPI `/api/v1/chat/health` is hanging → Health check endpoint times out

### Investigation:
**YOU MUST RUN THESE CURL TESTS:**

```powershell
# Test 1: Health check (should respond immediately)
curl -v http://localhost:8000/api/v1/chat/health

# Test 2: Simple message (should respond in 2-5 seconds)
$body = @{
    message = "hello"
    tenant_id = "dubait11"
} | ConvertTo-Json

curl -X POST http://localhost:8000/api/v1/chat/message `
  -H "Content-Type: application/json" `
  -d $body

# Test 3: Property search (should respond in 5-10 seconds)
$body = @{
    message = "find properties"
    tenant_id = "dubait11"
} | ConvertTo-Json

curl -X POST http://localhost:8000/api/v1/chat/message `
  -H "Content-Type: application/json" `
  -d $body
```

### What to Report:
For each test, provide:
1. **HTTP Status Code** (200, 500, timeout, connection refused, etc.)
2. **Response Body** (what the server returned)
3. **Time Taken** (how many seconds)
4. **FastAPI Terminal Output** (errors/logs during request)

### Likely Bottlenecks:

**If health endpoint hangs:**
- FastAPI startup is incomplete
- Some initialization is blocking

**If message endpoint hangs:**
- RAG initialization hanging (despite being disabled)
- Ollama hanging (should have timeout)
- LLM initialization hanging
- Downstream API hanging (Leadrat, Spring Boot)

### FastAPI Fixes (Once You Identify Bottleneck):

**If RAG is hanging:**
```python
# In main.py, verify this is commented:
# app.include_router(rag_router)
```

**If Ollama is hanging:**
```python
# Add timeout in .env.local:
LLM_TIMEOUT_SECONDS=5
OLLAMA_TIMEOUT_SECONDS=5
```

**If Leadrat/Spring Boot is hanging:**
```python
# Add fallback in chat.py
# Make chat endpoint return mock/cached data if downstream times out
```

---

## Priority Order

### 🔴 CRITICAL (Blocks testing):
1. **Backend timeout** - API must respond within 10 seconds
   - Run curl tests → Identify bottleneck → Fix

### 🟡 HIGH (Customer experience):
2. **Widget auto-open** - Should not open automatically
   - Check for auto-open code → Remove if found

3. **Widget UI cleanup** - Remove CRM internals
   - Hide internal badges/status
   - Simplify styling for customer mode

---

## Test Acceptance Criteria

✅ All must be true:

1. Chat starts HIDDEN (only icon visible)
2. Widget has clean customer UI (no CRM text)
3. Find Properties request completes < 10 seconds
4. View Projects request completes < 10 seconds
5. Backend returns data or clear error (not timeout)
6. No localhost:11434/api/tags calls

---

## YOUR ACTION NOW:

1. **Run the 3 curl tests above**
2. **Provide output for each:**
   - HTTP status
   - Response body
   - Time taken
   - FastAPI logs

3. **I will:**
   - Identify what's hanging
   - Fix backend timeout
   - Then clean up UI/auto-open issues
