# ✅ DEV ENVIRONMENT DEPLOYMENT CHECKLIST

**Environment:** Development Only  
**Placeholder Domain:** `*.example.in`  
**Services:** Vercel, Render, Upstash  
**Timeline:** 2-3 hours for complete setup

---

## 📋 PRE-DEPLOYMENT (30 minutes)

### GitHub Setup
- [ ] Repository created on GitHub
- [ ] `develop` branch created
- [ ] All code pushed to develop branch
- [ ] Branch protection rules set (optional but recommended)
- [ ] `.gitignore` configured (no `.env` files)

### Code Preparation
- [ ] `frontend/vercel.json` created
- [ ] `backend-java/render.yaml` created
- [ ] `backend-ai/render.yaml` created
- [ ] `docker-compose.dev.yml` created
- [ ] `.env.dev.example` created
- [ ] `.github/workflows/deploy-dev.yml` created
- [ ] All Dockerfiles present
- [ ] Dependencies updated (npm, maven, pip)

### Documentation Review
- [ ] Read `INFRASTRUCTURE_PLAN.md`
- [ ] Read `DEPLOYMENT_SETUP_GUIDE.md`
- [ ] Read `DEPLOYED_ENDPOINTS.md`
- [ ] Understand free-tier limitations
- [ ] Confirm no paid services needed without approval

---

## 🌐 SERVICE ACCOUNT SETUP (45 minutes)

### Vercel Account
- [ ] Visit https://vercel.com and sign up
- [ ] Authorize GitHub access
- [ ] Verify email
- [ ] Generate API token: https://vercel.com/account/tokens
- [ ] Store token in secure location

### Render Account
- [ ] Visit https://render.com and sign up
- [ ] Authorize GitHub access
- [ ] Verify email
- [ ] Generate API key: https://dashboard.render.com/account
- [ ] Store key in secure location

### Upstash Account
- [ ] Visit https://upstash.com and sign up
- [ ] Verify email
- [ ] Create Redis database (free tier)
- [ ] Create Vector DB (free tier)
- [ ] Copy credentials:
  - [ ] Redis URL / Host / Port / Password
  - [ ] Vector URL / Token

### Leadrat Integration
- [ ] Confirm Leadrat API credentials available
- [ ] Test Leadrat API connection (optional)
- [ ] Verify tenant ID: `dubaitt11`
- [ ] Store API key securely

---

## 🔐 GITHUB SECRETS CONFIGURATION (15 minutes)

### Add Secrets to GitHub

Navigate to: **GitHub Repository → Settings → Secrets and Variables → Actions**

#### Vercel Secrets
- [ ] Add `VERCEL_TOKEN`
  ```
  Get from: https://vercel.com/account/tokens
  ```
- [ ] Add `VERCEL_ORG_ID`
  ```
  Get from: https://vercel.com/account/teams
  ```
- [ ] Add `VERCEL_PROJECT_ID_FRONTEND`
  ```
  Get from: Vercel project settings after import
  ```

#### Render Secrets
- [ ] Add `RENDER_API_KEY`
  ```
  Get from: https://dashboard.render.com/account
  ```
- [ ] Add `RENDER_SERVICE_ID_JAVA`
  ```
  Get from: Render service page after creation
  ```
- [ ] Add `RENDER_SERVICE_ID_AI`
  ```
  Get from: Render service page after creation
  ```

#### Upstash Secrets
- [ ] Add `UPSTASH_REDIS_URL`
  ```
  Format: redis://:password@host:port
  ```
- [ ] Add `UPSTASH_VECTOR_URL`
  ```
  Get from: Upstash Vector DB console
  ```
- [ ] Add `UPSTASH_VECTOR_TOKEN`
  ```
  Get from: Upstash Vector DB console
  ```

#### API Keys
- [ ] Add `LEADRAT_API_KEY`
  ```
  Leadrat tenant credentials
  ```
- [ ] Add `JWT_SECRET`
  ```
  Generate: openssl rand -hex 32
  ```

#### Optional - Slack Notifications
- [ ] Add `SLACK_WEBHOOK_URL` (if setting up notifications)
  ```
  Get from: https://api.slack.com/apps
  ```

---

## 🚀 VERCEL DEPLOYMENT (15 minutes)

### Import Frontend Project
- [ ] Log in to Vercel
- [ ] Click **Add New → Project**
- [ ] Select your GitHub repository
- [ ] Select root directory: `./frontend`
- [ ] Confirm build settings:
  - [ ] Framework: Next.js
  - [ ] Build command: `npm run build`
  - [ ] Output directory: `.next`

### Add Environment Variables
- [ ] Click **Settings → Environment Variables**
- [ ] Add variable: `NEXT_PUBLIC_API_URL`
  ```
  Value: https://dev-api.example.in
  Environments: Production, Preview, Development
  ```
- [ ] Add variable: `NEXT_PUBLIC_RAG_URL`
  ```
  Value: https://dev-rag.example.in
  ```
- [ ] Add variable: `NEXT_PUBLIC_APP_NAME`
  ```
  Value: RealEstate AI CRM - Dev
  ```
- [ ] Add variable: `NEXT_PUBLIC_ENVIRONMENT`
  ```
  Value: development
  ```

### Deploy
- [ ] Click **Deploy**
- [ ] Wait for build to complete (2-3 minutes)
- [ ] Verify deployment successful
- [ ] Note the Vercel URL (e.g., `https://real-estate-ai-...vercel.app`)
- [ ] Test frontend loads: `curl https://real-estate-ai-...vercel.app`

### Configure Custom Domain (Optional)
- [ ] Go to **Settings → Domains**
- [ ] Add domain: `dev-chatbot.example.in`
- [ ] Add DNS records to domain registrar
- [ ] Wait for DNS propagation
- [ ] Verify SSL certificate issued

---

## 🎯 RENDER DEPLOYMENT (30 minutes)

### Create PostgreSQL Database
- [ ] Log in to Render
- [ ] Click **New + → PostgreSQL**
- [ ] Name: `crm-postgres-dev`
- [ ] Database: `crm_cbt_db_dev`
- [ ] User: `devuser`
- [ ] Region: Oregon (free tier)
- [ ] Plan: Free
- [ ] Click **Create**
- [ ] Wait for database ready (2-3 minutes)
- [ ] Copy connection string:
  ```
  postgres://devuser:PASSWORD@HOST:5432/crm_cbt_db_dev
  ```
- [ ] Copy credentials separately

### Deploy Java Backend
- [ ] Click **New + → Web Service**
- [ ] Select your GitHub repository
- [ ] Branch: `develop`
- [ ] Name: `real-estate-api-dev`
- [ ] Environment: Docker
- [ ] Region: Oregon
- [ ] Plan: Free
- [ ] Add environment variables:
  - [ ] `SPRING_PROFILES_ACTIVE` = `dev`
  - [ ] `SPRING_DATASOURCE_URL` = (from database)
  - [ ] `SPRING_DATASOURCE_USERNAME` = `devuser`
  - [ ] `SPRING_DATASOURCE_PASSWORD` = (from database)
  - [ ] `JWT_SECRET` = (generated value)
  - [ ] `LEADRAT_API_KEY` = (your key)
  - [ ] `LEADRAT_TENANT` = `dubaitt11`
  - [ ] `CORS_ALLOWED_ORIGINS` = `https://dev-chatbot.example.in,https://dev-api.example.in`
  - [ ] `SPRING_REDIS_HOST` = (from Upstash)
  - [ ] `SPRING_REDIS_PORT` = (from Upstash)
  - [ ] `SPRING_REDIS_PASSWORD` = (from Upstash)
- [ ] Click **Deploy**
- [ ] Wait for build and deployment (5-10 minutes)
- [ ] Note the Render URL
- [ ] Test health endpoint: `curl RENDER_URL/actuator/health`

### Deploy FastAPI Backend
- [ ] Repeat Java Backend steps but:
  - [ ] Name: `real-estate-rag-dev`
  - [ ] Environment variables:
    - [ ] `ENVIRONMENT` = `development`
    - [ ] `OLLAMA_HOST` = (your Ollama URL)
    - [ ] `REDIS_URL` = (from Upstash)
    - [ ] `VECTOR_DB_URL` = (from Upstash Vector)
    - [ ] `VECTOR_DB_TOKEN` = (from Upstash Vector)
- [ ] Click **Deploy**
- [ ] Wait for build and deployment
- [ ] Note the Render URL
- [ ] Test health endpoint: `curl RENDER_URL/health`

### Create Redis Database (Alternative if using Render)
- [ ] Click **New + → Redis**
- [ ] Name: `cache-redis-dev`
- [ ] Region: Oregon
- [ ] Plan: Free
- [ ] Click **Create**
- [ ] Note connection details (or use Upstash instead)

---

## 💾 UPSTASH SETUP (15 minutes)

### Create Redis Instance
- [ ] Log in to Upstash console
- [ ] Click **Create Database → Redis**
- [ ] Name: `cache-redis-dev`
- [ ] Region: us-east-1 (closest to Oregon)
- [ ] Database type: Redis
- [ ] Plan: Free
- [ ] Click **Create**
- [ ] Copy Redis URL: `redis://:password@host:port`
- [ ] Copy Host, Port, Password separately

### Create Vector Database
- [ ] In Upstash console, click **Create Index → Vector**
- [ ] Name: `vector-db-dev`
- [ ] Model: "text-embedding-3-small" (1536 dimensions)
- [ ] Similarity metric: Cosine
- [ ] Plan: Free
- [ ] Click **Create**
- [ ] Copy API URL
- [ ] Copy Token
- [ ] Note dimensions: 1536

---

## 🔗 DNS & DOMAIN CONFIGURATION (Optional)

*Skip this step if using Vercel/Render default domains*

### Purchase Domain
- [ ] Purchase `example.in` from registrar (Namecheap, GoDaddy, etc.)
- [ ] Verify domain ownership
- [ ] Access DNS management

### Add DNS Records

In your domain registrar's DNS settings:

```
Type    Name              Value
────────────────────────────────────────────────────────
CNAME   dev-chatbot       cname.vercel-dns.com
CNAME   dev-api           real-estate-api-dev.onrender.com
CNAME   dev-rag           real-estate-rag-dev.onrender.com
CNAME   dev-docs          docs-dev.onrender.com
TXT     _acme-challenge   (auto-populated by Let's Encrypt)
```

- [ ] Add CNAME records
- [ ] Wait for DNS propagation (5-30 minutes)
- [ ] Test DNS resolution: `nslookup dev-chatbot.example.in`

### Configure SSL
- [ ] Add custom domain to Vercel project
- [ ] Add custom domain to Render service
- [ ] Verify DNS records in services
- [ ] Automatic SSL certificate provisioning (Let's Encrypt)
- [ ] Wait for certificate issuance (usually immediate)

---

## 🧪 DEPLOYMENT VERIFICATION (20 minutes)

### GitHub Actions Test
- [ ] Make a test commit to `develop` branch
  ```bash
  git commit --allow-empty -m "Test deployment pipeline"
  git push origin develop
  ```
- [ ] Go to **GitHub → Actions**
- [ ] Monitor `Deploy to Dev Environment` workflow:
  - [ ] Security checks pass
  - [ ] Frontend build succeeds
  - [ ] Backend builds succeed
  - [ ] Docker builds succeed
  - [ ] Deployment to services succeeds

### Frontend Health Check
- [ ] Open browser to `https://dev-chatbot.example.in`
- [ ] Verify page loads
- [ ] Verify title shows "RealEstate AI CRM"
- [ ] Verify dark theme applied
- [ ] Check console for errors: F12 → Console
- [ ] Verify no CORS errors

### Java API Health Check
```bash
curl https://dev-api.example.in/actuator/health
# Expected: {"status":"UP"}

curl https://dev-api.example.in/actuator/health/db
# Expected: Database status UP
```
- [ ] Both endpoints return 200 OK
- [ ] Status shows UP
- [ ] Database connection successful

### FastAPI Health Check
```bash
curl https://dev-rag.example.in/health
# Expected: {"status":"healthy"}
```
- [ ] Endpoint returns 200 OK
- [ ] Status shows healthy
- [ ] LLM provider shows ollama

### End-to-End Flow Test
- [ ] Open frontend: `https://dev-chatbot.example.in`
- [ ] Login with credentials:
  - [ ] Email: `admin@crm-cbt.com`
  - [ ] Password: `Admin@123!`
- [ ] Verify dashboard loads
- [ ] Go to Leads page
- [ ] Search for a lead
- [ ] View lead details
- [ ] Go to AI Assistant
- [ ] Type a message
- [ ] Verify bot responds
- [ ] Change language to Hindi
- [ ] Verify UI changes language
- [ ] Verify bot responds in selected language
- [ ] Test schedule appointment flow
- [ ] Check all features work

### Database Verification
- [ ] Render database is accessible
- [ ] Data from Leadrat API is loading
- [ ] Migrations applied successfully
- [ ] Can create new records

### Cache Verification
- [ ] Redis connection successful
- [ ] Session cache working
- [ ] Response times good

---

## 🔒 SECURITY VERIFICATION (10 minutes)

### Check HTTPS/SSL
- [ ] All URLs use HTTPS
- [ ] SSL certificate valid:
  ```bash
  curl -vI https://dev-chatbot.example.in 2>&1 | grep certificate
  ```
- [ ] Certificate issuer: Let's Encrypt
- [ ] No certificate warnings

### Check API Security
- [ ] JWT authentication working
- [ ] CORS headers present
- [ ] Sensitive endpoints require token
- [ ] Public endpoints don't leak sensitive data

### Verify Secrets
- [ ] GitHub secrets are set (not visible in logs)
- [ ] Environment variables not in code
- [ ] Credentials not in git history
- [ ] Database password not exposed

---

## 📊 PERFORMANCE VERIFICATION (5 minutes)

### Response Times
```bash
# Frontend load
time curl https://dev-chatbot.example.in > /dev/null

# API health
time curl https://dev-api.example.in/actuator/health

# FastAPI health
time curl https://dev-rag.example.in/health
```
- [ ] All responses < 1 second
- [ ] No timeouts or errors

### Resource Usage
- [ ] Vercel build time < 5 minutes
- [ ] Render services < 0.5GB RAM (free tier)
- [ ] Database queries < 500ms
- [ ] Cache hits < 50ms

---

## 🎯 FINAL VERIFICATION CHECKLIST

- [ ] All 3 services deployed
- [ ] All health checks pass
- [ ] Frontend accessible
- [ ] API accessible
- [ ] RAG/FastAPI accessible
- [ ] Login flow works
- [ ] Database accessible
- [ ] Redis accessible
- [ ] Leadrat integration works
- [ ] AI chat works
- [ ] All 14 languages load
- [ ] Multilingual UI works
- [ ] Dark theme applies
- [ ] End-to-end flow works
- [ ] HTTPS/SSL verified
- [ ] No console errors
- [ ] No network errors
- [ ] Performance acceptable
- [ ] GitHub Actions workflow successful
- [ ] No security warnings

---

## 📝 DEPLOYMENT RECORD

After successful deployment, document:

```
Date Deployed:      2026-04-29
Deployed By:        [Your name]
Environment:        Development
Services:
  - Frontend:       [Vercel URL]
  - API:            [Render URL]
  - RAG:            [Render URL]
  - Database:       [Render PostgreSQL]
  - Cache:          [Upstash Redis]
  - Vector DB:      [Upstash Vector]

Domains:
  - dev-chatbot:    [URL]
  - dev-api:        [URL]
  - dev-rag:        [URL]

Secrets Configured:  [List of secrets set]
Health Checks:       All passing ✅
Performance:         All acceptable ✅
Security:            All verified ✅
```

---

## 🔄 NEXT STEPS AFTER DEPLOYMENT

### Immediate (Same Day)
- [ ] Smoke test all features
- [ ] Check logs for errors
- [ ] Verify database backups
- [ ] Set up monitoring/alerts

### Short Term (This Week)
- [ ] Comprehensive testing
- [ ] Performance tuning if needed
- [ ] User acceptance testing
- [ ] Gather feedback

### Medium Term (Next 2 Weeks)
- [ ] Plan QA environment
- [ ] Create QA deployment guide
- [ ] Test CI/CD pipeline robustness

### Long Term (Future)
- [ ] Plan Stage environment
- [ ] Plan Production environment
- [ ] Prepare production checklist
- [ ] Schedule deployment review

---

## 🆘 TROUBLESHOOTING

If deployment fails, refer to:
- `DEPLOYMENT_SETUP_GUIDE.md` → Troubleshooting section
- Service provider logs (Vercel, Render, Upstash dashboards)
- GitHub Actions logs
- Check network/DNS propagation

---

## ✅ DEPLOYMENT COMPLETE

Once all items are checked:
1. Archive this checklist
2. Document deployment details
3. Share access with team
4. Begin testing phase
5. Plan next environment deployment

**Status:** 🟢 Ready for Dev Environment Deployment

