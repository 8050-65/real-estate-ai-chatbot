# Real Estate CRM API Endpoints

Complete reference of all available Spring Boot backend endpoints.

## Authentication

### Login
```
POST /api/v1/auth/login
Headers: Content-Type: application/json
Body: {
  "email": "admin@crm-cbt.com",
  "password": "Admin@123!"
}
Returns: { accessToken, user }
```

---

## Leads API (LeadController)

### ✅ List All Leads (NEW - FIXED)
```
GET /api/v1/leads?page=1&size=10
Returns: List<LeadDto>
Example response:
{
  "data": [
    {
      "id": "lead-123",
      "name": "Ahmed Hassan",
      "email": "ahmed@example.com",
      "phoneNumber": "+971501234567",
      "whatsappNumber": "+971501234567",
      "city": "Dubai",
      "stage": "interested",
      "status": "active",
      "budgetMin": "500000",
      "budgetMax": "2000000"
    }
  ]
}
```

### Get Single Lead
```
GET /api/v1/leads/{leadId}
Returns: LeadDto
```

### Search Properties  
```
GET /api/v1/leads/search/properties?query=2bhk
Returns: List<PropertyDto>
```

### Get Project
```
GET /api/v1/leads/projects/{projectId}
Returns: ProjectDto
```

---

## Activities API (ActivityController)

### ✅ List All Activities
```
GET /api/v1/activities?page=0&size=10
Returns: PageResponse<ActivityDto>
```

### Get Activities by Lead
```
GET /api/v1/activities/lead/{leadId}?page=0&size=10
Returns: PageResponse<ActivityDto>
```

### Create Activity
```
POST /api/v1/activities
Body: ActivityDto
Returns: ActivityDto
```

### Get Activity by ID
```
GET /api/v1/activities/{id}
Returns: ActivityDto
```

### Update Activity
```
PUT /api/v1/activities/{id}
Body: ActivityDto
Returns: ActivityDto
```

### Update Activity Status
```
PUT /api/v1/activities/{id}/status?status=completed
Returns: ActivityDto
```

### Delete Activity
```
DELETE /api/v1/activities/{id}
Returns: Void
```

---

## Analytics API (AnalyticsController)

### Get Daily Summary
```
GET /api/v1/analytics/summary?date=2026-04-27
Returns: AnalyticsSummaryDto
```

### Process Natural Language Query
```
POST /api/v1/analytics/nlq
Body: { "query": "how many leads this month" }
Returns: AnalyticsQueryDto
```

### Get Metrics by Date Range
```
GET /api/v1/analytics/metrics?startDate=2026-04-01&endDate=2026-04-30
Returns: Map<String, Object>
```

---

## Bot Configuration API (BotConfigController)

### Get Bot Config
```
GET /api/v1/bot-config
Returns: BotConfigDto
```

### Update Bot Config
```
PUT /api/v1/bot-config
Body: BotConfigDto
Returns: BotConfigDto
```

---

## Common Features

### Pagination
All list endpoints support:
- `page` (default: 0 or 1)
- `size` (default: 10)
- `sort` (optional)

Example:
```
GET /api/v1/activities?page=0&size=20&sort=createdAt,desc
```

### Error Responses
All endpoints return standardized ApiResponse:
```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

### Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized (login required)
- 403: Forbidden (permission denied)
- 404: Not Found
- 500: Server Error

---

## Chatbot API Integration

The chatbot (`ChatInterface`) calls these endpoints via `lib/api.ts`:

### When user says "show leads"
```
GET /api/v1/leads?page=1&size=5
Chatbot summarizes: "Found X leads: name, phone, status"
```

### When user says "show activities"
```
GET /api/v1/activities?page=0&size=10
Chatbot shows: "Upcoming activities: type, time, status"
```

### When user says "show properties"
```
GET /api/v1/leads/search/properties?query={extracted_term}
Chatbot shows: "Found X properties: title, BHK, price"
```

### When user asks analytics
```
GET /api/v1/analytics/summary?date=today
POST /api/v1/analytics/nlq with user query
Chatbot shows: Metrics and summary
```

---

## Testing with cURL

### Get all leads
```bash
curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:8080/api/v1/leads?page=1&size=5
```

### Get activities
```bash
curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:8080/api/v1/activities?page=0&size=10
```

### Get analytics summary
```bash
curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:8080/api/v1/analytics/summary
```

---

## Changes Made (April 27, 2026)

### ✅ FIXED: Missing GET /api/v1/leads endpoint
- Added `LeadratClient.getLeads(page, size)` - Calls Leadrat API
- Added `LeadService.getLeads(page, size)` - Processes response
- Added `LeadController.getLeads()` - Exposes REST endpoint

### ✅ FIXED: Error handling in ChatInterface
- Raw API errors no longer shown in chat
- Friendly error messages for user
- Console logs technical details for debugging
- 401/403/404/500 handled gracefully

### ✅ Added: Better error context
- API status code shown in console
- Request URL logged
- Intent type logged
- Error message preserved

---

## Swagger/OpenAPI

View all endpoints with descriptions:
```
http://localhost:8080/swagger-ui.html
```

---

## Notes for Future Development

1. **List Leads Pagination**: Currently uses Leadrat's pagination (page, size)
2. **Properties Search**: Uses keyword search, not full listing
3. **Activities**: Supports full CRUD via API
4. **Analytics**: NLQ endpoint processes natural language → SQL
5. **Multi-tenancy**: All endpoints use TenantContext.get() for tenant isolation

---

## Related Files
- Frontend: `frontend/lib/api.ts` - API client
- Frontend: `frontend/components/ai/ChatInterface.tsx` - Chatbot UI
- Backend: `backend-java/src/main/java/com/leadrat/crm/*/` - Controllers
