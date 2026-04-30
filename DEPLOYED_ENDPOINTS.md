# 📊 DEV DEPLOYED ENDPOINTS & HEALTH CHECKS

**Environment:** Development  
**Domain Placeholder:** `*.example.in`  
**Status:** Ready for Deployment

---

## 🌐 DEPLOYED SERVICE URLS

### Frontend Application
```
URL:        https://dev-chatbot.example.in
Service:    Vercel (Next.js)
Protocol:   HTTPS
Status:     Active
```

### API Gateway / Java Backend
```
URL:        https://dev-api.example.in
Service:    Render (Spring Boot)
Protocol:   HTTPS
Port:       443 (HTTPS) / 8080 (internal)
Status:     Active
```

### RAG / FastAPI Service
```
URL:        https://dev-rag.example.in
Service:    Render (FastAPI)
Protocol:   HTTPS
Port:       443 (HTTPS) / 8000 (internal)
Status:     Active
```

### Admin / Documentation
```
URL:        https://dev-docs.example.in
Service:    Render (pgAdmin + API Docs)
Protocol:   HTTPS
Port:       443 (HTTPS)
Status:     Active
```

---

## ✅ HEALTH CHECK ENDPOINTS

### Frontend Health

```bash
# Check frontend is accessible
curl https://dev-chatbot.example.in

# Expected: HTML page with "RealEstate AI CRM" title
# Status: 200 OK
```

### Java API Health

```bash
# Basic health check
curl https://dev-api.example.in/actuator/health

# Expected response:
# {"status":"UP","components":{"db":{"status":"UP"},...}}
# Status: 200 OK
```

### Java API - Database Health

```bash
curl https://dev-api.example.in/actuator/health/db

# Expected response:
# {"status":"UP","details":{"database":"PostgreSQL",...}}
# Status: 200 OK
```

### Java API - Detailed Metrics

```bash
curl https://dev-api.example.in/actuator/health/diskSpace
curl https://dev-api.example.in/actuator/metrics

# Shows system metrics, database connections, cache status
# Status: 200 OK
```

### FastAPI Health

```bash
curl https://dev-rag.example.in/health

# Expected response:
# {"status":"healthy","service":"realestate-ai-service","llm_provider":"ollama"}
# Status: 200 OK
```

### FastAPI - Detailed Metrics

```bash
curl https://dev-rag.example.in/metrics

# Shows API metrics, processing times, model performance
# Status: 200 OK
```

### Redis Health (via API)

```bash
# Check Redis connection from Java API
curl https://dev-api.example.in/actuator/health/redis

# Expected: {"status":"UP"}
# Status: 200 OK
```

---

## 🔗 API ENDPOINTS

### Authentication
```
POST    /api/v1/auth/login
POST    /api/v1/auth/logout
POST    /api/v1/auth/refresh
POST    /api/v1/auth/register
```

### Lead Management
```
GET     /api/v1/leads
GET     /api/v1/leads/{leadId}
POST    /api/v1/leads
PUT     /api/v1/leads/{leadId}
DELETE  /api/v1/leads/{leadId}
PUT     /api/v1/leads/{leadId}/status
GET     /api/v1/leads/search?query=...
```

### Properties
```
GET     /api/v1/properties
GET     /api/v1/properties/{propertyId}
GET     /api/v1/properties/search?query=...
```

### Projects
```
GET     /api/v1/projects
GET     /api/v1/projects/{projectId}
```

### Appointments / Scheduling
```
POST    /api/v1/appointments
GET     /api/v1/appointments
GET     /api/v1/appointments/{appointmentId}
PUT     /api/v1/appointments/{appointmentId}
DELETE  /api/v1/appointments/{appointmentId}
```

### AI Chat / RAG
```
POST    /api/chat
GET     /api/chat/history
GET     /api/documents
POST    /api/documents/upload
GET     /api/embeddings/search
```

### User Management
```
GET     /api/v1/users
GET     /api/v1/users/{userId}
PUT     /api/v1/users/{userId}
PUT     /api/v1/users/{userId}/password
```

### Activity Logging
```
GET     /api/v1/activities
POST    /api/v1/activities
GET     /api/v1/activities/search?query=...
```

### System
```
GET     /actuator/health
GET     /actuator/info
GET     /actuator/metrics
GET     /swagger-ui.html
```

---

## 🧪 MANUAL HEALTH CHECK SCRIPT

```bash
#!/bin/bash

echo "🔍 DEV ENVIRONMENT HEALTH CHECK"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check Frontend
echo -n "Frontend... "
if curl -s https://dev-chatbot.example.in | grep -q "RealEstate AI CRM"; then
  echo -e "${GREEN}✅ OK${NC}"
else
  echo -e "${RED}❌ FAILED${NC}"
fi

# Check Java API
echo -n "Java API Health... "
if curl -s https://dev-api.example.in/actuator/health | grep -q '"status":"UP"'; then
  echo -e "${GREEN}✅ OK${NC}"
else
  echo -e "${RED}❌ FAILED${NC}"
fi

# Check FastAPI
echo -n "FastAPI Health... "
if curl -s https://dev-rag.example.in/health | grep -q '"status":"healthy"'; then
  echo -e "${GREEN}✅ OK${NC}"
else
  echo -e "${RED}❌ FAILED${NC}"
fi

# Check Database
echo -n "Database Health... "
if curl -s https://dev-api.example.in/actuator/health/db | grep -q '"status":"UP"'; then
  echo -e "${GREEN}✅ OK${NC}"
else
  echo -e "${RED}❌ FAILED${NC}"
fi

echo ""
echo "=================================="
echo "Health check complete!"
```

---

## 🔐 AUTHENTICATION

All API endpoints (except `/health`) require JWT token:

```bash
# Login first
curl -X POST https://dev-api.example.in/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@crm-cbt.com",
    "password": "Admin@123!"
  }'

# Response includes:
# {
#   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "tokenType": "Bearer",
#   "expiresIn": 3600
# }

# Use token in subsequent requests
curl -H "Authorization: Bearer <ACCESS_TOKEN>" \
  https://dev-api.example.in/api/v1/leads
```

---

## 📊 PERFORMANCE BENCHMARKS

### Expected Response Times

| Endpoint | Expected Time | Max Time |
|----------|---------------|----------|
| Frontend Load | <1s | <3s |
| Health Check | <100ms | <500ms |
| Lead Search | <500ms | <2s |
| AI Chat | <2s | <10s |
| Database Query | <200ms | <1s |
| Cache Hit | <50ms | <500ms |

### Load Limits (Free Tier)

| Service | Limit |
|---------|-------|
| Vercel Build | 12 builds/hour |
| Render Web Service | 0.5GB RAM |
| Upstash Redis | 10,000 commands/day |
| Upstash Vector | 10,000 vectors |

---

## 🔍 DEBUGGING ENDPOINTS

### View Server Info
```bash
curl https://dev-api.example.in/actuator/info
# Returns app version, build time, etc.
```

### View All Metrics
```bash
curl https://dev-api.example.in/actuator/metrics
# Returns list of available metrics
```

### View Specific Metric
```bash
curl https://dev-api.example.in/actuator/metrics/jvm.memory.used
# Returns JVM memory usage
```

### View System Properties
```bash
curl https://dev-api.example.in/actuator/env
# Returns application properties (sensitive data hidden)
```

### View Logs (via Render)

In Render dashboard:
1. Go to service
2. Click "Logs" tab
3. View real-time logs
4. Filter by level (INFO, WARN, ERROR)

---

## 🔗 EXTERNAL INTEGRATIONS

### Leadrat API Integration

```bash
# Leadrat API Base URL
https://api.leadrat.com

# Tenant: dubaitt11
# Authentication: API Key (in secrets)
# Rate Limit: Based on Leadrat account

# Integrated Endpoints:
# - Get Leads
# - Create Lead
# - Update Lead Status
# - Get Properties
# - Get Projects
```

### Ollama LLM Integration

```bash
# Ollama Model: llama2
# Provider: Self-hosted or Render container
# Model Size: 7B parameters
# Response Time: 1-5 seconds (CPU depends)

# FastAPI endpoint uses Ollama for:
# - AI Chat responses
# - Text generation
# - Embeddings
```

### Upstash Services

```bash
# Redis
# Endpoint: redis://:PASSWORD@HOST:PORT
# Usage: Session cache, rate limiting, data cache

# Vector DB
# Endpoint: REST API with token auth
# Usage: Document embeddings, similarity search, RAG
```

---

## ⚠️ COMMON ISSUES

### 503 Service Unavailable

**Cause:** Free tier Render service spun down  
**Fix:** 
```bash
# Wait 1-2 minutes and retry
curl https://dev-api.example.in/actuator/health

# Service will wake up and respond
```

### 401 Unauthorized

**Cause:** Invalid or expired JWT token  
**Fix:**
```bash
# Re-authenticate
curl -X POST https://dev-api.example.in/api/v1/auth/login \
  -d '{"email":"admin@crm-cbt.com","password":"Admin@123!"}'

# Use new token in Authorization header
```

### 502 Bad Gateway

**Cause:** Backend not responding  
**Check:**
```bash
# 1. Check Render service logs
# 2. Check if database is accessible
# 3. Check if Redis is accessible
# 4. Restart service if needed
```

### CORS Error

**Cause:** Frontend URL not in CORS_ALLOWED_ORIGINS  
**Fix:** Update backend environment variable and redeploy
```
CORS_ALLOWED_ORIGINS=https://dev-chatbot.example.in,https://dev-api.example.in
```

---

## 📈 MONITORING

### Vercel Monitoring
- **Dashboard:** https://vercel.com/dashboard
- **Metrics:** Build time, deployment status, serverless function usage
- **Logs:** Real-time deployment logs

### Render Monitoring
- **Dashboard:** https://dashboard.render.com
- **Logs:** Real-time service logs
- **Metrics:** CPU, memory, disk usage
- **Health:** Auto-restart on failure

### Upstash Monitoring
- **Console:** https://console.upstash.com
- **Metrics:** Command counts, bandwidth, latency
- **Alerts:** Email notifications for limit exceeded

### GitHub Actions Monitoring
- **Dashboard:** GitHub → Actions
- **Workflow Runs:** See all deployments
- **Logs:** Detailed build and deployment logs

---

## 🔄 DEPLOYMENT VERIFICATION CHECKLIST

After deployment, verify:

- [ ] Frontend loads at `https://dev-chatbot.example.in`
- [ ] Java API responds at `https://dev-api.example.in/actuator/health`
- [ ] FastAPI responds at `https://dev-rag.example.in/health`
- [ ] All health checks return 200 OK
- [ ] Database connection successful
- [ ] Redis connection successful
- [ ] CORS headers present in responses
- [ ] SSL certificates valid
- [ ] Login flow works
- [ ] Lead search works
- [ ] AI chat works
- [ ] Appointment scheduling works
- [ ] All 14 languages load
- [ ] Dark theme applied
- [ ] No console errors (F12)

---

## 📞 SUPPORT

If services are down:

1. **Check Status Pages**
   - Vercel: https://www.vercel.com/status
   - Render: https://status.render.com
   - Upstash: https://status.upstash.com

2. **Review Logs**
   - Service provider dashboards
   - GitHub Actions logs

3. **Restart Services**
   - Vercel: Re-trigger deployment
   - Render: Click "Manual Deploy"
   - Upstash: Manual restart (if available)

4. **Check GitHub Issues**
   - Look for known issues
   - Create new issue with logs

---

**All deployed endpoints configured and ready for testing!**

