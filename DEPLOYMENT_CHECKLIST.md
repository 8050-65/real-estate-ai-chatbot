# DEPLOYMENT CHECKLIST
## Quick Reference for Deployment Tasks

---

## PHASE 1: LOCAL VERIFICATION ✓ (Estimated: 1 hour)

### Docker Compose Test
- [ ] `docker compose build --no-cache` (runs without errors)
- [ ] `docker compose up -d` (all services start)
- [ ] `docker compose ps` (all services show healthy)
- [ ] `docker logs realestate_backend_java` (no startup errors)
- [ ] `docker logs realestate_backend_ai` (no startup errors)
- [ ] `curl http://localhost:8080/actuator/health` (responds 200)
- [ ] `curl http://localhost:8000/health` (responds 200)

### Frontend Local Test
- [ ] `npm run dev` (dev server starts on port 3000)
- [ ] Visit http://localhost:3000/login
- [ ] Login with admin@crm-cbt.com / Admin@123!
- [ ] Visit http://localhost:3000/ai-assistant
- [ ] Test chatbot message
- [ ] Change language to Kannada/Arabic (multilingual works)
- [ ] Visit http://localhost:3000/settings
- [ ] Create a test lead
- [ ] No hardcoded `localhost` URLs in Network tab

### Backend API Test
- [ ] Test login endpoint: `curl -X POST http://localhost:8080/api/v1/auth/login -d '{"email":"admin@crm-cbt.com","password":"Admin@123!"}'`
- [ ] Test get leads: `curl http://localhost:8080/api/v1/leads -H "Authorization: Bearer <token>"`
- [ ] Chatbot response: Send message to `/api/v1/chat`

---

## PHASE 2: CONFIGURATION FILES ✓ (Estimated: 1 hour)

### 2.1 Create .env.production.example
- [ ] Copy from template below
- [ ] File location: `repo-root/.env.production.example`
- [ ] Contains all variables (no secrets, use placeholders)
- [ ] Commit to git

**Content:**
```bash
# Database
DB_NAME=crm_cbt_db_prod
DB_USER=crm_user
DB_PASSWORD=ChangeMeToSecurePassword!

# Redis
REDIS_PORT=6379

# Security
JWT_SECRET_KEY=ChangeMeToAtLeast32CharactersSecureKeyHere!
JWT_EXPIRATION=86400000

# Leadrat
LEADRAT_BASE_URL=https://connect.leadrat.com/api/v1
LEADRAT_AUTH_URL=https://connect.leadrat.com/api/v1/authentication/token
LEADRAT_TENANT=dubait11
LEADRAT_API_KEY=your-api-key-here
LEADRAT_SECRET_KEY=your-secret-key-here

# Services
BACKEND_PORT=8080
AI_SERVICE_PORT=8000
OLLAMA_PORT=11434
OLLAMA_MODEL=llama2

# Environment
ENVIRONMENT=production
LOG_LEVEL=INFO
SPRING_PROFILE=prod
```

### 2.2 Create Frontend .env.production
- [ ] File location: `frontend/.env.production`
- [ ] Content:
```bash
NEXT_PUBLIC_API_URL=https://api.domain.com
NEXT_PUBLIC_AI_BASE_URL=https://ai.domain.com
NEXT_PUBLIC_APP_NAME=RealEstate AI CRM
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_DEMO_MODE=false
```

### 2.3 Create application-prod.yml
- [ ] File location: `backend-java/src/main/resources/application-prod.yml`
- [ ] Configure database, redis, logging
- [ ] Set ddl-auto to `validate` (not `update`)

### 2.4 Verify FastAPI CORS
- [ ] Check `backend-ai/main.py` has proper CORS config
- [ ] Allow `https://app.domain.com`, `https://api.domain.com`, `https://ai.domain.com`

### 2.5 Demo Mode Fallbacks
- [ ] Check `frontend/lib/api-client.ts` has fallback data
- [ ] Add demo leads/properties if missing

---

## PHASE 3: NGINX CONFIGURATION ✓ (Estimated: 30 minutes)

### 3.1 Create Nginx Config
- [ ] File location: `nginx/nginx.conf` or `/etc/nginx/sites-available/realestateai`
- [ ] Three upstream blocks (frontend, backend-java, backend-ai)
- [ ] HTTP → HTTPS redirect
- [ ] Three server blocks (app.domain.com, api.domain.com, ai.domain.com)
- [ ] Proper proxy_set_header directives
- [ ] gzip compression enabled
- [ ] WebSocket support (Upgrade/Connection headers)

### 3.2 Test Nginx Locally
- [ ] Copy production frontend build to nginx webroot
- [ ] `nginx -t` (config test passes)
- [ ] `nginx -s reload` (service restarts without errors)

---

## PHASE 4: VPS PREPARATION ✓ (Estimated: 30 minutes)

### 4.1 VPS Access
- [ ] SSH connection verified
- [ ] `ssh ubuntu@your-vps-ip` works
- [ ] Can run `sudo` commands

### 4.2 Docker Installation
- [ ] Docker installed: `docker --version`
- [ ] Docker Compose installed: `docker-compose --version`
- [ ] Docker daemon running: `docker ps`
- [ ] Ubuntu user in docker group: `sudo usermod -aG docker ubuntu`

### 4.3 Domain & DNS Setup
- [ ] Domain registrar accessed
- [ ] DNS records added:
  - `app.domain.com A <vps-ip>`
  - `api.domain.com A <vps-ip>`
  - `ai.domain.com A <vps-ip>`
- [ ] DNS propagation verified: `nslookup app.domain.com` (shows VPS IP)
- [ ] Wait 5-15 minutes if not propagated yet

### 4.4 Directory Setup
- [ ] Create: `/opt/realestateai`
- [ ] Clone repo into it
- [ ] Create: `/opt/realestateai/.env.production` (with real credentials)
- [ ] Permissions: `chmod 600 .env.production`

### 4.5 SSL Certificate Preparation
- [ ] Certbot installed: `sudo apt-get install certbot python3-certbot-nginx`
- [ ] OR prepare for Let's Encrypt manual mode

---

## PHASE 5: DEPLOYMENT ✓ (Estimated: 15 minutes)

### 5.1 Build & Deploy
```bash
cd /opt/realestateai

# Build images
docker compose build --no-cache

# Start services
docker compose up -d

# Verify health
docker compose ps
```

- [ ] All services show "healthy" or "Up"
- [ ] No error messages in `docker compose logs`

### 5.2 SSL Certificate Generation
```bash
sudo certbot certonly --standalone \
  -d app.domain.com \
  -d api.domain.com \
  -d ai.domain.com
```

- [ ] Certificates generated in `/etc/letsencrypt/live/`
- [ ] Certificate paths confirmed for nginx config

### 5.3 Nginx Start
```bash
# Copy config to nginx
sudo cp nginx/nginx.conf /etc/nginx/nginx.conf

# Test config
sudo nginx -t

# Start/reload
sudo systemctl start nginx
sudo systemctl enable nginx
```

- [ ] Nginx running: `sudo systemctl status nginx`
- [ ] Listening on 80/443: `sudo netstat -tlnp | grep nginx`

---

## PHASE 6: VERIFICATION ✓ (Estimated: 15 minutes)

### 6.1 Health Endpoints
```bash
# Java Backend
curl https://api.domain.com/actuator/health

# AI Service
curl https://ai.domain.com/health

# Frontend (check HTTP status)
curl -I https://app.domain.com
```

- [ ] All endpoints respond with 200/OK
- [ ] HTTPS (not HTTP)
- [ ] Valid certificates (no SSL warnings)

### 6.2 Frontend Functionality
- [ ] Visit https://app.domain.com in browser
- [ ] Page loads without errors
- [ ] Can navigate to login page
- [ ] No console errors (F12 → Console tab)
- [ ] Logo/styling visible (not just white page)

### 6.3 Login & Auth
- [ ] Login page displays
- [ ] Email: admin@crm-cbt.com
- [ ] Password: Admin@123!
- [ ] Click login → redirects to dashboard
- [ ] Token appears in `localStorage` (F12 → Application → Storage)

### 6.4 Chatbot Test
- [ ] Visit https://app.domain.com/ai-assistant
- [ ] Welcome message visible
- [ ] Type message: "hello"
- [ ] Bot responds (not error)
- [ ] Can search leads
- [ ] Can create new lead
- [ ] Can schedule appointment

### 6.5 Lead Management
- [ ] Search existing leads
- [ ] Create new lead
- [ ] View lead details
- [ ] Update lead status
- [ ] Status syncs to Leadrat (/logs endpoint)

### 6.6 Settings/Multilingual
- [ ] Visit https://app.domain.com/settings
- [ ] Change language to Kannada
- [ ] See UI in Kannada
- [ ] Refresh page → Language persists

### 6.7 Logs Check
```bash
docker logs realestate_backend_java | tail -50
docker logs realestate_backend_ai | tail -50
docker logs realestate_postgres | tail -20
```

- [ ] No errors or warnings
- [ ] Normal startup logs
- [ ] No connection failures
- [ ] Leadrat auth successful

---

## PHASE 7: DOCUMENTATION & MAINTENANCE ✓ (Ongoing)

### 7.1 Deployment Documentation
- [ ] Create `DEPLOYMENT_GUIDE.md` for ops team
  - VPS setup steps
  - First-time deploy commands
  - How to restart services
  - How to view logs
  - How to backup data
  - Emergency troubleshooting

### 7.2 Backup Setup
- [ ] PostgreSQL backup script created
- [ ] Cron job configured: `0 2 * * * /opt/realestateai/backup.sh`
- [ ] Backups stored in `/opt/realestateai/backups/`

### 7.3 Monitoring
- [ ] Health check monitoring (Uptime Robot, or simple script)
- [ ] Log rotation configured: `/etc/logrotate.d/realestateai`
- [ ] Disk space monitoring

### 7.4 Security Hardening
- [ ] Firewall configured: `sudo ufw enable`
  - [ ] Allow port 22 (SSH)
  - [ ] Allow port 80 (HTTP)
  - [ ] Allow port 443 (HTTPS)
- [ ] SSH key-only access (disable password)
- [ ] Fail2ban configured (optional, for brute-force protection)
- [ ] Regular security updates: `sudo apt-get upgrade`

### 7.5 Runbook for Common Tasks
- [ ] How to restart all services
- [ ] How to update code (git pull + docker compose rebuild)
- [ ] How to view logs
- [ ] How to backup/restore database
- [ ] Emergency escalation contacts

---

## PHASE 8: DEMO READINESS ✓ (Final Check)

### Pre-Demo Checklist
- [ ] All services healthy: `docker compose ps`
- [ ] Fresh backup created
- [ ] Test lead data in system
- [ ] Leadrat credentials working
- [ ] Multilingual UI working (test Kannada/Arabic)
- [ ] Chatbot responses reasonable
- [ ] No console errors in frontend
- [ ] Network latency acceptable (should be <100ms from VPS)

### Demo Day
- [ ] Test all features 1 hour before demo
- [ ] Have backup VPS/demo environment ready
- [ ] Backup database in case of demo data creation
- [ ] Login credentials written down (admin@crm-cbt.com / Admin@123!)
- [ ] Internet connection stable
- [ ] Have phone number for demo lead creation

---

## ROLLBACK PROCEDURE (If needed)

If deployment has critical issues:

```bash
# 1. Stop current services
cd /opt/realestateai
docker compose down

# 2. Revert to previous .env and docker-compose.yml
git checkout .env.production
git checkout docker-compose.yml

# 3. Restart previous version
docker compose up -d

# 4. Verify
docker compose ps
curl https://app.domain.com
```

- [ ] Previous version running
- [ ] Services healthy
- [ ] Problem identified and documented

---

## TROUBLESHOOTING QUICK REFERENCE

| Issue | Command | Solution |
|-------|---------|----------|
| Service down | `docker compose restart <service>` | Restart the service |
| Container crash | `docker logs <service>` | Check error in logs |
| Database connection | `docker compose exec postgres psql -U rootuser` | Test DB directly |
| Redis issue | `docker compose exec redis redis-cli ping` | Test Redis |
| Nginx not working | `sudo nginx -t` | Test config syntax |
| SSL certificate error | `sudo certbot renew` | Renew certificate |
| Leadrat API error | Check `.env.production` credentials | Verify Leadrat config |
| Frontend 502 | `curl http://backend-java:8080` | Check if backend running |

---

## SIGN-OFF CHECKLIST

Before marking deployment complete:

- [ ] **Developer:** All code reviewed and tested locally
- [ ] **DevOps:** VPS prepared and secured
- [ ] **QA:** Full feature test passed on production
- [ ] **Leadership:** Demo ran successfully
- [ ] **Documentation:** Runbook created for ops team
- [ ] **Backup:** First backup completed and verified
- [ ] **Monitoring:** Health checks active

---

## SUCCESS CRITERIA

✅ Deployment is complete when:

1. ✅ All Docker containers running and healthy
2. ✅ https://app.domain.com loads (Frontend)
3. ✅ https://api.domain.com responds (Java Backend)
4. ✅ https://ai.domain.com responds (AI Service)
5. ✅ Login works with valid credentials
6. ✅ Chatbot responds to messages
7. ✅ Lead creation works end-to-end
8. ✅ Status updates sync to Leadrat
9. ✅ No hardcoded localhost URLs
10. ✅ SSL certificates valid
11. ✅ No errors in logs
12. ✅ Page loads in <2 seconds
13. ✅ CEO demo completed successfully

---

**ESTIMATED TOTAL TIME: 3-4 hours**

**Can we deploy?** ✅ **YES - Ready today!**

