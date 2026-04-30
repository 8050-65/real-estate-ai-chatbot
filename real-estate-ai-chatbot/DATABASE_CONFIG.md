# DATABASE CONFIGURATION & CREDENTIALS
## Real Estate AI Chatbot - Multi-Environment Setup

**Current Status:** Single database instance (DEV environment)  
**Recommendation:** Separate databases for QA, Dev, Stage, Production  

---

## CURRENT DATABASE SETUP

### PostgreSQL Instance (Current)

**Container Name:** `crm-postgres`  
**Image:** `postgres:15-alpine`  
**Status:** ✅ Running

#### Connection Details

| Parameter | Value |
|-----------|-------|
| **Host** | localhost (local) / postgres (docker container) |
| **Port** | 5432 |
| **Database** | crm_cbt_db_dev |
| **Username** | rootuser |
| **Password** | 123Pa$$word! |
| **Superuser** | Yes |
| **Volume** | postgres_data (persists data) |

#### Connection Strings

**For Local Machine (psql):**
```bash
psql -h localhost -U rootuser -d crm_cbt_db_dev -p 5432
```

**For Docker Containers:**
```
postgresql://rootuser:123Pa$$word!@postgres:5432/crm_cbt_db_dev
```

**For Spring Boot:**
```
jdbc:postgresql://postgres:5432/crm_cbt_db_dev
```

**For FastAPI (SQLAlchemy):**
```
postgresql+asyncpg://rootuser:123Pa$$word!@postgres:5432/crm_cbt_db_dev
```

---

## PGADMIN WEB INTERFACE

Access database visually with pgAdmin:

**URL:** http://localhost:5050  
**Email:** admin@crm.com  
**Password:** admin123

### Steps to Connect pgAdmin to PostgreSQL:

1. Visit http://localhost:5050
2. Login with admin@crm.com / admin123
3. Click "Add New Server"
4. **Name:** "CRM Database"
5. **Connection Tab:**
   - Host name/address: `postgres`
   - Port: `5432`
   - Maintenance database: `crm_cbt_db_dev`
   - Username: `rootuser`
   - Password: `123Pa$$word!`
6. Click "Save"

Now you can browse tables, run queries, manage data visually.

---

## DATABASE SCHEMA

### Current Tables (Auto-Created by Migrations)

The database is automatically initialized with:

```
✅ users - User accounts and authentication
✅ leads - Lead information from Leadrat CRM
✅ activities - User activity logging
✅ lead_statuses - Status tracking
✅ conversations - Chat conversation history
✅ properties - Real estate properties
✅ projects - Development projects
✅ audit_logs - Audit trail
✅ sync_metadata - Leadrat sync tracking
✅ tenant_configs - Multi-tenant configuration
✅ conversation_memory - Chat memory storage
✅ enhanced_sync_logs - Detailed sync logging
```

View all tables:
```bash
# Connect with psql
psql -h localhost -U rootuser -d crm_cbt_db_dev

# List tables
\dt

# View table structure
\d users
\d leads
\d activities
```

---

## REDIS CACHE

**Container Name:** `realestate_redis`  
**Image:** `redis:7-alpine`

| Parameter | Value |
|-----------|-------|
| **Host** | localhost (local) / redis (docker) |
| **Port** | 6379 |
| **Password** | None (default) |
| **Database** | 0 |

### Connection String
```
redis://redis:6379/0
```

### Access Redis CLI

```bash
# From your laptop
redis-cli -h localhost -p 6379

# Or via docker
docker exec -it realestate_redis redis-cli

# Test connection
ping  # Should return PONG

# View all keys
keys *

# Get a key
get <key-name>

# Monitor traffic
monitor
```

---

## MULTI-ENVIRONMENT SETUP (RECOMMENDED)

### Current vs. Recommended

**Current (Single Database):**
```
┌─ Development ─┐
│   (testing)   │
├───────────────┤
│  crm_cbt_db   │  ← Single database for all
└───────────────┘
```

**Recommended (Separate Databases):**
```
┌──────────────────────────────────────────┐
│          PostgreSQL Server               │
├──────────────────────────────────────────┤
│                                          │
│  ┌──────────────┬──────────────┐         │
│  │ crm_cbt_db_dev             │         │
│  │ (Development)              │         │
│  │ rootuser / dev_pass        │         │
│  └──────────────┴──────────────┘         │
│                                          │
│  ┌──────────────┬──────────────┐         │
│  │ crm_cbt_db_qa              │         │
│  │ (QA Testing)               │         │
│  │ qa_user / qa_pass          │         │
│  └──────────────┴──────────────┘         │
│                                          │
│  ┌──────────────┬──────────────┐         │
│  │ crm_cbt_db_stage           │         │
│  │ (Staging)                  │         │
│  │ stage_user / stage_pass    │         │
│  └──────────────┴──────────────┘         │
│                                          │
│  ┌──────────────┬──────────────┐         │
│  │ crm_cbt_db_prod            │         │
│  │ (Production)               │         │
│  │ prod_user / prod_pass      │         │
│  └──────────────┴──────────────┘         │
│                                          │
└──────────────────────────────────────────┘
```

---

## PROPOSED MULTI-ENVIRONMENT CREDENTIALS

### Development (Current)
```bash
DB_HOST=postgres
DB_PORT=5432
DB_NAME=crm_cbt_db_dev
DB_USER=dev_user
DB_PASSWORD=Dev@123!Secure
DB_SCHEMA=public
```

### QA Environment
```bash
DB_HOST=postgres  # or qa-db.internal
DB_PORT=5432
DB_NAME=crm_cbt_db_qa
DB_USER=qa_user
DB_PASSWORD=QA@123!Secure
DB_SCHEMA=public
```

### Staging Environment
```bash
DB_HOST=postgres  # or stage-db.internal
DB_PORT=5432
DB_NAME=crm_cbt_db_stage
DB_USER=stage_user
DB_PASSWORD=Stage@123!Secure
DB_SCHEMA=public
```

### Production Environment
```bash
DB_HOST=db-prod.internal  # Different server recommended
DB_PORT=5432
DB_NAME=crm_cbt_db_prod
DB_USER=prod_user
DB_PASSWORD=Prod@SecureRandomPassword123!
DB_SCHEMA=public
```

---

## HOW TO SWITCH ENVIRONMENTS

### Method 1: Using Environment Variables (Recommended)

Update your `.env` file:

```bash
# .env.dev
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/crm_cbt_db_dev
SPRING_DATASOURCE_USERNAME=dev_user
SPRING_DATASOURCE_PASSWORD=Dev@123!Secure
ENVIRONMENT=development
```

```bash
# .env.qa
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/crm_cbt_db_qa
SPRING_DATASOURCE_USERNAME=qa_user
SPRING_DATASOURCE_PASSWORD=QA@123!Secure
ENVIRONMENT=qa
```

```bash
# .env.stage
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/crm_cbt_db_stage
SPRING_DATASOURCE_USERNAME=stage_user
SPRING_DATASOURCE_PASSWORD=Stage@123!Secure
ENVIRONMENT=staging
```

```bash
# .env.prod
SPRING_DATASOURCE_URL=jdbc:postgresql://db-prod.internal:5432/crm_cbt_db_prod
SPRING_DATASOURCE_USERNAME=prod_user
SPRING_DATASOURCE_PASSWORD=Prod@SecureRandomPassword123!
ENVIRONMENT=production
```

### Method 2: Docker Compose Profiles (Advanced)

```bash
# Start only dev services
docker compose --profile dev up -d

# Start only qa services
docker compose --profile qa up -d

# Start only prod services
docker compose --profile prod up -d
```

### Method 3: Switch at Runtime

```bash
# Set environment variable before starting
export SPRING_PROFILE=qa
docker compose up -d

# Or in docker-compose.yml
environment:
  SPRING_PROFILE: ${SPRING_PROFILE:-dev}
```

---

## DATABASE BACKUPS

### Backup Current Database

**Command:**
```bash
# Full database backup
docker exec crm-postgres pg_dump -U rootuser -d crm_cbt_db_dev > backup_dev_$(date +%Y%m%d_%H%M%S).sql

# With compression
docker exec crm-postgres pg_dump -U rootuser -d crm_cbt_db_dev | gzip > backup_dev_$(date +%Y%m%d_%H%M%S).sql.gz
```

**Save backup location:** `/backups/database/`

### Restore from Backup

```bash
# Restore database
docker exec -i crm-postgres psql -U rootuser crm_cbt_db_dev < backup_dev_20260429_120000.sql

# Restore from compressed backup
gunzip < backup_dev_20260429_120000.sql.gz | docker exec -i crm-postgres psql -U rootuser crm_cbt_db_dev
```

### Backup All Environments

```bash
#!/bin/bash
# backup-all-dbs.sh

BACKUP_DIR="/backups/database"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup all databases
for DB in crm_cbt_db_dev crm_cbt_db_qa crm_cbt_db_stage crm_cbt_db_prod; do
  echo "Backing up $DB..."
  docker exec crm-postgres pg_dump -U rootuser -d $DB | gzip > $BACKUP_DIR/backup_${DB}_${TIMESTAMP}.sql.gz
  echo "✅ $DB backed up"
done

echo "All databases backed up to $BACKUP_DIR"
```

---

## DATABASE ACCESS METHODS

### Method 1: psql CLI (Recommended for Dev)

```bash
# Connect directly
psql -h localhost -U rootuser -d crm_cbt_db_dev -p 5432

# Once connected:
\dt              # List tables
\d users         # Describe table structure
SELECT * FROM users;  # Query data
\q               # Quit
```

### Method 2: pgAdmin Web UI (Visual)

1. Visit http://localhost:5050
2. Login: admin@crm.com / admin123
3. Browse tables visually
4. Run SQL queries in Query Tool
5. Export/Import data

### Method 3: DBeaver (Desktop App)

Download free from https://dbeaver.io/

**Connection settings:**
- Server Host: localhost
- Database: crm_cbt_db_dev
- Username: rootuser
- Password: 123Pa$$word!
- Port: 5432
- Driver: PostgreSQL

### Method 4: Spring Boot Actuator

Query database health via API:
```bash
curl http://localhost:8080/actuator/health/db
```

Response:
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "PostgreSQL",
        "validationQuery": "isValid()"
      }
    }
  }
}
```

### Method 5: FastAPI Database Health

```bash
curl http://localhost:8000/health
```

---

## COMMON DATABASE QUERIES

### User Authentication
```sql
-- View all users
SELECT id, email, password_hash, role, created_at FROM users;

-- Reset user password (hash needed)
UPDATE users SET password_hash = 'new_hash' WHERE email = 'user@example.com';
```

### Lead Management
```sql
-- View all leads
SELECT id, name, email, phone, status, created_at FROM leads ORDER BY created_at DESC;

-- Leads created today
SELECT * FROM leads WHERE DATE(created_at) = CURRENT_DATE;

-- Leads by status
SELECT status, COUNT(*) as count FROM leads GROUP BY status;

-- Most recent leads
SELECT name, phone, status, created_at FROM leads ORDER BY created_at DESC LIMIT 10;
```

### Activity Logging
```sql
-- Recent activities
SELECT user_id, action, details, created_at FROM activities ORDER BY created_at DESC LIMIT 20;

-- Activities by user
SELECT * FROM activities WHERE user_id = 'user-id' ORDER BY created_at DESC;
```

### Sync Metadata (Leadrat Sync)
```sql
-- Last sync status
SELECT * FROM sync_metadata ORDER BY last_sync_time DESC LIMIT 1;

-- Sync history
SELECT * FROM sync_metadata ORDER BY last_sync_time DESC LIMIT 10;
```

### Conversation History
```sql
-- All conversations
SELECT id, user_id, title, created_at FROM conversations ORDER BY created_at DESC;

-- Messages in conversation
SELECT * FROM conversation_messages WHERE conversation_id = 'conv-id' ORDER BY created_at;
```

---

## SECURITY BEST PRACTICES

### Current Issues (DEV) ⚠️
```
⚠️ Password in plain text in docker-compose.yml
⚠️ pgAdmin password simple
⚠️ No encryption at rest
⚠️ No backup encryption
⚠️ Port 5432 exposed to localhost only (OK)
```

### Recommendations for Production 🔒

1. **Use Secrets Management**
   ```bash
   # Use Docker Secrets or environment variables
   export POSTGRES_PASSWORD=$(aws secretsmanager get-secret-value --secret-id db-password)
   ```

2. **Enable SSL/TLS**
   ```yaml
   environment:
     PGSSLMODE: require
     PGSSLCERT: /run/secrets/client-cert.pem
   ```

3. **Network Isolation**
   ```bash
   # Don't expose PostgreSQL port to internet
   # Use only internal Docker network
   ports: []  # Don't expose port 5432
   ```

4. **Encryption at Rest**
   - Use encrypted EBS volumes (AWS)
   - Use encrypted file systems (Linux dm-crypt)
   - Enable PostgreSQL native encryption

5. **Backup Encryption**
   ```bash
   # Encrypt backups
   pg_dump ... | gpg --encrypt > backup.sql.gpg
   ```

6. **Regular Backups**
   - Daily automated backups
   - Store in secure location (S3, GCS)
   - Test restore procedures monthly

7. **Access Control**
   ```sql
   -- Limit user permissions
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO qa_user;
   GRANT SELECT, INSERT, UPDATE ON leads TO dev_user;
   -- No superuser for non-admin users
   ```

---

## TROUBLESHOOTING DATABASE ISSUES

### Connection Refused

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL
docker compose restart postgres

# Check logs
docker logs crm-postgres

# Test connection
docker exec crm-postgres pg_isready -U rootuser -d crm_cbt_db_dev
```

### Database Locked

```bash
# Check active connections
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c "SELECT * FROM pg_stat_activity;"

# Kill specific connection
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid <> pg_backend_pid();
```

### Disk Space Full

```bash
# Check table sizes
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c "
  SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# Vacuum to reclaim space
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c "VACUUM ANALYZE;"
```

### Migration Failed

```bash
# Check migration status
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c "SELECT * FROM schema_version;"

# View logs
docker logs realestate_backend_java | grep -i migration

# Rollback specific migration (careful!)
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c "DELETE FROM schema_version WHERE version = 5;"
```

---

## SUMMARY TABLE

| Environment | Database | User | Password | Host | Port |
|---|---|---|---|---|---|
| **DEV** | crm_cbt_db_dev | rootuser | 123Pa$$word! | localhost | 5432 |
| **QA** | crm_cbt_db_qa | qa_user | QA@123!Secure | postgres | 5432 |
| **STAGE** | crm_cbt_db_stage | stage_user | Stage@123!Secure | postgres | 5432 |
| **PROD** | crm_cbt_db_prod | prod_user | Prod@SecurePass! | db-prod | 5432 |

---

## QUICK ACCESS REFERENCE

### Access Development Database Right Now

```bash
# Via psql CLI
psql -h localhost -U rootuser -d crm_cbt_db_dev

# Via pgAdmin Web
# URL: http://localhost:5050
# Email: admin@crm.com
# Password: admin123

# Via Docker CLI
docker exec -it crm-postgres psql -U rootuser -d crm_cbt_db_dev

# View all tables
\dt

# View specific table
SELECT * FROM leads LIMIT 10;
```

---

**Status:** ✅ Single database instance running  
**Recommendation:** Implement multi-environment setup for QA/Stage/Prod  
**Next Action:** Follow [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md) for production database setup

