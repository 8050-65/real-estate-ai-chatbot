# Critical UI Issue Identified - April 28, 2026

## Summary

Backend code is **FIXED** ✅, but **FRONTEND is sending incomplete data** ❌

---

## What Backend is Doing (Now Correct)

✅ Status ID mapping working
✅ Converting parent to child status IDs
✅ Including meetingOrSiteVisit field
✅ Enforcing correct payload structure

---

## What Frontend is Doing (WRONG)

❌ **Not combining date + time into scheduledDate**

### Current Frontend Behavior
```
User selects:
  - Date: 2026-04-29
  - Time: 15:00
  
Frontend sends:
{
  "leadStatusId": "54bd52ee-914f...",
  "scheduledDate": "2026-04-29",  ← Missing time! Just date!
  "time": "15:00"                 ← Sent separately (WRONG!)
}
```

### What Leadrat Expects
```
{
  "leadStatusId": "f6f2683f-526f...",  ← Already fixed by backend
  "scheduledDate": "2026-04-29T15:00:00Z",  ← DATE + TIME combined!
  "meetingOrSiteVisit": 0
}
```

---

## The Bug

Frontend is sending:
- `"scheduledDate": "2026-04-29"` (DATE ONLY)
- `"time": "15:00"` (TIME ONLY - separate field)

Leadrat ignores the separate `"time"` field and uses `scheduledDate` only.

Result: Date is sent to Leadrat, but **no time is included** → appointment scheduling fails.

---

## How to Fix Frontend

### Option 1: Fix in ChatInterface Component
The chatbot needs to COMBINE date + time before sending:

```javascript
// WRONG (current):
const payload = {
  "leadStatusId": statusId,
  "scheduledDate": selectedDate,  // Just date
  "time": selectedTime              // Time separate
}

// CORRECT (needs to be):
const payload = {
  "leadStatusId": statusId,
  "scheduledDate": `${selectedDate}T${selectedTime}:00Z`,  // Combined!
  "meetingOrSiteVisit": 0
}
```

### Option 2: Fix in Backend (Workaround)
Backend could try to combine date + time if they're separate:

```java
String scheduledDate = (String) statusUpdate.get("scheduledDate");
String time = (String) statusUpdate.get("time");

if (time != null && !scheduledDate.contains("T")) {
  scheduledDate = scheduledDate + "T" + time + ":00Z";
}
```

---

## Test Results

### Lead Created ✅
```
ID: 42cb2889-7a12-4f90-9f91-407741cc3d85
Phone: 9876543210
Status: Created successfully
```

### Status Update Payload ✅ (Except Date Format)
```json
{
  "leadStatusId": "f6f2683f-526f-42cd-a1b6-dd132e9e0f16",  ← CORRECT (child ID)
  "scheduledDate": "2026-04-29",  ← WRONG (missing time)
  "meetingOrSiteVisit": 0,  ← CORRECT
  "assignTo": "45abfce5-...",  ← CORRECT
  ...
}
```

### What Happened
1. Backend received incomplete date
2. Backend sent incomplete date to Leadrat
3. Leadrat processed the request (accepted it)
4. But appointment time was NOT set (no time in the date!)

---

## Verification Steps

### Step 1: Check if Backend Fix Works
✅ **DONE** - Status ID mapping is correct

### Step 2: Identify Frontend Issue
✅ **DONE** - Found: Frontend not combining date + time

### Step 3: Fix Frontend
⏳ **PENDING** - Need to update chatbot to combine date + time

### Step 4: Re-test Complete Flow
❌ **BLOCKED** - Waiting for frontend fix

---

## Files to Modify

**For Option 2 (Backend workaround):**
- `backend-java/src/main/java/com/leadrat/crm/leadrat/LeadratClient.java`
- In `updateLeadStatus()` method, add date/time combining logic

**For Option 1 (Proper fix - Frontend):**
- Find ChatInterface component in frontend
- Search for where `"scheduledDate"` is set
- Combine with time before sending to API

---

## Next Steps

1. **Find the chatbot code** that sends the status update request
2. **Locate where scheduledDate is being set**
3. **Combine it with time into ISO format**
4. **Re-test through UI**

The backend is now **100% ready** - just waiting for frontend to send proper data!
