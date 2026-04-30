# 🏗️ DEV INFRASTRUCTURE DEPLOYMENT PLAN
**Environment:** Development Only  
**Domain Convention:** `.example.in` for Dev (placeholder)  
**Services:** Free-tier only (Vercel, Render, Upstash)  
**Status:** Planning Phase (Ready for actual deployment)

---

## 📊 ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INTERNET / DNS (Route53)                            │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
        ┌───────────▼────┐  ┌─────▼──────┐  ┌──▼──────────────┐
        │ CDN            │  │ DNS        │  │ SSL/HTTPS      │
        │ (CloudFlare)   │  │ Mapping    │  │ (Let's Encrypt)│
        └────────┬────────┘  └────────────┘  └─────────────────┘
                 │
    ┌────────────┼──────────────────────────────────────────┐
    │            │                                          │
    ▼            ▼                                          ▼
┌──────────────────────┐                      ┌──────────────────────┐
│  FRONTEND LAYER      │                      │  API LAYER           │
│  (Vercel)            │                      │  (Render)            │
├──────────────────────┤                      ├──────────────────────┤
│ https://dev-         │                      │ https://dev-         │
│ chatbot.example.in   │─────API Calls───────▶│ api.example.in       │
│                      │                      │                      │
│ • Next.js App        │◀─────Responses────────│ • Spring Boot        │
│ • React Components   │                      │ • Java Backend       │
│ • Multilingual UI    │                      │ • JWT Auth           │
│ • 14 Languages       │                      │ • Leadrat Integration│
└──────────────────────┘                      └──────────────────────┘
                                                       │
                      ┌────────────────────────────────┼──────────────────┐
                      │                                │                  │
                      ▼                                ▼                  ▼
            ┌──────────────────┐        ┌──────────────────┐  ┌─────────────────┐
            │ DATABASE         │        │ CACHE            │  │ RAG / LLM       │
            │ (PostgreSQL)     │        │ (Redis)          │  │ (FastAPI)       │
            ├──────────────────┤        ├──────────────────┤  ├─────────────────┤
            │ Managed PG       │        │ Upstash Redis    │  │ https://dev-    │
            │ (Railway/Render) │        │ (Free Tier)      │  │ rag.example.in  │
            │                  │        │                  │  │                 │
            │ • crm_cbt_db_dev │        │ • Sessions       │  │ • FastAPI       │
            │ • 14 Tables      │        │ • Cache          │  │ • Ollama LLM    │
            │ • 10 Migrations  │        │ • Rate Limiting  │  │ • Vector DB     │
            │ • Backups        │        │                  │  │ • RAG Pipeline  │
            └──────────────────┘        └──────────────────┘  └─────────────────┘
                      │                                                │
                      └────────────────────────────────────────────────┘
                                       │
                      ┌────────────────┴─────────────────┐
                      │                                  │
                      ▼                                  ▼
            ┌──────────────────┐        ┌──────────────────────┐
            │ VECTOR DB        │        │ ADMIN / DOCS         │
            │ (Upstash Vector) │        │ (Static/pgAdmin)     │
            ├──────────────────┤        ├──────────────────────┤
            │ Free Tier        │        │ https://dev-         │
            │ • Embeddings     │        │ docs.example.in      │
            │ • Document Store │        │                      │
            │ • Similarity     │        │ • API Documentation  │
            │   Search         │        │ • Database Admin     │
            └──────────────────┘        │ • Service Status     │
                                        └──────────────────────┘
```

---

## 🔗 DOMAIN MAPPING (DEV)

### Placeholder Domains (*.example.in)

| Service | Placeholder URL | Actual Service | Port |
|---------|-----------------|-----------------|------|
| **Frontend** | `https://dev-chatbot.example.in` | Vercel | 443 (HTTPS) |
| **API** | `https://dev-api.example.in` | Render (Java) | 443 (HTTPS) |
| **RAG/FastAPI** | `https://dev-rag.example.in` | Render (Python) | 443 (HTTPS) |
| **Admin/Docs** | `https://dev-docs.example.in` | Render (pgAdmin/Swagger) | 443 (HTTPS) |

### DNS Records (Placeholder)
```
Type    Name                  Value                           TTL
CNAME   dev-chatbot          cname.vercel-dns.com.           3600
CNAME   dev-api              api-dev.render.app              3600
CNAME   dev-rag              rag-dev.render.app              3600
CNAME   dev-docs             docs-dev.render.app             3600
TXT     _acme-challenge.dev  (SSL verification)              3600
```

---

## 📋 FREE-TIER SERVICES BREAKDOWN

### 1. Vercel (Frontend Hosting)
- **Service:** Next.js frontend deployment
- **Plan:** Free Hobby tier
- **Includes:** 
  - 1 concurrent build
  - 6000 build hours/month
  - Unlimited deployments
  - Serverless functions (up to 1000 calls/month)
  - Edge Middleware
  - SSL/HTTPS included
- **Limitations:**
  - Max function runtime: 10 seconds
  - Bandwidth limits: ~100GB/month (soft)
- **Cost:** $0/month
- **Requires:** GitHub account + sign in with GitHub

### 2. Render (Backend APIs)
- **Service:** Java Backend + FastAPI deployment
- **Plan:** Free tier
- **Includes:**
  - Shared CPU
  - 0.5GB RAM per service
  - 750 hours/month free tier
  - Auto-deploy from GitHub
  - SSL/TLS included
  - PostgreSQL databases (free)
  - Redis (free)
- **Limitations:**
  - Spins down after 15 minutes inactivity
  - Limited to 2-3 free services
  - 0.5GB RAM (may need to upgrade)
- **Cost:** $0/month (with limitations)
- **Requires:** GitHub account

### 3. Upstash Redis
- **Service:** Managed Redis cache
- **Plan:** Free tier
- **Includes:**
  - 10,000 commands/day
  - 256MB storage
  - TLS encryption
  - REST API + Redis CLI
  - Serverless function support
- **Cost:** $0/month
- **Requires:** Email signup

### 4. Upstash Vector DB
- **Service:** Vector database for RAG
- **Plan:** Free tier
- **Includes:**
  - 10,000 vectors
  - 256 dimensions
  - TLS encryption
  - REST API
- **Cost:** $0/month
- **Requires:** Email signup

### 5. Ollama (Local)
- **Service:** Local LLM inference
- **Plan:** Open source, free
- **Includes:**
  - Run locally on your machine
  - Or containerized on Render (if RAM allows)
  - Models: llama2, mistral, neural-chat, etc.
- **Cost:** $0/month
- **Note:** Requires GPU-capable machine or use CPU (slow)

---

## 🚀 DEPLOYMENT FLOW

### GitHub-Based CI/CD Pipeline

```
┌─────────────────┐
│  Git Push to    │
│  Feature Branch │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ GitHub Actions Trigger  │
│ • Dev workflow only     │
│ • No Prod access        │
└────────┬────────────────┘
         │
    ┌────┴──────┬───────────┬────────────┐
    │            │           │            │
    ▼            ▼           ▼            ▼
┌────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐
│ Build  │ │ Test     │ │ Lint    │ │ Security │
│ (npm)  │ │ (Jest)   │ │ (ESLint)│ │ (Snyk)   │
└────┬───┘ └────┬─────┘ └────┬────┘ └────┬─────┘
     │          │            │          │
     └──────────┴────────────┴──────────┘
              │
              ▼
    ┌──────────────────┐
    │ All Checks Pass? │
    └────────┬─────────┘
             │
        ┌────┴────┐
        │ Yes     │ No
        ▼         ▼
    ┌────────┐ ┌──────────┐
    │ Deploy │ │ Fail &   │
    │ to Dev │ │ Notify   │
    └────┬───┘ └──────────┘
         │
    ┌────┴──────┬──────────┬───────────┐
    │            │          │           │
    ▼            ▼          ▼           ▼
┌────────────┐┌────────┐┌──────────┐┌────────┐
│ Frontend   ││ Backend││ FastAPI  ││ Infra  │
│ to Vercel  ││ to     ││ to       ││ Update │
│            ││Render  ││ Render   ││        │
└────────┬───┘└────┬───┘└────┬─────┘└───┬────┘
         │         │         │          │
         └─────────┴─────────┴──────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ Dev Deployment  │
          │ Complete        │
          └─────────────────┘
```

---

## 📦 SERVICE BREAKDOWN

### Frontend (Vercel)
- **Repository:** `real-estate-ai-chatbot/frontend`
- **Build:** `npm run build`
- **Start:** `npm run start`
- **Environment:** Node.js 18+
- **Output:** `.next` folder

### Java Backend (Render)
- **Repository:** `real-estate-ai-chatbot/backend-java`
- **Build:** Maven (`mvn clean package`)
- **Run:** `java -jar target/app.jar`
- **Port:** 8080
- **Health:** `/actuator/health`

### FastAPI/RAG (Render)
- **Repository:** `real-estate-ai-chatbot/backend-ai`
- **Build:** Python requirements (`pip install -r requirements.txt`)
- **Run:** `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- **Port:** 8000
- **Health:** `/health`

### PostgreSQL (Managed)
- **Provider:** Render or Railway (free tier)
- **Database:** `crm_cbt_db_dev`
- **User:** `devuser`
- **Migrations:** Flyway (automatic)

### Redis (Upstash)
- **Type:** Serverless Redis
- **Endpoint:** Provided by Upstash
- **Protocol:** TLS (Redis CLI or REST API)

### Vector DB (Upstash Vector)
- **Type:** Serverless Vector Database
- **Endpoint:** Provided by Upstash
- **Protocol:** REST API + SDK

### Ollama (Local or Containerized)
- **Model:** llama2 (7B parameters)
- **Inference:** Via FastAPI integration
- **Note:** May need local GPU or use CPU (slow)

---

## 🔐 SECURITY & SSL

### SSL/TLS Configuration
- **Provider:** Automatic (Let's Encrypt via service providers)
- **Vercel:** Built-in SSL for Vercel domains
- **Render:** Built-in SSL for render.app domains
- **Custom Domains:** SSL provisioned via Let's Encrypt

### Environment Variables (Secrets)
- Stored in service provider's secret management
- NOT in `.env` files in repository
- Injected at runtime by CI/CD

### API Security
- JWT authentication enabled
- CORS configured
- Rate limiting via Redis
- Input validation on all endpoints

---

## 📊 COST ANALYSIS (Dev)

| Service | Free Tier | Cost/Month |
|---------|-----------|-----------|
| Vercel | Hobby | $0 |
| Render | Free | $0* |
| Upstash Redis | Free | $0 |
| Upstash Vector | Free | $0 |
| Ollama | Local/Free | $0 |
| **Total** | | **$0** |

*Render free tier has limitations (15-min spin down, limited RAM)
If more performance needed, upgrade to $7-12/month per service

---

## ✅ NEXT STEPS

1. **GitHub Setup**
   - Fork/ensure repo is on GitHub
   - Connect to Vercel, Render, Upstash

2. **Create Service Accounts**
   - Vercel: Sign up with GitHub
   - Render: Sign up with GitHub
   - Upstash: Sign up with email

3. **Configure Services**
   - Vercel: Connect frontend repo
   - Render: Connect backend repos
   - Upstash: Create Redis + Vector DB instances

4. **Set Environment Variables**
   - Frontend: API URLs
   - Backend: Database, Redis, LLM URLs
   - FastAPI: Vector DB, Ollama URLs

5. **Deploy**
   - Push to GitHub
   - GitHub Actions triggers deployment
   - Services deploy automatically

6. **Verify**
   - Health checks for all services
   - API integration tests
   - End-to-end flow testing

---

## 🚨 IMPORTANT NOTES

### Free-Tier Limitations
- Render free tier spins down after 15 minutes inactivity (cold start)
- Upstash free tier has daily API call limits
- Vercel free tier has build minute limits
- All are sufficient for Dev testing

### If Paid Services Needed
- Render paid: $12/month (Web Service) + $15/month (PostgreSQL)
- Upstash paid: Starts at $20/month
- Vercel paid: $20/month (Pro)
- I will ask before enabling paid services

### Placeholder Domains
- Currently using `.example.in` (placeholder)
- Replace with actual domain later
- Will need to buy actual `.in`, `.info`, or `.com` domain
- Domains typically cost $5-20/year
- DNS configuration required after domain purchase

### No Production Deployment
- This plan is **Dev environment only**
- QA, Stage, Production will be separate
- Each environment will have different URLs and databases
- Production deployment requires explicit approval

---

**This infrastructure plan is ready for implementation.**
**Proceed with service setup and deployment configuration files.**

