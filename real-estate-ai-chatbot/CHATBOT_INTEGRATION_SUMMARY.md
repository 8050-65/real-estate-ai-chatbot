# AI Assistant - Leadrat API Integration Summary

## Overview
The AI Assistant (ChatInterface) has been updated to call **real Leadrat APIs** via FastAPI proxy endpoints instead of non-existent local Spring Boot endpoints.

## Architecture

```
Frontend (ChatInterface)
    ↓
fastapi-client.ts (http://localhost:8000)
    ↓
FastAPI Routes (/api/v1/leads, /api/v1/properties, /api/v1/projects)
    ↓
leadrat_leads.py Functions (list_leads, list_properties, list_projects)
    ↓
Real Leadrat APIs (https://connect.leadrat.info/api/v1/...)
```

## Files Changed

### 1. **backend-ai/app/main.py**
- **Added 3 new FastAPI routes:**
  - `GET /api/v1/leads` → calls `list_leads()`
  - `GET /api/v1/properties` → calls `list_properties()`
  - `GET /api/v1/projects` → calls `list_projects()`
- Each route accepts: `tenant_id`, `search`, `page`, `size` parameters
- Routes return paginated data with success/error handling
- Calls real Leadrat APIs internally via leadrat_leads.py functions

### 2. **frontend/lib/fastapi-client.ts** (NEW FILE)
- Created Axios client for FastAPI (http://localhost:8000)
- Includes request/response logging for debugging
- No JWT authentication needed (FastAPI handles Leadrat auth internally)
- Reads `NEXT_PUBLIC_FASTAPI_URL` from environment

### 3. **frontend/components/ai/ChatInterface.tsx**
- **Updated imports:**
  - Kept `api` for Spring Boot endpoints (activities/analytics)
  - Added `fastApiClient` for Leadrat API endpoints
  
- **Updated callLeadratAPI() function:**
  - Gets `tenantId` from `localStorage.getItem('tenantId')` or defaults to 'dubait11'
  - Lead intent: calls `fastApiClient.get('/api/v1/leads')`
  - Property intent: calls `fastApiClient.get('/api/v1/properties')`
  - Project intent: calls `fastApiClient.get('/api/v1/projects')`
  - Visit intent: still calls Spring Boot `/api/v1/activities`
  - Analytics intent: still calls Spring Boot `/api/v1/analytics/query`

### 4. **frontend/.env.local**
- Added `NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000`
- Existing `NEXT_PUBLIC_API_URL=http://localhost:8080` for Spring Boot

## Testing Checklist

### Setup
1. Ensure backend services are running:
   ```bash
   docker compose up backend-java backend-ai postgres redis
   ```

2. Frontend is running on port 3000

### Test Flow
1. **Login** to the dashboard (admin@crm-cbt.com / Admin@123!)
2. **Navigate to AI Assistant** page
3. **Test commands** and verify Network tab:

   | Test | Expected Network Call | Expected Response |
   |------|---|---|
   | "Show leads" | GET http://localhost:8000/api/v1/leads | List of leads from Leadrat |
   | "Show properties" | GET http://localhost:8000/api/v1/properties | List of properties from Leadrat |
   | "Show projects" | GET http://localhost:8000/api/v1/projects | List of projects from Leadrat |
   | "Upcoming visits" | GET http://localhost:8080/api/v1/activities | Activities from Spring Boot |

### Tenant Configuration
To test with different tenants:

**Option 1: Browser Console**
```javascript
localStorage.setItem('tenantId', 'prdblack');
location.reload();
```

**Option 2: Update Default in Code**
- Edit `backend-ai/app/main.py` line 133: change `tenant_id: str = "dubait11"`
- Edit `frontend/components/ai/ChatInterface.tsx` line 49: change default in localStorage.getItem()

## Key URLs

| Service | Port | Endpoint |
|---------|------|----------|
| **Spring Boot** (Activities/Analytics) | 8080 | http://localhost:8080/api/v1/activities |
| **FastAPI** (Leadrat proxy) | 8000 | http://localhost:8000/api/v1/leads |
| **Leadrat Auth** | - | https://connect.leadrat.com/api/v1/authentication/token |
| **Leadrat API** | - | https://connect.leadrat.info/api/v1/lead |
| **Leadrat API** | - | https://connect.leadrat.info/api/v1/property |
| **Leadrat API** | - | https://connect.leadrat.info/api/v1/project/all |

## Response Format

FastAPI routes return standardized response:
```json
{
  "success": true,
  "data": [
    { "id": "...", "name": "...", ... },
    ...
  ],
  "totalCount": 10,
  "page": 1,
  "size": 5
}
```

ChatInterface parses: `response.data?.data` (the items array)

## Error Handling

- If Leadrat API call fails: returns friendly error message
- Console logs detailed error for debugging
- 401/403/404/500 errors handled gracefully
- Token availability checked before API calls

## Next Steps (Not Yet Implemented)

1. **Configurable Tenant UI** - Add dropdown to select tenant in dashboard
2. **Lead Status Endpoints** - GET/PUT endpoints for lead status
3. **Property Search Filters** - BHK type, price range, location filters
4. **Project Details** - Additional project information endpoints
5. **Activity Management** - Create/update/delete activities via FastAPI
6. **Analytics Queries** - Natural language query endpoint
7. **Conversation History** - Persist chat conversations to database

## Debugging

**Enable detailed logging:**
```javascript
// In browser console
localStorage.setItem('debug', 'true');
location.reload();
```

**Check Network tab for:**
- Request URL should be `http://localhost:8000/api/v1/...` (NOT 8080)
- Request includes `tenant_id` query parameter
- Response includes `success: true` and `data` array
- Response time typically 1-3 seconds (Leadrat API call time)

**Check Console for:**
- `[FastAPI] GET /api/v1/leads` log entries
- `[ChatInterface] Token available: true`
- `[ChatInterface] Calling API for intent: lead`
- No 403 Forbidden errors

---

**Status:** ✅ Ready for manual testing  
**Last Updated:** 2026-04-27  
**Tested By:** Not yet tested
