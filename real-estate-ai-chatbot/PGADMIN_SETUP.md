# pgAdmin Connection Setup

## Quick Start

1. **Open pgAdmin in browser:**
   ```
   http://localhost:5050
   ```

2. **Login with:**
   - Email: `admin@crm.com`
   - Password: `admin123`

## Add PostgreSQL Connection

### Method 1: Using GUI (Easiest)

After login:
1. Right-click **Servers** in left sidebar
2. Click **Register → Server**
3. Fill in **General tab:**
   ```
   Name: CRM Dev DB
   ```

4. Fill in **Connection tab:**
   ```
   Hostname/address: localhost
   Port: 5432
   Maintenance database: crm_cbt_db_dev
   Username: rootuser
   Password: 123Pa$$word!
   Save password: ✓ (checked)
   ```

5. Click **Save**

### Method 2: Command Line (For Automation)

pgAdmin can be configured via environment variables in docker-compose.yml:
```yaml
pgadmin:
  environment:
    PGADMIN_DEFAULT_EMAIL: admin@crm.com
    PGADMIN_DEFAULT_PASSWORD: admin123
    PGADMIN_CONFIG_SERVER_DEFAULT_NAME: CRM Dev DB
    PGADMIN_CONFIG_SERVER_DEFAULT_HOST: postgres
    PGADMIN_CONFIG_SERVER_DEFAULT_PORT: 5432
    PGADMIN_CONFIG_SERVER_DEFAULT_USERNAME: rootuser
    PGADMIN_CONFIG_SERVER_DEFAULT_PASSWORD: "123Pa$$word!"
    PGADMIN_CONFIG_SERVER_DEFAULT_MAINTENANCE_DB: crm_cbt_db_dev
```

## Database Connection Details

| Property | Value |
|----------|-------|
| **Hostname** | localhost |
| **Port** | 5432 |
| **Database (DEV)** | crm_cbt_db_dev |
| **Database (QA)** | crm_cbt_db_qa |
| **Database (PRD)** | crm_cbt_db_prd |
| **Username** | rootuser |
| **Password** | 123Pa$$word! |

## After Connection

You'll see:
- **Databases** folder containing all 3 environments
- **public** schema in each database
- Tables created by Flyway migrations (when Spring Boot starts)

## Common Tasks

### Query a database
1. Click **Databases → crm_cbt_db_dev**
2. Click **Tools → Query Tool**
3. Write SQL:
   ```sql
   SELECT * FROM tenants;
   SELECT * FROM users;
   SELECT tablename FROM pg_tables WHERE schemaname='public';
   ```

### View migration history
```sql
SELECT * FROM flyway_schema_history ORDER BY success DESC;
```

### Monitor tables
1. Right-click database → **Refresh**
2. Navigate to **Schemas → public → Tables**
3. See all 9 tables created by migrations

## Troubleshooting

### "Cannot connect to server"
- Verify PostgreSQL is running: `docker compose ps`
- Check port 5432 is open: `docker ps | grep postgres`
- Try restarting pgAdmin: `docker compose restart pgadmin`

### "Password authentication failed"
- Verify username is `rootuser` (not `postgres`)
- Verify password is `123Pa$$word!` (with escaped $)
- Verify you're connecting to correct database

### "Maintenance database not found"
- Make sure database exists: `docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c "\l"`
- Try creating it: `docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c "CREATE DATABASE crm_cbt_db_dev;"`

## Web Interface

After successful connection, you can:
- ✅ Browse tables and schemas
- ✅ Write and execute SQL queries
- ✅ View query results and performance
- ✅ Monitor database properties
- ✅ Export/import data
- ✅ Create backups

## Next Steps

When Spring Boot backend starts:
1. It will run Flyway migrations automatically
2. All 9 tables will be created in `crm_cbt_db_dev`:
   - tenants
   - users
   - bot_configs
   - whatsapp_sessions
   - conversation_logs
   - site_visits
   - ai_query_logs
   - saved_reports
   - analytics_summary

3. You can view them in pgAdmin:
   ```
   Servers → CRM Dev DB → Databases → crm_cbt_db_dev → Schemas → public → Tables
   ```
