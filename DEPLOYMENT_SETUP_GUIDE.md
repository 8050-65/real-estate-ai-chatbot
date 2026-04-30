# 🚀 DEV ENVIRONMENT DEPLOYMENT SETUP GUIDE
**Environment:** Development Only  
**Target URLs:** `*.example.in` (placeholder)  
**Services:** Vercel, Render, Upstash, GitHub Actions  
**Status:** Setup Instructions (Step-by-step)

---

## 📋 PRE-DEPLOYMENT CHECKLIST

Before starting, ensure you have:

- [ ] GitHub repository set up (public or private)
- [ ] GitHub account with access
- [ ] Credit card for optional paid upgrades (NOT required for free tiers)
- [ ] Email address for service registrations
- [ ] Leadrat API credentials
- [ ] 30-60 minutes for complete setup

---

## 🔧 STEP 1: SET UP VERSION CONTROL (GitHub)

### 1.1 Push Repository to GitHub

```bash
# Initialize git (if not done)
cd real-estate-ai-chatbot
git init

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/real-estate-ai-chatbot.git

# Create develop branch (for dev deployments)
git checkout -b develop

# Push to GitHub
git push -u origin develop
```

### 1.2 Create Branch Protection Rules (optional but recommended)

In GitHub repository settings:
- Go to **Settings → Branches**
- Add rule for `main` branch:
  - Require pull request reviews
  - Require status checks to pass
  - Include administrators
- This prevents accidental production deployment

---

## 🌐 STEP 2: SET UP VERCEL (Frontend)

### 2.1 Create Vercel Account

1. Go to **https://vercel.com**
2. Click **Sign Up**
3. Select **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account
5. Accept terms and complete setup

### 2.2 Import Project to Vercel

1. In Vercel dashboard, click **Add New... → Project**
2. Select your GitHub repository (`real-estate-ai-chatbot`)
3. Select **Next.js** as the framework
4. Configure project:
   - **Project Name:** `real-estate-ai-chatbot-frontend-dev`
   - **Root Directory:** `./frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

### 2.3 Add Environment Variables

In Vercel project settings → **Environment Variables**:

```
NEXT_PUBLIC_API_URL = https://dev-api.example.in
NEXT_PUBLIC_RAG_URL = https://dev-rag.example.in
NEXT_PUBLIC_APP_NAME = RealEstate AI CRM - Dev
NEXT_PUBLIC_ENVIRONMENT = development
```

### 2.4 Deploy

1. Click **Deploy**
2. Wait for build and deployment to complete (2-3 minutes)
3. You'll get a Vercel URL (like `https://real-estate-ai-chatbot-frontend-dev.vercel.app`)
4. **This is your Frontend URL for now** (before custom domain)

### 2.5 Configure Custom Domain (Optional, requires domain)

When you have `dev-chatbot.example.in`:
1. Go to **Settings → Domains**
2. Add domain: `dev-chatbot.example.in`
3. Vercel will show DNS records to add

---

## 🎯 STEP 3: SET UP RENDER (Backend APIs)

### 3.1 Create Render Account

1. Go to **https://render.com**
2. Click **Get Started**
3. Select **"Sign up with GitHub"**
4. Authorize and complete setup

### 3.2 Create PostgreSQL Database

1. In Render dashboard, click **New + → PostgreSQL**
2. Configure:
   - **Name:** `crm-postgres-dev`
   - **Database:** `crm_cbt_db_dev`
   - **User:** `devuser`
   - **Region:** Oregon (free tier region)
   - **Postgres Version:** 15
   - **Plan:** Free
3. Click **Create Database**
4. Wait for database to be ready (2-3 minutes)
5. Copy connection string (you'll need this for backend)

### 3.3 Deploy Java Backend

1. Click **New + → Web Service**
2. Select your GitHub repository
3. Configure:
   - **Name:** `real-estate-api-dev`
   - **Environment:** Docker
   - **Region:** Oregon
   - **Plan:** Free
   - **Branch:** `develop`
4. Click **Advanced** and add environment variables:

```
SPRING_PROFILES_ACTIVE=dev
SPRING_DATASOURCE_URL=<DATABASE_URL_FROM_STEP_3.2>
SPRING_DATASOURCE_USERNAME=devuser
SPRING_DATASOURCE_PASSWORD=<DATABASE_PASSWORD>
SPRING_REDIS_HOST=<REDIS_HOST_FROM_UPSTASH>
SPRING_REDIS_PORT=<REDIS_PORT>
SPRING_REDIS_PASSWORD=<REDIS_PASSWORD>
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
SERVER_PORT=8080
JWT_SECRET=<GENERATE_SECURE_KEY>
LEADRAT_API_KEY=<YOUR_LEADRAT_API_KEY>
LEADRAT_TENANT=dubaitt11
RAG_SERVICE_URL=https://dev-rag.example.in
CORS_ALLOWED_ORIGINS=https://dev-chatbot.example.in,https://dev-api.example.in
```

5. Click **Deploy**
6. Wait for deployment (5-10 minutes for first build)
7. You'll get a Render URL (like `https://real-estate-api-dev.onrender.com`)

### 3.4 Deploy FastAPI/RAG Backend

Repeat Step 3.3 but:
- **Name:** `real-estate-rag-dev`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- Environment variables:
  - `ENVIRONMENT=development`
  - `OLLAMA_HOST=<YOUR_OLLAMA_URL>`
  - `REDIS_URL=<FROM_UPSTASH>`
  - `VECTOR_DB_URL=<FROM_UPSTASH_VECTOR>`
  - `VECTOR_DB_TOKEN=<FROM_UPSTASH>`

---

## 💾 STEP 4: SET UP UPSTASH (Redis + Vector DB)

### 4.1 Create Upstash Account

1. Go to **https://upstash.com**
2. Click **Sign Up**
3. Use email or GitHub sign-in
4. Complete registration

### 4.2 Create Redis Database

1. Go to **Console → Create Database**
2. Configure:
   - **Name:** `cache-redis-dev`
   - **Region:** US-East-1 (closest to Oregon)
   - **Type:** Redis
   - **Plan:** Free
3. Click **Create**
4. Copy:
   - **Redis URL** (for environment variable)
   - **Host, Port, Password** (alternative format)

Example environment variables:
```
REDIS_URL=redis://:PASSWORD@host:port
# or
REDIS_HOST=host
REDIS_PORT=port
REDIS_PASSWORD=password
```

### 4.3 Create Vector Database

1. In Upstash console, click **Create Index**
2. Configure:
   - **Name:** `vector-db-dev`
   - **Dimension:** 1536 (for OpenAI embeddings)
   - **Similarity Metric:** Cosine
   - **Plan:** Free
3. Click **Create**
4. Copy:
   - **API URL**
   - **Token**

Example environment variables:
```
UPSTASH_VECTOR_URL=https://...
UPSTASH_VECTOR_TOKEN=token
```

---

## 🔑 STEP 5: CONFIGURE SECRETS IN GITHUB

### 5.1 Add Deployment Secrets

Go to **GitHub Repository → Settings → Secrets and Variables → Actions**

Add these secrets:

```
# Vercel
VERCEL_TOKEN=<generate from Vercel Settings>
VERCEL_ORG_ID=<from Vercel Settings>
VERCEL_PROJECT_ID_FRONTEND=<from Vercel project settings>

# Render
RENDER_API_KEY=<generate from Render account settings>
RENDER_SERVICE_ID_JAVA=<from Render service page>
RENDER_SERVICE_ID_AI=<from Render service page>

# Upstash
UPSTASH_REDIS_URL=<from Upstash console>
UPSTASH_VECTOR_URL=<from Upstash console>
UPSTASH_VECTOR_TOKEN=<from Upstash console>

# Leadrat
LEADRAT_API_KEY=<your actual API key>

# Slack (optional)
SLACK_WEBHOOK_URL=<if you want deployment notifications>
```

### 5.2 How to Generate Tokens

**Vercel Token:**
- Go to **https://vercel.com/account/tokens**
- Click **Create Token**
- Name: `github-actions`
- Scope: Full Account
- Copy token

**Render API Key:**
- Go to **Render Dashboard → Account**
- Scroll to **API Keys**
- Click **Create Key**
- Copy key

---

## 🧪 STEP 6: TEST DEPLOYMENT

### 6.1 Trigger GitHub Actions

1. Make a small change to `develop` branch:
```bash
git commit --allow-empty -m "Trigger CI/CD pipeline"
git push origin develop
```

2. Go to **GitHub Repository → Actions**
3. Watch the `Deploy to Dev Environment` workflow
4. Check progress of:
   - Security checks
   - Frontend build
   - Backend builds
   - Docker builds
   - Deployment to services

### 6.2 Verify Services

Once deployment completes:

**Frontend:**
```bash
curl https://dev-chatbot.example.in
# Should return HTML page
```

**Java API:**
```bash
curl https://dev-api.example.in/actuator/health
# Should return {"status":"UP"}
```

**FastAPI:**
```bash
curl https://dev-rag.example.in/health
# Should return {"status":"healthy"}
```

### 6.3 Test Full Flow

1. Open **https://dev-chatbot.example.in** in browser
2. Try to login with admin credentials
3. Test lead search, AI chat, scheduling
4. Verify data flows between frontend → API → FastAPI

---

## 🌍 STEP 7: CONFIGURE CUSTOM DOMAINS (Optional)

### 7.1 Purchase Domain

When ready, purchase domain from registrar:
- **Example:** Namecheap, GoDaddy, Bluehost
- **For Dev:** Buy `example.in` domain
- **Cost:** Usually $5-20/year

### 7.2 Point DNS to Services

In your domain registrar's DNS settings, add:

```
Record Type    Name              Value
────────────────────────────────────────────────────────────
CNAME          dev-chatbot      cname.vercel-dns.com
CNAME          dev-api          real-estate-api-dev.onrender.com
CNAME          dev-rag          real-estate-rag-dev.onrender.com
CNAME          dev-docs         docs-dev.onrender.com
TXT            _acme-challenge  (auto-populated for SSL)
```

### 7.3 Update Service Configurations

In each service (Vercel, Render):
- Add custom domain in settings
- Verify DNS records
- SSL certificates auto-provisioned

---

## 📊 STEP 8: HEALTH CHECKS & MONITORING

### 8.1 Health Check Endpoints

```bash
# Frontend
curl https://dev-chatbot.example.in

# Java API
curl https://dev-api.example.in/actuator/health
curl https://dev-api.example.in/actuator/health/db
curl https://dev-api.example.in/actuator/metrics

# FastAPI
curl https://dev-rag.example.in/health
curl https://dev-rag.example.in/docs

# Database
# Via pgAdmin UI
https://dev-docs.example.in/admin

# Redis
# Via Upstash console
https://console.upstash.com
```

### 8.2 Monitor Logs

**Vercel Logs:**
- Vercel dashboard → Deployments → Logs

**Render Logs:**
- Render dashboard → Service → Logs

**GitHub Actions:**
- GitHub → Actions → Workflow runs → View logs

---

## 🆘 TROUBLESHOOTING

### Issue: Deployment fails in GitHub Actions

**Solution:**
1. Check GitHub Actions logs
2. Verify environment variables are set correctly
3. Ensure all secrets are configured
4. Check service-specific logs (Vercel, Render)

### Issue: 503 Service Unavailable

**Likely Cause:** Render free tier service spun down after 15 min inactivity

**Solution:**
1. Wait 1-2 minutes for service to wake up
2. Make a request to the service
3. Or upgrade to paid plan for always-on service

### Issue: API calls failing from frontend

**Check:**
1. API URLs in frontend environment variables
2. CORS configuration on backend
3. Database connection in backend logs
4. Network requests in browser console (F12 → Network)

### Issue: RAG/Vector DB not working

**Check:**
1. Upstash Vector DB credentials
2. Vector DB endpoint in FastAPI
3. Ollama service is running
4. FastAPI logs for errors

---

## 🎯 FINAL CHECKLIST

After completing all steps:

- [ ] GitHub repository configured
- [ ] Vercel frontend deployed
- [ ] Render Java backend deployed
- [ ] Render FastAPI backend deployed
- [ ] Upstash Redis configured
- [ ] Upstash Vector DB configured
- [ ] All secrets configured in GitHub
- [ ] GitHub Actions workflow tested
- [ ] All services returning healthy status
- [ ] End-to-end flow tested (login → search → chat)
- [ ] Custom domain configured (if purchased)
- [ ] SSL certificates verified
- [ ] Database backups configured
- [ ] Monitoring/alerts configured
- [ ] Team has access to all dashboards

---

## 📝 NOTES

- **Development:** `*.example.in` (placeholder)
- **QA:** `*.example.info` (when ready, separate deployment)
- **Production:** `*.example.com` (when ready, separate deployment)

- **No Production URLs** in dev workflow
- **No Paid Services** activated without approval
- **Free Tiers Only** for initial setup

---

## 🚀 NEXT STEPS AFTER DEPLOYMENT

1. **Test Thoroughly**
   - Run all manual flows
   - Test edge cases
   - Check error handling

2. **Gather Feedback**
   - Demo to stakeholders
   - Collect issues/improvements
   - Document findings

3. **Plan QA Deployment**
   - Create QA environment with separate database
   - Use `.example.info` domain
   - Follow same deployment process

4. **Plan Production Deployment**
   - Use `.example.com` domain
   - Stricter security settings
   - Production-grade resources

---

**Deployment setup guide complete. Ready for implementation!**

