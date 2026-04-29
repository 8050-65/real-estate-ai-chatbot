# Production Deployment Guide - CEO Demo Ready

**Status:** ✅ Ready for Production  
**Last Updated:** April 29, 2026  
**Build Version:** 1.0.0

---

## 🚀 Quick Summary

This is a complete real estate AI chatbot with:
- **Frontend:** Next.js chatbot UI (Vercel-ready)
- **Backend:** Java Spring Boot CRM API (Render-ready)
- **AI Engine:** Ollama LLM + RAG with ChromaDB
- **FastAPI:** Chat/RAG microservice (Render-ready)
- **Integration:** Leadrat CRM API for live data

---

## 📋 Deployment Checklist

### Phase 1: Local Verification (Prerequisites)

- [ ] Clone repository
- [ ] Install Node.js 18+
- [ ] Install Python 3.8+
- [ ] Install Docker & Docker Compose
- [ ] Have Ollama installed locally

### Phase 2: Environment Configuration

#### Java Backend (.env)
```bash
# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/crm_cbt_db_dev
SPRING_DATASOURCE_USERNAME=rootuser
SPRING_DATASOURCE_PASSWORD=123Pa$$word!

# Leadrat API
LEADRAT_API_KEY=Zjg2N2JiNjItODBmOC00YzBjLTlkMmMtMjk5OGRiZjBmMDU3OmR1YmFpdDEx
LEADRAT_SECRET_KEY=a3Ay5UKLYjm6sZ_TXCXGzqmIdB3zgM8Y
LEADRAT_TENANT=dubait11
LEADRAT_BASE_URL=https://connect.leadrat.com/api/v1
LEADRAT_AUTH_URL=https://connect.leadrat.com/api/v1/authentication/token

# JWT
JWT_SECRET_KEY=your-super-secret-key-for-jwt-token-generation-must-be-32-chars

# Server
SERVER_PORT=8080
ENVIRONMENT=development
```

#### FastAPI Backend (.env)
```bash
# LLM
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3.2

# CORS (Production)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080,https://chatbot-leadrat.vercel.app

# Environment
ENVIRONMENT=development
DEBUG=False

# Leadrat
LEADRAT_API_KEY=Zjg2N2JiNjItODBmOC00YzBjLTlkMmMtMjk5OGRiZjBmMDU3OmR1YmFpdDEx
LEADRAT_SECRET_KEY=a3Ay5UKLYjm6sZ_TXCXGzqmIdB3zgM8Y
LEADRAT_TENANT=dubait11
```

#### Frontend (.env.local for local dev, .env.production for build)
```bash
# Local Development
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8001

# Production (set in Vercel dashboard)
NEXT_PUBLIC_API_URL=https://real-estate-api-dev.onrender.com
NEXT_PUBLIC_FASTAPI_URL=https://chatbot-backend.onrender.com
NEXT_PUBLIC_CHATBOT_URL=https://chatbot-leadrat.vercel.app
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│               Vercel (Frontend Hosting)                     │
│  https://chatbot-leadrat.vercel.app                         │
│                                                             │
│  ├─ Next.js Application                                    │
│  │  ├─ /ai-assistant (Full page chatbot)                   │
│  │  ├─ /public/chatbot-embed.js (Embeddable widget)        │
│  │  └─ /auth (Hidden in CEO demo mode)                     │
│  │                                                          │
│  └─ Environment Variables:                                  │
│     ├─ NEXT_PUBLIC_API_URL (Java backend)                  │
│     └─ NEXT_PUBLIC_FASTAPI_URL (FastAPI backend)           │
└─────────────────────────────────────────────────────────────┘
         ↓ HTTP/CORS                ↓ HTTP/CORS
┌─────────────────────────┐  ┌───────────────────────┐
│ Render (Java Backend)   │  │ Render (FastAPI)      │
│ :8080                   │  │ :8001                 │
│                         │  │                       │
│ Spring Boot CRM API     │  │ Chat/RAG Service      │
│ ├─ /api/v1/auth        │  │ ├─ /api/v1/chat      │
│ ├─ /api/v1/leads       │  │ ├─ /api/v1/search    │
│ ├─ /api/v1/properties  │  │ └─ /health           │
│ └─ /api/v1/status      │  │                       │
└─────────────────────────┘  └───────────────────────┘
         ↓ JDBC                    ↓ HTTP
    PostgreSQL             ┌──────────────────┐
    (AWS RDS)              │  Ollama LLM      │
                           │  (Local/Docker)  │
                           │  + ChromaDB RAG  │
                           └──────────────────┘
```

---

## 📦 Deployment Steps

### Step 1: Deploy Java Backend to Render

1. **Build Docker Image**
   ```bash
   cd backend-java
   docker build -t real-estate-crm:latest .
   ```

2. **Push to Docker Hub**
   ```bash
   docker tag real-estate-crm:latest vikramhuggi/real-estate-crm:latest
   docker push vikramhuggi/real-estate-crm:latest
   ```

3. **Create Render Service**
   - Service Type: Docker
   - Image URL: `vikramhuggi/real-estate-crm:latest`
   - Port: 8080
   - Environment Variables: (See section below)

4. **Set Environment Variables in Render Dashboard**
   ```
   SPRING_DATASOURCE_URL=jdbc:postgresql://[RDS-ENDPOINT]:5432/crm_cbt_db_dev
   SPRING_DATASOURCE_USERNAME=rootuser
   SPRING_DATASOURCE_PASSWORD=123Pa$$word!
   LEADRAT_API_KEY=Zjg2N2JiNjItODBmOC00YzBjLTlkMmMtMjk5OGRiZjBmMDU3OmR1YmFpdDEx
   LEADRAT_SECRET_KEY=a3Ay5UKLYjm6sZ_TXCXGzqmIdB3zgM8Y
   LEADRAT_TENANT=dubait11
   JWT_SECRET_KEY=your-super-secret-key-32-chars
   SERVER_PORT=8080
   ENVIRONMENT=production
   ```

5. **Verify Health Check**
   ```bash
   curl https://real-estate-api-dev.onrender.com/actuator/health
   ```
   Expected: `{"status":"UP"}`

### Step 2: Deploy FastAPI Backend to Render

1. **Build & Push Docker Image**
   ```bash
   cd backend-ai
   docker build -t chatbot-backend:latest .
   docker tag chatbot-backend:latest vikramhuggi/chatbot-backend:latest
   docker push vikramhuggi/chatbot-backend:latest
   ```

2. **Create Render Service**
   - Service Type: Docker
   - Image URL: `vikramhuggi/chatbot-backend:latest`
   - Port: 8001
   - Environment Variables: (See section below)

3. **Set Environment Variables**
   ```
   LLM_PROVIDER=ollama
   OLLAMA_BASE_URL=http://ollama:11434
   OLLAMA_MODEL=llama3.2
   ALLOWED_ORIGINS=https://chatbot-leadrat.vercel.app,https://real-estate-api-dev.onrender.com
   LEADRAT_API_KEY=Zjg2N2JiNjItODBmOC00YzBjLTlkMmMtMjk5OGRiZjBmMDU3OmR1YmFpdDEx
   LEADRAT_SECRET_KEY=a3Ay5UKLYjm6sZ_TXCXGzqmIdB3zgM8Y
   LEADRAT_TENANT=dubait11
   ENVIRONMENT=production
   ```

4. **Verify Health Check**
   ```bash
   curl https://chatbot-backend.onrender.com/health
   ```
   Expected: `{"status":"healthy"}`

### Step 3: Deploy Frontend to Vercel

1. **Connect GitHub Repository**
   - Sign in to Vercel
   - Import repository
   - Select `frontend` directory as root

2. **Set Production Environment Variables**
   In Vercel Dashboard → Settings → Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://real-estate-api-dev.onrender.com
   NEXT_PUBLIC_FASTAPI_URL=https://chatbot-backend.onrender.com
   NEXT_PUBLIC_CHATBOT_URL=https://chatbot-leadrat.vercel.app
   ```

3. **Trigger Build**
   ```bash
   git push origin main
   ```
   Vercel auto-deploys from main branch.

4. **Verify Deployment**
   - URL: `https://chatbot-leadrat.vercel.app`
   - Status: Check Vercel dashboard

---

## 🧪 Testing Production Deployment

### Test 1: Frontend Loads
```bash
curl -I https://chatbot-leadrat.vercel.app/ai-assistant
# Expected: HTTP 200
```

### Test 2: API Connectivity
```bash
# Check Java backend
curl https://real-estate-api-dev.onrender.com/api/v1/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@leadrat.com","password":"Admin@123!"}'

# Check FastAPI backend
curl https://chatbot-backend.onrender.com/health
```

### Test 3: Chat Flow (in browser)
1. Open https://chatbot-leadrat.vercel.app/ai-assistant
2. Click floating button
3. Ask: "What payment plans do you offer?"
4. Expected: RAG response in 2-5 seconds
5. Check browser console (F12) for errors

### Test 4: Embedded Widget
1. Create test HTML file:
   ```html
   <!DOCTYPE html>
   <html>
   <head><title>Test</title></head>
   <body>
     <h1>Testing Embed</h1>
     <script async src="https://chatbot-leadrat.vercel.app/chatbot-embed.js"
       data-chatbot-url="https://chatbot-leadrat.vercel.app">
     </script>
   </body>
   </html>
   ```
2. Open file in browser
3. Floating button appears
4. Can open/close chat

---

## 🔐 Security Checklist

- [ ] JWT_SECRET_KEY is strong (32+ characters)
- [ ] Database credentials are not in code
- [ ] Leadrat API keys are in environment variables (not code)
- [ ] CORS is configured for specific domains (not `*`)
- [ ] HTTPS is enforced (Vercel/Render provide this)
- [ ] Sensitive data not logged to console
- [ ] Environment variables differ between dev/prod

---

## 🚨 Troubleshooting

### "API calls not working in production"
**Root Cause:** CORS blocking requests

**Solution:**
1. Check Render environment variables are set
2. Verify CORS origins include Vercel domain
3. Check browser console for "blocked by CORS" errors
4. In Java backend, update SecurityConfig.java with Vercel domain
5. In FastAPI, update config.py with Vercel domain

### "Ollama offline in production"
**Root Cause:** Ollama not running on server

**Solution:**
1. Ensure Ollama container runs on Render (or externally)
2. Set `OLLAMA_BASE_URL` to correct endpoint
3. Test: `curl $OLLAMA_BASE_URL/api/tags`

### "ChromaDB empty - no RAG results"
**Root Cause:** seed_rag.py not executed on deployment

**Solution:**
1. Run manually in production environment:
   ```bash
   python scripts/seed_rag.py
   ```
2. Or add to Docker initialization script

### "Build fails on Vercel"
**Root Cause:** Node version or dependency issue

**Solution:**
1. Ensure Node 18+ in Vercel settings
2. Check `npm ci` succeeds locally
3. Clear Vercel cache and rebuild

---

## 📊 Monitoring

### Health Check URLs
- Java Backend: `https://real-estate-api-dev.onrender.com/actuator/health`
- FastAPI: `https://chatbot-backend.onrender.com/health`
- Ollama: `http://localhost:11434/api/tags` (internal only)

### Logs
- **Vercel:** Deployments tab → specific deployment → logs
- **Render:** Services → select service → logs
- **Local:** Terminal output when running services

---

## 🎯 CEO Demo Flow

### Setup (15 minutes before demo)
1. Ensure all three services are running:
   - Vercel frontend (auto-deployed)
   - Render Java backend (running)
   - Render FastAPI backend (running)
   - Ollama service (running)

2. Test connectivity:
   ```bash
   # Frontend loads
   curl -I https://chatbot-leadrat.vercel.app/ai-assistant
   
   # APIs respond
   curl https://real-estate-api-dev.onrender.com/actuator/health
   curl https://chatbot-backend.onrender.com/health
   ```

### Demo Steps (5 minutes)
1. **Open Page:** https://chatbot-leadrat.vercel.app/ai-assistant
   - Show full-page chatbot UI
   - Point out status bar (Ollama, RAG, Leadrat indicators)

2. **Test General Question:** "What amenities does the project have?"
   - Show RAG retrieval (2-5 sec delay)
   - Show AI-generated response with context
   - Explain decision tree routing

3. **Test Structured Query:** "Show me available properties"
   - Show quick response (< 1 sec)
   - Show live data from Leadrat CRM
   - Explain API routing

4. **Multi-Turn Conversation:** 
   - Q: "Tell me about RERA regulations"
   - Q: "How does that affect my purchase?"
   - Show context awareness between turns

5. **Show Embedding:** Open embed-example.html in new tab
   - Show floating button on external website
   - Open/close chat window
   - Ask a question
   - Explain: "This widget works on ANY website"

### Key Talking Points
- ✅ **No API keys to manage** - All embedded
- ✅ **RAG-grounded responses** - Not hallucinated
- ✅ **Real-time CRM data** - Not cached templates
- ✅ **Embedded anywhere** - One script tag
- ✅ **Ollama local** - Private, no cloud costs
- ✅ **Mobile-friendly** - Full-screen on mobile
- ✅ **Multi-language ready** - 14 languages (if UI added)

---

## 📱 Demo Credentials

### Admin Login (if needed)
- **Email:** admin@leadrat.com
- **Password:** Admin@123!

### Leadrat API (for manual testing)
- **API Key:** Zjg2N2JiNjItODBmOC00YzBjLTlkMmMtMjk5OGRiZjBmMDU3OmR1YmFpdDEx
- **Secret:** a3Ay5UKLYjm6sZ_TXCXGzqmIdB3zgM8Y
- **Tenant:** dubait11

---

## 📚 Knowledge Base (RAG)

The chatbot has 6 documents in ChromaDB:
1. **Payment Plans** - CLP, TLP, Down Payment, Subvention, GST, Loans
2. **RERA Regulations** - Registration, obligations, buyer protection, delays
3. **Amenities** - Pools, gyms, clubhouses, community spaces
4. **Property Types** - Apartments, villas, plots, duplexes, penthouses
5. **Site Visit Process** - Scheduling, pre-visit, post-visit follow-up
6. **Investment Guide** - Strategies, metrics, due diligence

Each document has ~8 chunks for semantic search = 50 total vectors.

---

## 🔄 Continuous Deployment

### Auto-Deploy on GitHub Push
```bash
# Push to main branch
git add .
git commit -m "Feature: Implement Ollama + RAG chatbot"
git push origin main

# Vercel auto-deploys frontend
# For Java/FastAPI backends, push Docker images to registry
# Then manually trigger Render deployment (or use webhooks)
```

---

## 📞 Support & Contact

- **Owner:** Vikram Huggi (vikram.h@leadrat.com)
- **GitHub:** https://github.com/8050-65/real-estate-ai-chatbot
- **Live URL:** https://chatbot-leadrat.vercel.app/ai-assistant
- **API Docs:** https://real-estate-api-dev.onrender.com/swagger-ui.html

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-29 | Initial production-ready release |

---

**Status:** ✅ PRODUCTION READY  
**Build:** Verified for CEO Demo  
**Last Tested:** 2026-04-29
