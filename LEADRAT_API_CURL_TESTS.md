# Leadrat API - cURL Test Commands

Use these commands to test the Leadrat API directly with your chatbot backend.

---

## 1. Get Auth Token (From Your Backend)

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm-cbt.com","password":"Admin@123!"}' \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

echo "Token: $TOKEN"
```

**Or if you want to see the full response:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm-cbt.com","password":"Admin@123!"}'
```

---

## 2. Create a Lead (With Assignment)

```bash
TOKEN="your_token_here"

curl -X POST http://localhost:3000/api/v1/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name":"Vikram Curl Test",
    "phoneNumber":"+919876543210",
    "whatsappNumber":"+919876543210"
  }' | jq .
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "some-uuid-here",
    "name": "Vikram Curl Test",
    "phoneNumber": "+919876543210"
  }
}
```

**Save the ID for the next command:**
```bash
LEAD_ID=$(curl -s -X POST http://localhost:3000/api/v1/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Lead","phoneNumber":"+919876543210"}' \
  | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

echo "Lead ID: $LEAD_ID"
```

---

## 3. Get Available Lead Statuses

```bash
TOKEN="your_token_here"

curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/leads/statuses | jq '.data[] | {id, name}'
```

**Or without jq:**
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/leads/statuses
```

**Look for these status IDs:**
- `ba8fbec4-9322-438f-a745-5dfae2ee078d` → Site Visit Scheduled
- `54bd52ee-914f-4a78-b919-cd99be9dee88` → Callback
- `1c204d66-0f0e-4718-af99-563dad02a39b` → Meeting Scheduled

---

## 4. Schedule Site Visit Appointment

```bash
TOKEN="your_token_here"
LEAD_ID="36a19a02-f9d5-4bc4-a8b4-f83d6982759c"

curl -X PUT "http://localhost:3000/api/v1/leads/$LEAD_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "id":"'"$LEAD_ID"'",
    "leadStatusId":"ba8fbec4-9322-438f-a745-5dfae2ee078d",
    "scheduledDate":"2026-04-30T10:00:00Z",
    "meetingOrSiteVisit":2,
    "notes":"Site visit scheduled via curl",
    "IsNotesUpdated":true,
    "assignTo":"45abfce5-2746-42e6-bf66-ac7e00e75085",
    "currency":"INR",
    "addresses":[],
    "propertiesList":[],
    "projectsList":[]
  }' | jq .
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "36a19a02-f9d5-4bc4-a8b4-f83d6982759c"
  }
}
```

---

## 5. Schedule Callback

```bash
TOKEN="your_token_here"
LEAD_ID="36a19a02-f9d5-4bc4-a8b4-f83d6982759c"

curl -X PUT "http://localhost:3000/api/v1/leads/$LEAD_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "id":"'"$LEAD_ID"'",
    "leadStatusId":"54bd52ee-914f-4a78-b919-cd99be9dee88",
    "scheduledDate":"2026-04-29T14:00:00Z",
    "meetingOrSiteVisit":0,
    "notes":"Callback scheduled",
    "IsNotesUpdated":true,
    "assignTo":"45abfce5-2746-42e6-bf66-ac7e00e75085",
    "currency":"INR",
    "addresses":[],
    "propertiesList":[],
    "projectsList":[]
  }' | jq .
```

---

## 6. Schedule Meeting

```bash
TOKEN="your_token_here"
LEAD_ID="36a19a02-f9d5-4bc4-a8b4-f83d6982759c"

curl -X PUT "http://localhost:3000/api/v1/leads/$LEAD_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "id":"'"$LEAD_ID"'",
    "leadStatusId":"1c204d66-0f0e-4718-af99-563dad02a39b",
    "scheduledDate":"2026-05-01T15:00:00Z",
    "meetingOrSiteVisit":1,
    "notes":"Meeting scheduled",
    "IsNotesUpdated":true,
    "assignTo":"45abfce5-2746-42e6-bf66-ac7e00e75085",
    "currency":"INR",
    "addresses":[],
    "propertiesList":[],
    "projectsList":[]
  }' | jq .
```

---

## 7. Search for Leads

```bash
TOKEN="your_token_here"

curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/leads?search=CEO&page=0&size=10" | jq '.data[] | {id, name, phoneNumber, status}'
```

---

## 8. Complete End-to-End Test (All in One Script)

```bash
#!/bin/bash

# Get token
echo "=== Getting auth token ==="
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm-cbt.com","password":"Admin@123!"}' \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo "✅ Token obtained: ${TOKEN:0:50}..."

# Create lead
echo -e "\n=== Creating lead ==="
LEAD_ID=$(curl -s -X POST http://localhost:3000/api/v1/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name":"Curl Test Lead",
    "phoneNumber":"+919876543210"
  }' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "✅ Lead created: $LEAD_ID"

# Get statuses
echo -e "\n=== Getting lead statuses ==="
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/leads/statuses | grep -o '"name":"[^"]*"' | head -3

# Schedule appointment
echo -e "\n=== Scheduling Site Visit ==="
curl -s -X PUT "http://localhost:3000/api/v1/leads/$LEAD_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "leadStatusId":"ba8fbec4-9322-438f-a745-5dfae2ee078d",
    "scheduledDate":"2026-04-30T10:00:00Z",
    "meetingOrSiteVisit":2,
    "notes":"Test appointment",
    "IsNotesUpdated":true
  }' | grep -o '"success":[^,]*'

echo -e "\n✅ Test complete! Check Leadrat CRM for the new lead."
```

---

## Important Notes

### Headers Required
```bash
-H "Content-Type: application/json"
-H "Authorization: Bearer $TOKEN"
```

### Date Format
- Must be ISO 8601: `2026-04-30T10:00:00Z`
- Include timezone (Z for UTC)

### Appointment Types
- `meetingOrSiteVisit: 0` = Callback
- `meetingOrSiteVisit: 1` = Meeting
- `meetingOrSiteVisit: 2` = Site Visit

### Lead Assignment
- Always include: `"assignTo":"45abfce5-2746-42e6-bf66-ac7e00e75085"`
- This is required for status updates to work

### Verify in Backend Logs
```bash
docker logs realestate_backend_java | grep "Lead status update payload" | tail -1
```

Should show:
```
"scheduledDate":"2026-04-30T10:00:00Z","meetingOrSiteVisit":2
```

---

## Debugging

### If you get 401 Unauthorized
- Token expired or invalid
- Get a new token

### If you get 404 Lead Not Found
- Lead ID doesn't exist
- Use correct lead ID from creation response

### If you get 400 Bad Request
- Check JSON format (proper quotes, commas)
- Check all required fields are present
- Check date format is ISO 8601

### If status doesn't update
- Lead must be assigned (check `assignTo` field)
- Check backend logs for error message
- Verify status ID exists (get statuses first)

---

## Copy-Paste Ready Commands

### Quick Test (Get Token + Create Lead + Update Status)
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"admin@crm-cbt.com","password":"Admin@123!"}' | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4) && LEAD_ID=$(curl -s -X POST http://localhost:3000/api/v1/leads -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"name":"Test","phoneNumber":"+919876543210"}' | grep -o '"id":"[^"]*"' | cut -d'"' -f4) && curl -s -X PUT "http://localhost:3000/api/v1/leads/$LEAD_ID/status" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"leadStatusId":"ba8fbec4-9322-438f-a745-5dfae2ee078d","scheduledDate":"2026-04-30T10:00:00Z","meetingOrSiteVisit":2,"notes":"Test"}' && echo -e "\n✅ Test complete!"
```

---

Good luck! 🚀
