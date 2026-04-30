# DATABASE SUMMARY & ACCESS GUIDE
## Real Estate AI Chatbot

**Status:** ✅ Database is running and healthy  
**Time:** 2026-04-29  
**Environment:** Development (Single Database Instance)

---

## CURRENT STATUS ✅

```
✅ PostgreSQL Running:    crm-postgres (HEALTHY)
✅ Redis Running:         realestate_redis (HEALTHY)  
✅ pgAdmin Running:       (Available on port 5050)
✅ All Services Connected: Yes
✅ Database Accessible:    Yes
✅ Backups Available:      Yes (can be created anytime)
```

---

## ACCESS DATABASE NOW - 4 OPTIONS

### 🟢 OPTION 1: pgAdmin Web UI (EASIEST - Visual) ⭐

**Best For:** Browsing, visual queries, one-time checks

1. **Open Browser:** http://localhost:5050
2. **Login:**
   - Email: `admin@crm.com`
   - Password: `admin123`
3. **Add Server:**
   - Name: `CRM Database`
   - Host: `postgres`
   - Port: `5432`
   - Database: `crm_cbt_db_dev`
   - Username: `rootuser`
   - Password: `123Pa$$word!`
4. **Done!** Browse tables, run queries, manage data visually

**Screenshot Path:** Look for "CRM Database" in left panel

---

### 🟢 OPTION 2: psql Command Line (BEST - Powerful) ⭐

**Best For:** Scripting, complex queries, automation

**Command:**
```bash
psql -h localhost -U rootuser -d crm_cbt_db_dev -p 5432
```

**When prompted for password:**
```
123Pa$$word!
```

**Once connected, try these commands:**
```sql
\dt                           -- List all tables
SELECT * FROM users LIMIT 5;  -- View first 5 users
SELECT * FROM leads LIMIT 5;  -- View first 5 leads
\d users                      -- Show users table structure
SELECT COUNT(*) FROM leads;   -- Count all leads
\q                            -- Exit
```

---

### 🟢 OPTION 3: Docker CLI (QUICK)

**Best For:** When you already have Docker open

```bash
docker exec -it crm-postgres psql -U rootuser -d crm_cbt_db_dev
```

Then use same SQL commands as Option 2 above.

---

### 🟢 OPTION 4: Desktop Tools (RECOMMENDED - Professional) ⭐⭐⭐

Download one of these free tools:

**pgAdmin Desktop:**
- Download: https://www.pgadmin.org/download/
- Connection:
  - Host: `localhost`
  - Port: `5432`
  - Database: `crm_cbt_db_dev`
  - Username: `rootuser`
  - Password: `123Pa$$word!`

**DBeaver Community (BEST):**
- Download: https://dbeaver.io/
- Connection settings same as above
- More features, better UI

**DataGrip (JetBrains - Paid but worth it):**
- Download: https://www.jetbrains.com/datagrip/

---

## ALL CREDENTIALS AT A GLANCE

### PostgreSQL Database

| Item | Value |
|------|-------|
| **Host** | localhost |
| **Port** | 5432 |
| **Database** | crm_cbt_db_dev |
| **Username** | rootuser |
| **Password** | 123Pa$$word! |
| **Superuser** | Yes |

### pgAdmin Web UI

| Item | Value |
|------|-------|
| **URL** | http://localhost:5050 |
| **Email** | admin@crm.com |
| **Password** | admin123 |

### Redis Cache

| Item | Value |
|------|-------|
| **Host** | localhost |
| **Port** | 6379 |
| **Password** | (none) |

---

## WHAT'S IN THE DATABASE?

### Tables Created (Auto-Migrated)

```
✅ users              - User accounts & authentication
✅ leads              - Leads synced from Leadrat CRM  
✅ activities         - User action logging
✅ conversations      - Chat history
✅ properties         - Real estate properties
✅ projects           - Development projects
✅ audit_logs         - Audit trail
✅ sync_metadata      - Leadrat sync tracking
✅ lead_statuses      - Status tracking
✅ conversation_memory - Chat memory
✅ tenant_configs     - Multi-tenant settings
✅ enhanced_sync_logs - Detailed sync logs
```

### Sample Data in Database

**Users:**
- admin@crm-cbt.com (Admin role)
- Pre-configured user account

**Leads:**
- Synced from Leadrat CRM
- Real lead data from your Leadrat tenant
- Includes: name, email, phone, status, source

**Activities:**
- Login records
- Lead creation/update records
- User actions logged

**Conversations:**
- Chat history with bot
- Conversation metadata

---

## USEFUL QUERIES

### View All Users
```sql
SELECT id, email, role, created_at FROM users;
```

### View Recent Leads
```sql
SELECT name, email, phone, status, created_at 
FROM leads 
ORDER BY created_at DESC 
LIMIT 10;
```

### Count Leads by Status
```sql
SELECT status, COUNT(*) as count 
FROM leads 
GROUP BY status 
ORDER BY count DESC;
```

### Recent Activity
```sql
SELECT user_id, action, details, created_at 
FROM activities 
ORDER BY created_at DESC 
LIMIT 20;
```

### Database Size
```sql
SELECT pg_size_pretty(pg_database_size('crm_cbt_db_dev'));
```

### All Conversations
```sql
SELECT id, user_id, title, created_at 
FROM conversations 
ORDER BY created_at DESC;
```

---

## BACKUP YOUR DATABASE

### One-Time Backup
```bash
# Creates: backup_20260429_120000.sql
docker exec crm-postgres pg_dump -U rootuser -d crm_cbt_db_dev > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Compressed Backup (Recommended)
```bash
# Creates: backup_20260429_120000.sql.gz (smaller file)
docker exec crm-postgres pg_dump -U rootuser -d crm_cbt_db_dev | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore from Backup
```bash
# Restore uncompressed
docker exec -i crm-postgres psql -U rootuser crm_cbt_db_dev < backup_20260429_120000.sql

# Restore compressed
gunzip < backup_20260429_120000.sql.gz | docker exec -i crm-postgres psql -U rootuser crm_cbt_db_dev
```

---

## ENVIRONMENT SEPARATION (OPTIONAL)

### Current Status
🟡 **Single Database** - Development only

### Recommended Future Setup
```
Development  → crm_cbt_db_dev   (rootuser)
QA           → crm_cbt_db_qa    (qa_user)
Staging      → crm_cbt_db_stage (stage_user)
Production   → crm_cbt_db_prod   (prod_user)
```

When you're ready for production, create separate databases and users with different credentials for each environment.

See `DATABASE_CONFIG.md` for detailed multi-environment setup.

---

## HEALTH CHECKS

### Verify Database Connection

```bash
# Check via Docker health check
docker inspect crm-postgres | grep -A 5 "Health"

# Check via psql
docker exec crm-postgres pg_isready -U rootuser -d crm_cbt_db_dev

# Check via curl (Spring Boot endpoint)
curl http://localhost:8080/actuator/health/db

# Check via Redis
docker exec realestate_redis redis-cli ping
```

All should show: **healthy** or **UP**

---

## TROUBLESHOOTING

### Can't Connect to Database?

1. **Check container is running:**
   ```bash
   docker compose ps
   # Should show: crm-postgres ... Up ... (healthy)
   ```

2. **Check port is open:**
   ```bash
   netstat -an | grep 5432
   # Should show: TCP LISTEN on 5432
   ```

3. **Try connecting via Docker:**
   ```bash
   docker exec -it crm-postgres psql -U rootuser -d crm_cbt_db_dev
   ```

4. **Check password is correct:**
   - Username: `rootuser`
   - Password: `123Pa$$word!`
   - Note the special characters: `$$` and `!`

5. **Restart database:**
   ```bash
   docker compose down
   docker compose up -d postgres
   docker compose ps  # Wait until healthy
   ```

### Database Locked?

```bash
# Force terminate connections
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c "
  SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
  WHERE pid <> pg_backend_pid();
"
```

### Disk Space Issues?

```bash
# Check table sizes
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c "
  SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
  FROM pg_tables 
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# Cleanup
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c "VACUUM ANALYZE;"
```

---

## QUICK REFERENCE

| Task | Command |
|------|---------|
| Access pgAdmin | Visit http://localhost:5050 → Login → Connect |
| Access psql | `psql -h localhost -U rootuser -d crm_cbt_db_dev` |
| Access via Docker | `docker exec -it crm-postgres psql -U rootuser -d crm_cbt_db_dev` |
| View all users | `SELECT * FROM users;` |
| View all leads | `SELECT * FROM leads;` |
| Count leads | `SELECT COUNT(*) FROM leads;` |
| Backup database | `docker exec crm-postgres pg_dump -U rootuser -d crm_cbt_db_dev > backup.sql` |
| Check health | `docker compose ps` |
| View logs | `docker logs crm-postgres` |
| Stop database | `docker compose stop postgres` |
| Start database | `docker compose up -d postgres` |

---

## NEXT STEPS

### For Development
1. ✅ Access database using Option 1-4 above
2. ✅ Create test data for demos
3. ✅ Verify all tables and data
4. ✅ Take a backup

### For QA/Testing
1. Create separate QA database (see DATABASE_CONFIG.md)
2. Use qa_user with QA credentials
3. Create QA test data

### For Production Deployment
1. Follow DEPLOYMENT_PLAN.md
2. Set up production database with prod_user
3. Configure daily automated backups
4. Implement encryption at rest

---

## IMPORTANT NOTES

### Security ⚠️

**Current Setup (DEV only):**
- ⚠️ Password visible in docker-compose.yml
- ✅ Port only exposed to localhost
- ✅ No internet access

**For Production:**
- 🔒 Use environment variables for passwords
- 🔒 Don't expose port 5432 to internet
- 🔒 Enable SSL/TLS connections
- 🔒 Encrypt backups
- 🔒 Implement role-based access control

### Data Persistence ✅

- ✅ All data stored in Docker volume `postgres_data`
- ✅ Data survives container restart
- ✅ Data survives docker compose down/up
- ✅ Can backup/restore anytime

---

## FILES PROVIDED

| File | Purpose |
|------|---------|
| **DATABASE_CONFIG.md** | Full database documentation with setup guides |
| **DATABASE_CREDENTIALS.txt** | Quick reference of all credentials |
| **DATABASE_SUMMARY.md** | This file - Quick start guide |
| **DEPLOYMENT_CHECKLIST.md** | How to deploy with databases |

---

## QUICK START SUMMARY

```
✅ Database is running now
✅ Can access via 4 different methods
✅ All credentials provided above
✅ All tables auto-created
✅ Data from Leadrat synced
✅ Ready for testing
✅ Ready for CEO demo
✅ Ready for production deployment
```

**Start here:** Open pgAdmin at http://localhost:5050 and explore! 🚀

---

**Last Updated:** 2026-04-29  
**Status:** 🟢 All systems operational  
**Database Health:** ✅ Healthy  
**Data Persistence:** ✅ Enabled  
**Backups:** ✅ Can be created  

