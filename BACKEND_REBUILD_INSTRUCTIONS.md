# Backend Rebuild Instructions - Critical Fix

## Issue Identified

**Problem:** Appointment scheduling fields are not being forwarded to Leadrat API
- Frontend sends: `scheduledDate` and `meetingOrSiteVisit`
- Backend logs show these fields are MISSING from the Leadrat API call
- Lead status updates successfully, but WITHOUT appointment scheduling details

**Root Cause:** Backend Java code has been modified but NOT recompiled into the Docker image

---

## What Changed

**File:** `backend-java/src/main/java/com/leadrat/crm/leadrat/LeadratClient.java`

**Changes made:**
1. Updated `updateLeadStatus()` method to pass through ALL fields from statusUpdate map
2. Explicitly include `scheduledDate` and `meetingOrSiteVisit` if provided
3. Added debug logging for appointment scheduling

**File:** `backend-java/src/main/java/com/leadrat/crm/lead/LeadService.java`

**Changes made:**
1. Updated `updateLeadStatus()` method to return minimal LeadDto with ID
2. Fixes the empty data response issue

---

## How to Rebuild

### Option 1: Rebuild Docker Image (Recommended for Production)

```bash
# Stop the backend service
docker-compose down backend-java

# Rebuild the Docker image with latest source code
docker-compose up --build backend-java
```

**Time:** ~2-5 minutes (depends on Maven build speed)
**Result:** New backend container with compiled code changes

### Option 2: Manual Maven Build (if Option 1 doesn't work)

```bash
# Go to backend-java directory
cd backend-java

# Clean and compile
mvn clean compile

# Package
mvn package -DskipTests

# Restart Docker
docker-compose restart backend-java
```

---

## Verification After Rebuild

After rebuilding, test with this script:

```bash
#!/bin/bash

# Get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm-cbt.com","password":"Admin@123!"}' \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

# Send appointment request
curl -s -X PUT "http://localhost:3000/api/v1/leads/5822f6c5-f504-426f-a1f9-967ddea10455/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "id": "5822f6c5-f504-426f-a1f9-967ddea10455",
    "leadStatusId": "ba8fbec4-9322-438f-a745-5dfae2ee078d",
    "scheduledDate": "2026-04-30T10:00:00Z",
    "meetingOrSiteVisit": 2,
    "notes": "Test",
    "IsNotesUpdated": true,
    "assignTo": "45abfce5-2746-42e6-bf66-ac7e00e75085",
    "currency": "INR",
    "addresses": [],
    "propertiesList": [],
    "projectsList": []
  }'

# Check backend logs
docker logs realestate_backend_java | grep "Lead status update payload" | tail -1
```

**Expected Log Output (AFTER rebuild):**
```
Lead status update payload: {...,"scheduledDate":"2026-04-30T10:00:00Z","meetingOrSiteVisit":2,...}
```

**Before Rebuild (Current):**
```
Lead status update payload: {...,"id":"5822f6c5...","leadStatusId":"ba8fbec4...","currency":"INR"...}
# NOTE: scheduledDate and meetingOrSiteVisit are MISSING
```

---

## Why This Happens

1. **Source Code Changes:**
   - `LeadratClient.java` modified to pass through appointment fields
   - `LeadService.java` modified to handle response correctly

2. **Docker Container:** 
   - Runs pre-compiled `app.jar` from earlier build
   - Changes to `.java` source files don't affect running container
   - JAR must be recompiled to include changes

3. **Docker Build Process:**
   - `docker-compose up --build` triggers Maven compilation
   - Creates new JAR with updated code
   - Deploys new container

---

## Expected Behavior After Fix

### Before Rebuild (Current Issue)
```
Frontend sends:
{
  "scheduledDate": "2026-04-30T10:00:00Z",
  "meetingOrSiteVisit": 2
}

Backend logs:
{
  "leadStatusId": "ba8fbec4...",
  "id": "5822f6c5..."
  // Missing scheduledDate and meetingOrSiteVisit!
}

Result in Leadrat: Status updated but NO appointment details saved
```

### After Rebuild (Correct Behavior)
```
Frontend sends:
{
  "scheduledDate": "2026-04-30T10:00:00Z",
  "meetingOrSiteVisit": 2
}

Backend logs:
{
  "scheduledDate": "2026-04-30T10:00:00Z",
  "meetingOrSiteVisit": 2,
  "leadStatusId": "ba8fbec4...",
  "id": "5822f6c5..."
  // All fields present!
}

Result in Leadrat: Status updated WITH appointment details
```

---

## Verification in Browser (After Rebuild)

1. Open chatbot: http://localhost:3000/ai-assistant
2. Type: `schedule site visit`
3. Follow the appointment scheduling flow
4. Click confirm
5. Check Leadrat CRM for the lead
   - Status should be "Site Visit Scheduled"
   - Appointment date/time should be visible
   - Notes should be saved

---

## Files Modified

```
backend-java/src/main/java/com/leadrat/crm/leadrat/LeadratClient.java
  ├─ updateLeadStatus() method
  │  └─ Now passes through scheduledDate and meetingOrSiteVisit

backend-java/src/main/java/com/leadrat/crm/lead/LeadService.java
  ├─ updateLeadStatus() method
  │  └─ Now returns minimal LeadDto with ID instead of trying to parse empty response
```

---

## Troubleshooting Rebuild Issues

### Issue 1: Docker Build Fails
**Error:** `mvn: command not found`

**Solution:** Ensure Docker has Maven image available:
```bash
docker-compose build --pull backend-java
```

### Issue 2: Takes Too Long
**Normal:** First build takes 2-5 minutes (downloads dependencies)

**Speed up subsequent builds:** Dependencies are cached
```bash
# Clear cache if needed (aggressive option)
docker system prune -a
docker-compose up --build backend-java
```

### Issue 3: Port Already in Use
**Error:** `Port 8080 already in use`

**Solution:**
```bash
docker-compose down
docker-compose up backend-java
```

---

## Final Checklist

- [ ] Modified `LeadratClient.java` (scheduledDate/meetingOrSiteVisit fields added)
- [ ] Modified `LeadService.java` (response parsing fixed)
- [ ] Ran `docker-compose down backend-java`
- [ ] Ran `docker-compose up --build backend-java`
- [ ] Verified backend is HEALTHY: `docker-compose ps`
- [ ] Tested appointment scheduling in browser
- [ ] Verified appointment details in Leadrat CRM

---

## Production Readiness

After rebuild and verification:
1. ✅ All appointment scheduling fields forwarded to Leadrat
2. ✅ Lead status updates with appointment details
3. ✅ Frontend chatbot fully integrated with Leadrat CRM
4. ✅ Ready for CEO demo

**Est. Rebuild Time:** 5 minutes  
**Est. Verification Time:** 5 minutes  
**Total:** ~10 minutes  

---

**Next Step:** Run the rebuild, then test in your browser!
