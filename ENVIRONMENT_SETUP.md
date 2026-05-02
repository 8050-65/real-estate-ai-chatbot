# Environment Configuration Guide

## Overview

This project uses environment-based configuration to support both local development and production deployment without code changes. URLs resolve dynamically at runtime.

---

## Architecture

```
Browser/Widget
    ↓
[Detect: localhost? → use http://localhost URLs : use production URLs]
    ↓
ChatBot UI at:
    - Local: http://localhost:3000/embedded
    - Prod:  https://leadrat-chat-widget.pages.dev/embedded
    ↓
FastAPI at:
    - Local: http://localhost:8000/api/v1/chat/message
    - Prod:  https://real-estate-rag-dev.onrender.com/api/v1/chat/message
    ↓
Spring Boot / LeadRat APIs
    - Internal: http://localhost:8080 (local) or production URL
    - External: https://connect.leadrat.com/api/v1 (always .com domain)
```

---

## LOCAL DEVELOPMENT SETUP

### 1. Frontend Environment (.env.local)

**File:** `frontend/.env.local`

```env
# Widget and API URLs (use http://localhost)
NEXT_PUBLIC_WIDGET_BASE_URL=http://localhost:3000
NEXT_PUBLIC_CHAT_API_URL=http://localhost:8000/api/v1/chat/message
NEXT_PUBLIC_CHAT_HEALTH_URL=http://localhost:8000/api/v1/chat/health
NEXT_PUBLIC_SPRING_BOOT_URL=http://localhost:8080
NEXT_PUBLIC_DEFAULT_TENANT_ID=dubait11
```

**What these do:**
- `NEXT_PUBLIC_WIDGET_BASE_URL`: Used for iframe src in embed script
- `NEXT_PUBLIC_CHAT_API_URL`: ChatInterface sends messages here
- `NEXT_PUBLIC_CHAT_HEALTH_URL`: Optional health check endpoint
- `NEXT_PUBLIC_SPRING_BOOT_URL`: For backend reference (not directly called by browser)
- `NEXT_PUBLIC_DEFAULT_TENANT_ID`: Default tenant for new sessions

### 2. FastAPI Backend Environment (.env.local)

**File:** `backend-ai/.env.local`

```env
# Environment
ENVIRONMENT=development
DEBUG=True
LOG_LEVEL=DEBUG

# Local LLM (Ollama runs locally - NEVER called from browser)
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434

# External APIs (Leadrat uses production domain)
LEADRAT_BASE_URL=https://connect.leadrat.com/api/v1
LEADRAT_TENANT=dubait11
LEADRAT_API_KEY=... (from your Leadrat account)

# Spring Boot (Local test backend)
SPRING_BOOT_URL=http://localhost:8080

# CORS (Allow localhost frontend)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

**What these do:**
- `OLLAMA_BASE_URL`: INTERNAL ONLY - FastAPI calls Ollama here (browser never calls this!)
- `LEADRAT_BASE_URL`: Must use `.com` domain for production tenant data
- `SPRING_BOOT_URL`: FastAPI calls this to fetch properties/projects for chat responses

### 3. Spring Boot Backend Environment

**File:** `backend-java/.env` or Docker env vars

```env
LEADRAT_BASE_URL=https://connect.leadrat.com
SPRING_BOOT_PORT=8080
```

---

## LOCAL TESTING FLOW

### Start All Services

```bash
# Terminal 1 - Frontend (http://localhost:3000)
cd frontend
npm run dev
# Watches for NEXT_PUBLIC_* env vars from .env.local

# Terminal 2 - FastAPI Backend (http://localhost:8000)
cd backend-ai
python -m uvicorn app.main:app --reload --port 8000
# Reads .env.local on startup

# Terminal 3 - Spring Boot (http://localhost:8080)
cd backend-java
docker run -p 8080:8080 leadrat-backend
# Or: mvn spring-boot:run
```

### URL Resolution at Runtime

1. **Browser loads** `http://localhost:3000/chatbot-demo.html`

   ```javascript
   // chatbot-demo.html detects localhost
   const isLocalhost = true;
   const chatbotUrl = 'http://localhost:3000';
   const apiUrl = 'http://localhost:8000';
   ```

2. **Embed script loads** `http://localhost:3000/chatbot-embed.js`

   ```javascript
   // chatbot-embed.js detects localhost
   const defaultChatbotUrl = 'http://localhost:3000';
   const defaultApiUrl = 'http://localhost:8000/api/v1/chat/message';
   ```

3. **ChatInterface initializes** from `http://localhost:3000/embedded`

   ```javascript
   // ChatInterface detects localhost
   const defaultBackend = 'http://localhost:8000';
   // Reads NEXT_PUBLIC_CHAT_API_URL from build
   ```

4. **Floating widget button** sends message to FastAPI:

   ```
   POST http://localhost:8000/api/v1/chat/message
   Body: {
     "message": "Show properties",
     "tenant_id": "dubait11"
   }
   ```

5. **FastAPI processes** and calls:

   - **Ollama** (internal): `http://localhost:11434/api/chat` ← Browser never calls this
   - **Leadrat API** (external): `https://connect.leadrat.com/api/v1` ← Always production
   - **Spring Boot** (local): `http://localhost:8080/api/properties` ← If configured

6. **Response** returns properties/projects to chat UI

---

## PRODUCTION DEPLOYMENT

### 1. Build Frontend with Production Environment

```bash
# Create .env.production (copy from .env.production.example)
cp frontend/.env.production.example frontend/.env.production

# Edit .env.production with actual production domains
NEXT_PUBLIC_WIDGET_BASE_URL=https://leadrat-chat-widget.pages.dev
NEXT_PUBLIC_CHAT_API_URL=https://real-estate-rag-dev.onrender.com/api/v1/chat/message
NEXT_PUBLIC_DEFAULT_TENANT_ID=dubait11
```

### 2. Build and Deploy Frontend

```bash
cd frontend
npm run build  # Uses .env.production
npm run start  # or deploy to Vercel/Pages

# Environment variables embedded in build
```

### 3. Deploy FastAPI Backend

```bash
# Create .env.production (copy from .env.production.example)
cp backend-ai/.env.production.example backend-ai/.env.production

# Edit with production values
ENVIRONMENT=production
LEADRAT_BASE_URL=https://connect.leadrat.com/api/v1
OLLAMA_BASE_URL=http://production-ollama-host:11434
SPRING_BOOT_URL=https://production-spring-boot-url.com

# Deploy to Render.com, AWS, GCP, etc.
```

### 4. Runtime URL Resolution in Production

When browser loads the deployed widget from `https://leadrat-chat-widget.pages.dev`:

```javascript
// chatbot-demo.html detects production domain
const isLocalhost = false;
const chatbotUrl = 'https://leadrat-chat-widget.pages.dev';
const apiUrl = 'https://real-estate-rag-dev.onrender.com';
```

**Flow:**
```
Browser → https://leadrat-chat-widget.pages.dev/embedded
         → POST https://real-estate-rag-dev.onrender.com/api/v1/chat/message
         → FastAPI processes
         → Ollama (internal, no browser call)
         → https://connect.leadrat.com/api/v1 (external)
         → Response to chat UI
```

---

## CRITICAL RULES

### ✅ DO (Correct)

1. **Browser calls ONLY FastAPI:**
   ```
   POST http://localhost:8000/api/v1/chat/message ✓
   ```

2. **FastAPI calls Ollama internally:**
   ```
   // Inside FastAPI only
   OLLAMA_BASE_URL=http://localhost:11434 ✓
   ```

3. **FastAPI calls Leadrat:**
   ```
   // Inside FastAPI
   https://connect.leadrat.com/api/v1 ✓
   ```

4. **Use environment variables:**
   ```env
   NEXT_PUBLIC_CHAT_API_URL=http://localhost:8000/api/v1/chat/message ✓
   ```

5. **Leadrat domain is always `.com` in production:**
   ```
   https://connect.leadrat.com ✓
   ```

### ❌ DON'T (Wrong)

1. **Browser calling Ollama:**
   ```
   fetch('http://localhost:11434/api/tags') ❌
   ```

2. **Hardcoded URLs in code:**
   ```javascript
   const API_URL = 'https://real-estate-rag-dev.onrender.com'; ❌
   ```

3. **Using `.info` domain in production:**
   ```
   https://connect.leadrat.info ❌
   ```

4. **Browser calling Spring Boot directly:**
   ```
   fetch('http://localhost:8080/api/properties') ❌
   ```

---

## DEBUG LOGS

### Check Frontend URL Resolution

Open DevTools Console and look for:
```
[Demo Page] Resolved environment: {
  isLocalhost: true,
  chatbotUrl: "http://localhost:3000",
  apiUrl: "http://localhost:8000"
}

[Leadrat Chatbot] Resolved configuration: {
  isLocalhost: true,
  chatbotUrl: "http://localhost:3000",
  apiUrl: "http://localhost:8000/api/v1/chat/message",
  tenantId: "dubait11",
  iframeSrc: "http://localhost:3000/embedded?tenantId=dubait11&..."
}

[ChatInterface] Initialized: {
  tenant: "dubait11",
  backendBase: "http://localhost:8000",
  fullChatApiUrl: "http://localhost:8000/api/v1/chat/message",
  isLocalhost: true
}
```

### Check FastAPI URL Resolution

Look for FastAPI startup logs:
```
INFO:     environment_configuration
environment=development
leadrat_base_url=https://connect.leadrat.com/api/v1
ollama_base_url=http://localhost:11434
spring_boot_url=http://localhost:8080
cors_allowed_origins=http://localhost:3000,http://localhost:8000
```

### Verify No Browser Calls to Ollama

DevTools Network tab → Filter: `11434`

**Expected:** Zero requests
**If you see requests:** Check chatbot-embed.js for Ollama health checks (should be removed)

---

## Troubleshooting

### Frontend using production URL when running locally

**Problem:** ChatInterface.tsx shows `https://real-estate-rag-dev.onrender.com`

**Solution:**
1. Ensure `.env.local` has `NEXT_PUBLIC_CHAT_API_URL=http://localhost:8000/api/v1/chat/message`
2. Run `npm run dev` (not `npm start`)
3. Hard refresh browser: `Ctrl+Shift+R`
4. Check console for `[ChatInterface] Initialized` log

### FastAPI not loading `.env.local`

**Problem:** FastAPI using defaults instead of `.env.local` values

**Solution:**
```bash
# Install python-dotenv if not present
pip install python-dotenv

# Restart FastAPI
cd backend-ai
python -m uvicorn app.main:app --reload --port 8000
# Should load .env.local automatically
```

### Browser calling Ollama at localhost:11434

**Problem:** Network tab shows requests to `http://localhost:11434/api/tags`

**Solution:**
1. Check `public/chatbot-embed.js` has no Ollama health check functions
2. Check `components/ai/ChatInterface.tsx` doesn't call Ollama
3. Only FastAPI should call Ollama internally
4. Clear browser cache: `Ctrl+Shift+Delete`

### Leadrat API returning 401/403

**Problem:** FastAPI logs show authentication errors

**Solution:**
1. Check `LEADRAT_API_KEY` and `LEADRAT_SECRET_KEY` in `.env.local`
2. Ensure tenant is `dubait11` (or your actual tenant)
3. Check Leadrat API is responsive: `curl https://connect.leadrat.com/api/v1/health`
4. Verify token hasn't expired (should auto-refresh)

---

## Deployment Checklist

- [ ] Create `frontend/.env.production` with production URLs
- [ ] Create `backend-ai/.env.production` with production URLs  
- [ ] Build frontend: `npm run build`
- [ ] Set environment variables in deployment platform:
  - [ ] Render.com → Settings → Environment
  - [ ] Vercel → Settings → Environment Variables
  - [ ] AWS/GCP → CloudRun env vars or Secrets Manager
- [ ] Deploy and monitor logs
- [ ] Test widget at production domain
- [ ] Verify no requests to localhost:11434
- [ ] Verify responses show real property/project data
- [ ] Monitor Sentry/logs for errors

---

## Summary

**Local:** All URLs auto-detect localhost → use http://localhost:*
**Production:** All URLs auto-detect production domain → use https://production-urls
**No code changes needed** → Just set environment variables!
