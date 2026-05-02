# CRITICAL API TEST - Run This NOW

## Test 1: Is FastAPI Running?

```powershell
# Ping FastAPI health endpoint
curl http://localhost:8000/api/v1/chat/health

# Expected response:
# {"status":"ok","message":"Health check passed"}

# If you get:
# curl: (7) Failed to connect to localhost port 8000: Connection refused
# → FastAPI is NOT running - start it first!
```

---

## Test 2: Send Simple Chat Message via Curl

```powershell
curl -X POST http://localhost:8000/api/v1/chat/message `
  -H "Content-Type: application/json" `
  -d '{
    "message": "hello",
    "tenant_id": "dubait11"
  }'

# You should get back JSON response within 5 seconds
# If it hangs for 10+ seconds then times out → backend is slow/hanging
```

**Paste response here:**
```
[RESPONSE]
```

---

## Test 3: Send Property Search via Curl

```powershell
curl -X POST http://localhost:8000/api/v1/chat/message `
  -H "Content-Type: application/json" `
  -d '{
    "message": "find properties",
    "tenant_id": "dubait11"
  }'

# Expected: Returns property data in chat response
# If timeout → FASTapi backend is hanging
```

**Paste response here:**
```
[RESPONSE]
```

---

## Test 4: Check FastAPI Terminal Output

While running the curl above, **watch FastAPI terminal** for logs like:

```
[ChatAPI] Processing: intent=unit_availability, tenant=dubait11
[ChatAPI] Attempt 1/3 - POST http://localhost:8000/api/v1/chat/message
INFO: "POST /api/v1/chat/message HTTP/1.1" 200
```

**What you see:**
```
[PASTE LOGS HERE]
```

---

## Test 5: Check if Spring Boot is Running (Optional)

```powershell
# If you started Spring Boot on port 8080, check:
curl http://localhost:8080/health

# If FastAPI needs to call Spring Boot for property data:
curl http://localhost:8080/api/properties
```

---

## If All Tests Fail with Timeout (10+ seconds)

This means FastAPI is:
1. Hanging on initializing something (RAG, Ollama, database)
2. Or making a blocking downstream call that's timing out
3. Or has a bug in the chat message handler

**Check FastAPI logs for:**
```
# Look for:
ERROR: ...
Traceback: ...
Connection refused: ...
Timeout: ...
Ollama: ...
```

---

## Possible Quick Fixes

### If RAG/Chroma DB is the problem:
- Verify these lines are commented in `backend-ai/app/main.py`:
```python
# rag_router initialization should be commented out
```

### If Ollama is timing out:
- Check OLLAMA_BASE_URL in .env.local is correct: `http://localhost:11434`
- Ollama timeout should NOT be fatal (should have fallback)

### If Leadrat API key is invalid:
- Regenerate in .env.local
- Or use mock/test mode if available

### If Spring Boot is needed but missing:
```bash
# Start Spring Boot
cd backend-java
docker run -p 8080:8080 leadrat-backend
```

---

## Report Format

**Provide:**
1. Result of Test 1 (health check)
2. Result of Test 2 (simple hello)
3. Result of Test 3 (find properties)
4. FastAPI terminal logs during tests
5. Any errors in FastAPI

**Then I can pinpoint exact issue.**
