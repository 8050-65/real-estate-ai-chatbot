# Leadrat Status API - Debug Investigation

## Problem
- Backend returns: `"succeeded": true`
- But lead status in Leadrat UI is NOT changing
- Need to understand the exact issue

---

## Findings

### 1. Backend is Sending Correct Payload
✅ All required fields present:
- `leadStatusId` (correct status ID)
- `scheduledDate` (ISO format)
- `meetingOrSiteVisit` (0, 1, or 2)
- `assignTo` (user ID)
- All other required fields

### 2. Leadrat API Responds with Success
✅ Response: `{"succeeded":true}`
But the status is NOT actually updating

### 3. Issue Analysis
**Possible causes:**
1. Lead might not be assigned in Leadrat (even though we send assignTo)
2. API might accept the request but not process it if lead is unassigned
3. Appointment fields might need a different API endpoint
4. Status update might require the lead to be in a certain state first

---

## Solution: Check If Lead Assignment is Actually Working

The root issue is likely:
- We create leads with `"assignTo":"45abfce5-2746-42e6-bf66-ac7e00e75085"`
- Leadrat creates the lead successfully
- **BUT** Leadrat is not actually assigning the lead to this user
- Lead stays in "Unassigned" bucket
- Status updates are silently ignored for unassigned leads

---

## Required Actions

### 1. Verify Lead Assignment in Leadrat
Use curl to call Leadrat API directly and check if:
- Lead appears in the user's assigned leads
- Lead status in UI shows "Site Visit Scheduled"
- Appointment date/time are visible

### 2. Check if Separate API Endpoint Needed
Leadrat might have:
- `/lead/status/{id}` → for status change only
- `/lead/appointment/{id}` → for scheduling details
- `/lead/assign/{id}` → for explicit assignment

### 3. Verify Payload Structure
The payload we're sending might need:
- Different field names
- Different date format  
- Additional required fields
- Specific ordering

---

## Next Steps

1. **Test with curl directly against Leadrat** to confirm the API behavior
2. **Check Leadrat documentation** for status update endpoint requirements
3. **Verify lead assignment** by checking if the lead appears in Leadrat user's list
4. **Test different payload formats** to see if any fields are being ignored

---

## Critical Question

**When we create a lead with `"assignTo":"45abfce5-..."`, does Leadrat actually assign it to that user, or does it need a separate API call?**

If it needs a separate call, we need to:
1. Create the lead
2. Assign it (separate call)
3. Then update the status

If the assignment is working, the status update should work automatically.
