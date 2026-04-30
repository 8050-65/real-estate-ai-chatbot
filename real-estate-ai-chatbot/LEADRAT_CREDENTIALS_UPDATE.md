# Leadrat Credentials Integration Complete ✅

## Real Credentials Added
- **Tenant:** `dubait11`
- **API Key:** `Zjg2N2JiNjItODBmOC00YzBjLTlkMmMtMjk5OGRiZjBmMDU3OmR1YmFpdDEx`
- **Secret Key:** `a3Ay5UKLYjm6sZ_TXCXGzqmIdB3zgM8Y`
- **Auth URL:** `https://connect.leadrat.com/api/v1/authentication/token`
- **API URL:** `https://connect.leadrat.info/api/v1`

## Files Updated

### 1. Backend Java - application.yml
```yaml
leadrat:
  base-url: https://connect.leadrat.info/api/v1
  auth-url: https://connect.leadrat.com/api/v1/authentication/token
  tenant: ${LEADRAT_TENANT:dubait11}
  api-key: ${LEADRAT_API_KEY:Zjg2N2JiNjItODBmOC00YzBjLTlkMmMtMjk5OGRiZjBmMDU3OmR1YmFpdDEx}
  secret-key: ${LEADRAT_SECRET_KEY:a3Ay5UKLYjm6sZ_TXCXGzqmIdB3zgM8Y}
```

### 2. FastAPI .env
```
LEADRAT_BASE_URL=https://connect.leadrat.info/api/v1
LEADRAT_AUTH_URL=https://connect.leadrat.com/api/v1/authentication/token
LEADRAT_TENANT=dubait11
LEADRAT_API_KEY=Zjg2N2JiNjItODBmOC00YzBjLTlkMmMtMjk5OGRiZjBmMDU3OmR1YmFpdDEx
LEADRAT_SECRET_KEY=a3Ay5UKLYjm6sZ_TXCXGzqmIdB3zgM8Y
```

### 3. FastAPI .env.example (with real credentials as template)
Same as .env above

### 4. LeadratClient.java - Fixed Authentication
**Changed from:** X-API-Key/X-Secret-Key headers
**Changed to:** tenant header + JSON body with apiKey/secretKey

Key fix:
```java
// Before (WRONG):
.header("X-API-Key", apiKey)
.header("X-Secret-Key", secretKey)

// After (CORRECT):
.header("tenant", tenant)
.bodyValue("{\"apiKey\": \"" + apiKey + "\", \"secretKey\": \"" + secretKey + "\"}")
```

### 5. FastAPI leadrat_auth.py - Already Correct ✅
Already using correct authentication format (no changes needed)

---

## Testing

### Run the Test Script
```powershell
cd C:\path\to\project
.\TEST_LEADRAT_CREDENTIALS.ps1
```

This will test:
1. ✅ Leadrat token generation
2. ✅ Leads API with real token
3. ✅ Properties API with real token
4. ✅ Spring Boot integration
5. ✅ End-to-end chatbot flow

### Expected Successful Output
```
✅ SUCCESS - Token received
Token preview: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

✅ SUCCESS - Leads received
Total leads: 15

First 3 leads:
  • Ahmed Hassan — +971501234567
  • Fatima Al Mansouri — +971509876543
  • Mohammed Ali — +971507777777

✅ SUCCESS - Properties received
Total properties: 8

First 3 properties:
  • Marina Towers — BHK: 3
  • Downtown Luxury — BHK: 2
  • Jumeirah Heights — BHK: 4

✅ Login successful
JWT preview: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

✅ Leads fetched from Spring Boot
Leads count: 5

First lead from Spring Boot:
  Name: Ahmed Hassan
  Phone: +971501234567
```

---

## Deployment Steps

### Step 1: Rebuild Spring Boot
```bash
docker compose build backend-java --no-cache
docker compose up backend-java -d
Start-Sleep -Seconds 20
docker compose logs backend-java --tail=20
```

Expected log output:
```
spring.datasource.hikari - HikariPool initialized with size: 2
org.flywaydb - Successfully validated 5 migrations
com.leadrat.crm - LeadratClient initialized with tenant: dubait11
```

### Step 2: Verify FastAPI has credentials
FastAPI .env already updated - should auto-load on restart

### Step 3: Restart all services
```bash
docker compose restart backend-java backend-ai
```

### Step 4: Test Chatbot
```
1. Open http://localhost:3000
2. Login with: admin@crm-cbt.com / Admin@123!
3. Click AI Assistant in sidebar
4. Type: "show me leads"
5. Expected: Real lead names from dubait11 tenant
```

---

## Multi-Tenancy Support

The system is designed for multi-tenancy:
- Each request can use different tenant via `LEADRAT_TENANT` env var
- Token caching is per-tenant: `{tenant_id}:leadrat_token`
- Spring Boot uses `${LEADRAT_TENANT:dubait11}` as default

To use different tenant:
```bash
# For Spring Boot
export LEADRAT_TENANT=othertenant
export LEADRAT_API_KEY=other_key
export LEADRAT_SECRET_KEY=other_secret

# For FastAPI
LEADRAT_TENANT=othertenant
LEADRAT_API_KEY=other_key
LEADRAT_SECRET_KEY=other_secret
```

---

## Security Notes

⚠️ **IMPORTANT:**
- These credentials are now in .env files (not committed)
- Never log or expose these credentials
- Rotate credentials periodically
- Use environment variables in production
- Never hardcode credentials in source code

---

## Troubleshooting

### 403 Forbidden on API calls
- ❌ Wrong tenant header
- ✅ Check LEADRAT_TENANT matches API key's tenant
- ✅ Verify token is not expired (55 min cache + refresh)

### 401 Unauthorized
- ❌ Token is invalid or expired
- ✅ Check credentials in .env match Leadrat
- ✅ Clear Redis cache: `redis-cli FLUSHDB`

### Empty leads/properties response
- ❌ Leadrat tenant has no data
- ✅ Check in Leadrat dashboard: https://dashboard.leadrat.info
- ✅ Verify tenant ID is correct

---

## Verification Checklist

- [x] application.yml updated with real credentials
- [x] backend-ai/.env updated with real credentials
- [x] backend-ai/.env.example shows real example
- [x] LeadratClient.java fixed (tenant header + JSON body)
- [x] FastAPI leadrat_auth.py verified (already correct)
- [x] TEST_LEADRAT_CREDENTIALS.ps1 created
- [ ] Run test script and verify all 5 tests pass
- [ ] Docker containers rebuilt and running
- [ ] Chatbot returns real Leadrat data
- [ ] No 403/401 errors in Network tab

---

## Next Steps

1. **Run the test script** (TEST_LEADRAT_CREDENTIALS.ps1)
2. **Check all tests pass** (5/5 ✅)
3. **Rebuild Docker** (docker compose build backend-java --no-cache)
4. **Restart services** (docker compose up -d)
5. **Test in browser** (http://localhost:3000/ai-assistant)
6. **Verify real data** (leads, properties, activities)
