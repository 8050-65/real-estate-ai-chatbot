# ⚡ DEPLOY NOW - FAST TRACK (Minimal Steps)

**⏰ URGENCY:** Demo Today  
**Strategy:** Fastest possible deployment  
**Approach:** Create → Configure → Deploy → Verify

---

## 🔴 STEP 1: POSTGRESQL (5 minutes)

### Quick Steps:
1. Go: https://render.com/signup → Sign with GitHub (8050-65)
2. Click: **New + → PostgreSQL**
3. Fill:
   - Name: `crm-postgres-dev`
   - Database: `crm_cbt_db_dev`
   - User: `devuser`
   - Region: `Oregon`
   - Plan: `Free`
4. Click: **Create**
5. **WAIT** 2-3 minutes
6. Copy from dashboard:
   ```
   HOST=<copy this>
   PORT=5432
   DB=crm_cbt_db_dev
   USER=devuser
   PASSWORD=<copy this>
   ```

### Status Check:
```bash
# When ready, test:
psql "postgresql://devuser:PASSWORD@HOST:5432/crm_cbt_db_dev"
# Should connect (type: \q to exit)
```

✅ **When Done:** Reply with `POSTGRES_READY` and paste the HOST

---

## 🟠 STEP 2: REDIS (5 minutes)

### Quick Steps:
1. Go: https://upstash.com/signup → Email: vikramhuggi@gmail.com
2. Click: **Console → Create Database**
3. Fill:
   - Name: `cache-redis-dev`
   - Region: `us-east-1`
   - Type: `Redis`
   - Plan: `Free`
4. Click: **Create**
5. **WAIT** 1-2 minutes
6. Copy:
   ```
   REDIS_URL=<full URL from console>
   ```

✅ **When Done:** Reply with `REDIS_READY` and paste the URL

---

## 🟡 STEP 3: VECTOR DB (5 minutes)

### Quick Steps:
1. In Upstash Console (same tab)
2. Click: **Create Index**
3. Fill:
   - Name: `vector-db-dev`
   - Dimension: `1536`
   - Similarity: `Cosine`
   - Plan: `Free`
4. Click: **Create**
5. **WAIT** 1-2 minutes
6. Copy:
   ```
   VECTOR_URL=<API URL>
   VECTOR_TOKEN=<Token>
   ```

✅ **When Done:** Reply with `VECTOR_READY` and paste both

---

## 🟢 STEP 4: JAVA BACKEND (15 minutes)

### Quick Steps:
1. Go: https://render.com → **New + → Web Service**
2. Select: `https://github.com/8050-65/real-estate-ai-chatbot`
3. Fill:
   - Name: `real-estate-api-dev`
   - Environment: `Docker`
   - Region: `Oregon`
   - Plan: `Free`
   - Branch: `develop`
4. Click: **Advanced** and paste (replace YOUR_VALUES):

```
SPRING_PROFILES_ACTIVE=dev
SPRING_DATASOURCE_URL=jdbc:postgresql://YOUR_POSTGRES_HOST:5432/crm_cbt_db_dev
SPRING_DATASOURCE_USERNAME=devuser
SPRING_DATASOURCE_PASSWORD=YOUR_POSTGRES_PASSWORD
SPRING_REDIS_HOST=YOUR_REDIS_HOST_ONLY
SPRING_REDIS_PORT=YOUR_REDIS_PORT_ONLY
SPRING_REDIS_PASSWORD=YOUR_REDIS_PASSWORD_ONLY
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
JWT_SECRET=dev-secret-key-12345-change-in-prod
LEADRAT_API_KEY=api-key-Zjg2N2JiNjItODBmOC00YzBjLTlkMmMtMjk5OGRiZjBmMDU3OmR1YmFpdDEx
LEADRAT_TENANT=dubaitt11
RAG_SERVICE_URL=https://dev-rag.example.in
CORS_ALLOWED_ORIGINS=https://dev-chatbot.example.in,https://dev-api.example.in
SERVER_PORT=8080
```

5. Click: **Deploy**
6. **WAIT** 10-15 minutes (first build is slow)
7. When done, copy:
   ```
   JAVA_API_URL=https://real-estate-api-dev.onrender.com
   SERVICE_ID=<from URL or dashboard>
   ```

### Verify:
```bash
# When URL appears, test:
curl https://real-estate-api-dev.onrender.com/actuator/health
# Should return: {"status":"UP"}
```

✅ **When Done:** Reply with `JAVA_READY` and paste the URL

---

## 🔵 STEP 5: FASTAPI BACKEND (15 minutes)

### Quick Steps:
1. Go: https://render.com → **New + → Web Service**
2. Same repo: `https://github.com/8050-65/real-estate-ai-chatbot`
3. Fill:
   - Name: `real-estate-rag-dev`
   - Environment: `Docker`
   - Region: `Oregon`
   - Plan: `Free`
   - Branch: `develop`
4. Click: **Advanced** and paste:

```
ENVIRONMENT=development
PYTHONUNBUFFERED=1
OLLAMA_HOST=http://localhost:11434
REDIS_URL=YOUR_UPSTASH_REDIS_URL
VECTOR_DB_URL=YOUR_UPSTASH_VECTOR_URL
VECTOR_DB_TOKEN=YOUR_UPSTASH_VECTOR_TOKEN
LOG_LEVEL=INFO
CORS_ORIGINS=https://dev-chatbot.example.in,https://dev-api.example.in
```

5. Click: **Deploy**
6. **WAIT** 10-15 minutes
7. When done, copy:
   ```
   FASTAPI_URL=https://real-estate-rag-dev.onrender.com
   ```

### Verify:
```bash
curl https://real-estate-rag-dev.onrender.com/health
# Should return: {"status":"healthy"}
```

✅ **When Done:** Reply with `FASTAPI_READY` and paste the URL

---

## 🟣 STEP 6: FRONTEND (10 minutes)

### Quick Steps:
1. Go: https://vercel.com/signup → Sign with GitHub (8050-65)
2. Click: **Add New → Project**
3. Select: `real-estate-ai-chatbot` repo
4. Set Root: `./frontend`
5. Environment vars (click **Environment Variables**):

```
NEXT_PUBLIC_API_URL=https://real-estate-api-dev.onrender.com
NEXT_PUBLIC_RAG_URL=https://real-estate-rag-dev.onrender.com
NEXT_PUBLIC_APP_NAME=RealEstate AI CRM - Dev
NEXT_PUBLIC_ENVIRONMENT=development
```

6. Click: **Deploy**
7. **WAIT** 2-3 minutes
8. Copy:
   ```
   FRONTEND_URL=https://real-estate-chatbot-dev.vercel.app
   ```

### Verify:
```bash
curl https://real-estate-chatbot-dev.vercel.app
# Should return HTML page
```

✅ **When Done:** Reply with `FRONTEND_READY` and paste the URL

---

## 🟠 STEP 7: GITHUB SECRETS (5 minutes)

### Quick Steps:
1. Go: https://github.com/8050-65/real-estate-ai-chatbot
2. **Settings → Secrets and variables → Actions**
3. Click: **New repository secret**
4. Add these (get tokens from services above):

```
VERCEL_TOKEN=<from vercel.com/account/tokens>
VERCEL_ORG_ID=<from Vercel account>
VERCEL_PROJECT_ID_FRONTEND=<from Vercel project>

RENDER_API_KEY=<from render.com/account>
RENDER_SERVICE_ID_JAVA=real-estate-api-dev
RENDER_SERVICE_ID_AI=real-estate-rag-dev

UPSTASH_REDIS_URL=<from Upstash>
UPSTASH_VECTOR_URL=<from Upstash>
UPSTASH_VECTOR_TOKEN=<from Upstash>

LEADRAT_API_KEY=api-key-Zjg2N2JiNjItODBmOC00YzBjLTlkMmMtMjk5OGRiZjBmMDU3OmR1YmFpdDEx
JWT_SECRET=dev-secret-key-12345-change-in-prod
```

5. Push test commit:
```bash
git commit --allow-empty -m "Trigger CI/CD"
git push origin develop
```

6. Check: **Actions tab** → Watch workflow

✅ **When Done:** Reply with `CI_CD_READY`

---

## 🔴 STEP 8: VERIFY & TEST (10 minutes)

### Frontend Test:
```bash
# 1. Open in browser
https://real-estate-chatbot-dev.vercel.app

# 2. Check:
✅ Page loads
✅ No console errors (F12)
✅ Dark theme visible
✅ No 404 errors
```

### API Test:
```bash
# Java API
curl https://real-estate-api-dev.onrender.com/actuator/health
# Expected: {"status":"UP"}

# FastAPI
curl https://real-estate-rag-dev.onrender.com/health
# Expected: {"status":"healthy"}
```

### Login Test:
```
1. Frontend: https://real-estate-chatbot-dev.vercel.app
2. Email: admin@crm-cbt.com
3. Password: Admin@123!
4. Should login successfully
```

### Feature Test:
- [ ] Search for lead (will use demo data)
- [ ] Send AI message
- [ ] Change language to Hindi
- [ ] Try schedule appointment

✅ **When Done:** Reply with test results

---

## 📊 FINAL URLs FOR DEMO

```
Frontend:   https://real-estate-chatbot-dev.vercel.app
Java API:   https://real-estate-api-dev.onrender.com
FastAPI:    https://real-estate-rag-dev.onrender.com

Health Checks:
  Java:     https://real-estate-api-dev.onrender.com/actuator/health
  FastAPI:  https://real-estate-rag-dev.onrender.com/health
```

---

## 🎯 REPORT PROGRESS

**As you complete each step, reply with:**

```
✅ POSTGRES_READY
   HOST=<value>

✅ REDIS_READY
   URL=<value>

✅ VECTOR_READY
   URL=<value>
   TOKEN=<value>

✅ JAVA_READY
   URL=https://real-estate-api-dev.onrender.com

✅ FASTAPI_READY
   URL=https://real-estate-rag-dev.onrender.com

✅ FRONTEND_READY
   URL=https://real-estate-chatbot-dev.vercel.app

✅ CI_CD_READY
   Workflow passing

✅ TESTING_COMPLETE
   Login: ✅
   AI Chat: ✅
   Multilingual: ✅
   No localhost URLs: ✅
   LeadRat CRM unaffected: ✅
```

---

## ⚡ START NOW

**Step 1:** Open this file in browser-friendly format  
**Step 2:** Start with PostgreSQL (Step 1 above)  
**Step 3:** Report back with each status  
**Timeline:** 55-80 minutes total  

**Begin deploying now. I'll monitor and help.** 🚀

