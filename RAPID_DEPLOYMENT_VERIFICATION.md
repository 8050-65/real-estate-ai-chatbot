# 🚀 RAPID DEV DEPLOYMENT VERIFICATION
**Status:** URGENT - Fast Track Deployment  
**Target:** Demo Readiness  
**Timeline:** 55 minutes estimated  
**Dev URLs:** `*.example.in` (placeholder)

---

## ⚡ DEPLOYMENT ORDER (MANDATORY)

```
1️⃣  PostgreSQL (Render)         ← Database foundation
2️⃣  Redis (Upstash)             ← Cache layer
3️⃣  Vector DB (Upstash)         ← RAG foundation
4️⃣  Java Backend (Render)       ← Main API
5️⃣  FastAPI/RAG (Render)        ← AI Service
6️⃣  Frontend (Vercel)           ← UI layer
7️⃣  CI/CD Verification          ← Automation
8️⃣  End-to-End Testing          ← Final validation
```

---

## STEP 1️⃣: POSTGRESQL DATABASE (5 minutes)

### 1.1 Create Render Account & Database

1. Go to: **https://render.com/signup**
2. Click **"Sign up with GitHub"**
3. Authorize and complete setup
4. Click **"New +" → "PostgreSQL"**
5. Configure:
   ```
   Name:               crm-postgres-dev
   Database:           crm_cbt_db_dev
   User:               devuser
   Region:             Oregon (free tier)
   Plan:               Free
   ```
6. Click **"Create Database"**
7. Wait 2-3 minutes for creation
8. Copy and save these values:
   ```
   DATABASE_HOST=<HOST>
   DATABASE_PORT=5432
   DATABASE_NAME=crm_cbt_db_dev
   DATABASE_USER=devuser
   DATABASE_PASSWORD=<PASSWORD>
   ```

### 1.2 Verify Database

```bash
# Test connection
psql "postgresql://devuser:<PASSWORD>@<HOST>:5432/crm_cbt_db_dev"

# Should connect successfully
# Type: \q to exit
```

✅ **Status:** Database deployed
📊 **Public:** No (internal only)
⏱️ **Time Elapsed:** 5 minutes

---

## STEP 2️⃣: REDIS CACHE - UPSTASH (5 minutes)

### 2.1 Create Upstash Redis

1. Go to: **https://upstash.com/signup**
2. Sign up with email: `vikramhuggi@gmail.com`
3. Go to **Console → Create Database**
4. Configure:
   ```
   Name:               cache-redis-dev
   Region:             US-East-1 (closest to Oregon)
   Type:               Redis
   Plan:               Free
   ```
5. Click **"Create"**
6. Wait for creation (1-2 minutes)
7. Copy connection details:
   ```
   REDIS_URL=redis://:PASSWORD@HOST:PORT
   # Or separate:
   REDIS_HOST=<HOST>
   REDIS_PORT=<PORT>
   REDIS_PASSWORD=<PASSWORD>
   ```

### 2.2 Verify Redis

```bash
# Test connection via REST API
curl -X GET "https://<UPSTASH_URL>/get/test" \
  -H "Authorization: Bearer <TOKEN>"

# Should respond with JSON
```

✅ **Status:** Redis deployed
📊 **Public:** Serverless (Upstash)
⏱️ **Time Elapsed:** 10 minutes

---

## STEP 3️⃣: VECTOR DATABASE - UPSTASH VECTOR (5 minutes)

### 3.1 Create Upstash Vector DB

1. In Upstash console, go to **Console → Create Index**
2. Configure:
   ```
   Name:               vector-db-dev
   Dimension:          1536 (for embeddings)
   Similarity Metric:  Cosine
   Plan:               Free
   ```
3. Click **"Create"**
4. Copy connection details:
   ```
   VECTOR_DB_URL=<UPSTASH_URL>
   VECTOR_DB_TOKEN=<TOKEN>
   ```

### 3.2 Verify Vector DB

```bash
# Test connection
curl -X POST "<VECTOR_DB_URL>/info" \
  -H "Authorization: Bearer <TOKEN>"

# Should return index information
```

✅ **Status:** Vector DB deployed
📊 **Public:** Serverless (Upstash)
⏱️ **Time Elapsed:** 15 minutes

---

## STEP 4️⃣: JAVA BACKEND - RENDER (15 minutes)

### 4.1 Create Render API Key

1. In Render dashboard, go to **Account Settings**
2. Scroll to **API Keys**
3. Click **"Create Key"**
4. Copy and save: `RENDER_API_KEY=<KEY>`

### 4.2 Deploy Java Backend

1. In Render, click **"New +" → "Web Service"**
2. Connect your GitHub repository:
   ```
   URL: https://github.com/8050-65/real-estate-ai-chatbot
   ```
3. Authorize and select repository
4. Configure:
   ```
   Name:               real-estate-api-dev
   Environment:        Docker
   Region:             Oregon
   Plan:               Free
   Branch:             develop
   ```
5. Click **"Advanced"** and add environment variables:
   ```
   SPRING_PROFILES_ACTIVE=dev
   SPRING_DATASOURCE_URL=jdbc:postgresql://HOST:5432/crm_cbt_db_dev
   SPRING_DATASOURCE_USERNAME=devuser
   SPRING_DATASOURCE_PASSWORD=<DB_PASSWORD>
   SPRING_REDIS_HOST=<REDIS_HOST>
   SPRING_REDIS_PORT=<REDIS_PORT>
   SPRING_REDIS_PASSWORD=<REDIS_PASSWORD>
   JWT_SECRET=<GENERATED_JWT>
   LEADRAT_API_KEY=api-key-Zjg2N2JiNjItODBmOC00YzBjLTlkMmMtMjk5OGRiZjBmMDU3OmR1YmFpdDEx
   LEADRAT_TENANT=dubaitt11
   RAG_SERVICE_URL=https://dev-rag.example.in
   CORS_ALLOWED_ORIGINS=https://dev-chatbot.example.in,https://dev-api.example.in
   SERVER_PORT=8080
   ```
6. Click **"Deploy"**
7. Wait 5-10 minutes for build and deployment
8. Copy service ID from URL: `https://dashboard.render.com/srv/<SERVICE_ID>`
9. Copy public URL: `https://real-estate-api-dev.onrender.com`

### 4.3 Verify Java Backend

```bash
# Check health
curl https://real-estate-api-dev.onrender.com/actuator/health

# Expected response:
# {"status":"UP","components":{"db":{"status":"UP"}}}
```

✅ **Status:** Java Backend deployed
📊 **Public URL:** https://real-estate-api-dev.onrender.com
⏱️ **Time Elapsed:** 30 minutes

---

## STEP 5️⃣: FASTAPI/RAG - RENDER (15 minutes)

### 5.1 Deploy FastAPI Backend

1. In Render, click **"New +" → "Web Service"**
2. Select same GitHub repository
3. Configure:
   ```
   Name:               real-estate-rag-dev
   Environment:        Docker
   Region:             Oregon
   Plan:               Free
   Branch:             develop
   ```
4. Click **"Advanced"** and add environment variables:
   ```
   ENVIRONMENT=development
   PYTHONUNBUFFERED=1
   OLLAMA_HOST=<YOUR_OLLAMA_URL_OR_LOCAL>
   REDIS_URL=redis://:PASSWORD@HOST:PORT
   VECTOR_DB_URL=<UPSTASH_VECTOR_URL>
   VECTOR_DB_TOKEN=<UPSTASH_VECTOR_TOKEN>
   LOG_LEVEL=INFO
   CORS_ORIGINS=https://dev-chatbot.example.in,https://dev-api.example.in
   ```
5. Click **"Deploy"**
6. Wait 5-10 minutes for build and deployment
7. Copy service ID and public URL

### 5.2 Verify FastAPI

```bash
# Check health
curl https://real-estate-rag-dev.onrender.com/health

# Expected response:
# {"status":"healthy","service":"realestate-ai-service"}
```

✅ **Status:** FastAPI Backend deployed
📊 **Public URL:** https://real-estate-rag-dev.onrender.com
⏱️ **Time Elapsed:** 45 minutes

---

## STEP 6️⃣: FRONTEND - VERCEL (10 minutes)

### 6.1 Create Vercel Account & Token

1. Go to: **https://vercel.com/signup**
2. Click **"Sign up with GitHub"**
3. Authorize and complete setup
4. Go to **Settings → Tokens**
5. Click **"Create Token"**
6. Copy and save: `VERCEL_TOKEN=<TOKEN>`
7. Go to **Account Settings** and copy: `VERCEL_ORG_ID=<ORG_ID>`

### 6.2 Import Frontend Project

1. In Vercel dashboard, click **"Add New..." → "Project"**
2. Select your GitHub repository: `real-estate-ai-chatbot`
3. Select root directory: `./frontend`
4. Configure:
   ```
   Framework:          Next.js
   Build Command:      npm run build
   Output Directory:   .next
   ```
5. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://real-estate-api-dev.onrender.com
   NEXT_PUBLIC_RAG_URL=https://real-estate-rag-dev.onrender.com
   NEXT_PUBLIC_APP_NAME=RealEstate AI CRM - Dev
   NEXT_PUBLIC_ENVIRONMENT=development
   ```
6. Click **"Deploy"**
7. Wait 2-3 minutes for build and deployment
8. Copy project ID and Vercel URL

### 6.3 Verify Frontend

```bash
# Check frontend loads
curl https://real-estate-chatbot-dev.vercel.app

# Should return HTML with "RealEstate AI CRM" title
```

✅ **Status:** Frontend deployed
📊 **Public URL:** https://real-estate-chatbot-dev.vercel.app
⏱️ **Time Elapsed:** 55 minutes

---

## STEP 7️⃣: GITHUB SECRETS & CI/CD (10 minutes)

### 7.1 Add GitHub Secrets

Go to: **GitHub → Repository → Settings → Secrets and variables → Actions**

Add all these secrets (copy from deployment):

```
VERCEL_TOKEN=<from Vercel>
VERCEL_ORG_ID=<from Vercel>
VERCEL_PROJECT_ID_FRONTEND=<from Vercel project>

RENDER_API_KEY=<from Render>
RENDER_SERVICE_ID_JAVA=<from Render service>
RENDER_SERVICE_ID_AI=<from Render service>

UPSTASH_REDIS_URL=<from Upstash>
UPSTASH_VECTOR_URL=<from Upstash>
UPSTASH_VECTOR_TOKEN=<from Upstash>

LEADRAT_API_KEY=api-key-Zjg2N2JiNjItODBmOC00YzBjLTlkMmMtMjk5OGRiZjBmMDU3OmR1YmFpdDEx
JWT_SECRET=<generated value>
```

### 7.2 Verify GitHub Actions

1. Push test commit to `develop` branch:
   ```bash
   git commit --allow-empty -m "Test CI/CD pipeline"
   git push origin develop
   ```

2. Go to **GitHub → Actions**
3. Watch `Deploy to Dev Environment` workflow
4. Verify all steps pass:
   - [ ] Security checks
   - [ ] Frontend build
   - [ ] Backend builds
   - [ ] Docker builds
   - [ ] Deployments
   - [ ] Health checks

✅ **Status:** CI/CD configured
📊 **Workflow:** Automated deploy on develop push
⏱️ **Time Elapsed:** 65 minutes

---

## STEP 8️⃣: END-TO-END TESTING (15 minutes)

### 8.1 Test Frontend

```bash
# 1. Frontend loads
curl https://real-estate-chatbot-dev.vercel.app
# Should return HTML with title

# 2. Open in browser
https://real-estate-chatbot-dev.vercel.app

# Verify:
✅ Page loads
✅ No console errors (F12 → Console)
✅ Dark theme applied
✅ No 404 errors
✅ No CORS errors
```

### 8.2 Test Backend APIs

```bash
# Java API health
curl https://real-estate-api-dev.onrender.com/actuator/health
# Expected: {"status":"UP"}

# Database health
curl https://real-estate-api-dev.onrender.com/actuator/health/db
# Expected: {"status":"UP"}

# FastAPI health
curl https://real-estate-rag-dev.onrender.com/health
# Expected: {"status":"healthy"}
```

### 8.3 Test Login Flow

1. Open: `https://real-estate-chatbot-dev.vercel.app`
2. Try login:
   ```
   Email: admin@crm-cbt.com
   Password: Admin@123!
   ```
3. Verify:
   - [ ] Login successful
   - [ ] Redirects to dashboard
   - [ ] No errors

### 8.4 Test Main Features

- [ ] **Lead Search** - Search for leads
- [ ] **AI Chat** - Ask "Tell me about properties"
- [ ] **Multilingual** - Change language to Hindi
- [ ] **Scheduling** - Try to schedule appointment
- [ ] **Database** - Create new lead
- [ ] **RAG** - Chat responds with context

✅ **Status:** All flows tested
📊 **Demo Ready:** YES
⏱️ **Total Time:** 80 minutes

---

## 📊 FINAL DEPLOYED URLS

```
Frontend:   https://real-estate-chatbot-dev.vercel.app
Java API:   https://real-estate-api-dev.onrender.com
FastAPI:    https://real-estate-rag-dev.onrender.com

Health Endpoints:
  Java:     https://real-estate-api-dev.onrender.com/actuator/health
  FastAPI:  https://real-estate-rag-dev.onrender.com/health

Environment Variables Updated:
  NEXT_PUBLIC_API_URL=https://real-estate-api-dev.onrender.com
  NEXT_PUBLIC_RAG_URL=https://real-estate-rag-dev.onrender.com
```

---

## ✅ DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] GitHub repository accessible
- [ ] Leadrat API key ready
- [ ] Email for service accounts
- [ ] 55-80 minutes available

### Services
- [ ] PostgreSQL deployed
- [ ] Redis deployed
- [ ] Vector DB deployed
- [ ] Java Backend deployed
- [ ] FastAPI deployed
- [ ] Frontend deployed

### Verification
- [ ] All health endpoints responding (200 OK)
- [ ] Database connected
- [ ] Redis cache working
- [ ] Login flow works
- [ ] AI chat works
- [ ] Multilingual support works
- [ ] SSL/HTTPS verified
- [ ] No localhost URLs
- [ ] No errors in logs

### Final Verification
- [ ] Frontend loads
- [ ] No console errors
- [ ] API responding
- [ ] FastAPI responding
- [ ] Database healthy
- [ ] End-to-end flows work
- [ ] Demo ready

---

## 🚨 TROUBLESHOOTING

### Service Takes Long Time
- Free tier Render services may take 10-15 minutes first deployment
- Coffee break ☕ normal behavior
- Check logs in service dashboard

### 503 Service Unavailable
- Free tier Render spins down after 15 minutes inactivity
- Wait 1-2 minutes, service will wake up
- Make another request

### Database Connection Error
- Verify PostgreSQL is healthy in Render dashboard
- Check credentials match exactly
- Verify network allows connection

### API Not Responding
- Check Render logs for deployment errors
- Verify all environment variables set
- Check database is healthy

### Frontend CORS Errors
- Verify CORS_ALLOWED_ORIGINS in Java backend
- Verify API URLs in frontend env vars
- Restart services if needed

---

## 📝 DEPLOYMENT RECORD

```
Deployment Date:        [DATE]
Deployed By:           vikramhuggi@gmail.com
GitHub Repo:           https://github.com/8050-65/real-estate-ai-chatbot
Branch:                develop

Services Deployed:
  ✅ PostgreSQL (Render)
  ✅ Redis (Upstash)
  ✅ Vector DB (Upstash Vector)
  ✅ Java Backend (Render)
  ✅ FastAPI Backend (Render)
  ✅ Frontend (Vercel)

Public URLs:
  Frontend:   https://real-estate-chatbot-dev.vercel.app
  API:        https://real-estate-api-dev.onrender.com
  FastAPI:    https://real-estate-rag-dev.onrender.com

Health Status:
  All: ✅ PASSING

Demo Ready: ✅ YES
```

---

**Follow this checklist step by step. Should take 55-80 minutes for complete deployment.**

**Once all ✅ steps complete, Dev environment is ready for demo!**

