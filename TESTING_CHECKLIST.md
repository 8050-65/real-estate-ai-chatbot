# Quick Testing Checklist ✅

**Backend Rebuild Status:** ✅ COMPLETE  
**API Verification:** ✅ VERIFIED (appointment fields forwarding correctly)  
**Next Step:** Browser testing

---

## ✅ Pre-Test Verification (Completed)

- [x] Backend Docker image rebuilt
- [x] Backend service healthy (UP)
- [x] Database migrations validated (V1-V10)
- [x] API responds to appointment scheduling requests
- [x] Leadrat API confirms: `succeeded: true`
- [x] Backend logs show appointment fields in payload:
  - ✅ `"scheduledDate":"2026-04-30T10:00:00Z"`
  - ✅ `"meetingOrSiteVisit":2`
- [x] Frontend server responding
- [x] Lead search working

---

## Test Execution (Do This Now)

### Test 1: Site Visit Scheduling
- [ ] Open: http://localhost:3000/ai-assistant
- [ ] Type: `schedule site visit`
- [ ] Select lead: `CEO_Success`
- [ ] Select type: `🏢 Site Visit`
- [ ] Select date: `📅 Today`
- [ ] Select time: `🕙 10:00 AM`
- [ ] Add notes or skip
- [ ] Click: `✅ Confirm Schedule`
- [ ] Verify message: `✅ Appointment Scheduled Successfully!`

### Test 2: Verify in Leadrat CRM
- [ ] Open: https://connect.leadrat.com (in new tab)
- [ ] Go to: **Leads** section
- [ ] Search: `CEO_Success`
- [ ] Check: Status shows **"Site Visit Scheduled"** ✅
- [ ] Check: Appointment date/time is visible ✅
- [ ] Check: Notes saved correctly ✅

### Test 3: Callback Scheduling
- [ ] Back to chatbot tab
- [ ] Type: `callback`
- [ ] Select lead: `CEO_Success`
- [ ] Select date: Tomorrow
- [ ] Select time: 2:00 PM
- [ ] Confirm
- [ ] Verify: `✅ Callback Scheduled Successfully!`
- [ ] In Leadrat: Verify status = **"Callback"** ✅

### Test 4: Meeting Booking
- [ ] Type: `schedule meeting`
- [ ] Select lead: `CEO_Success`
- [ ] Select date: Today
- [ ] Select time: 3:00 PM
- [ ] Confirm
- [ ] Verify: `✅ Meeting Scheduled Successfully!`
- [ ] In Leadrat: Verify status = **"Meeting Scheduled"** ✅

---

## Success Criteria

All of the following must be true:

- [ ] All three appointment types can be scheduled without errors
- [ ] Chatbot responds with success messages
- [ ] Status updates show in Leadrat CRM immediately
- [ ] Appointment dates and times appear in Leadrat
- [ ] All three status types update correctly:
  - Site Visit → "Site Visit Scheduled"
  - Callback → "Callback"
  - Meeting → "Meeting Scheduled"

---

## If Something Goes Wrong

### Issue: Chatbot returns error
**Check:** Backend logs
```bash
docker logs realestate_backend_java | tail -30
```
**Look for:** Error messages about lead ID or status ID

### Issue: Status updates but no appointment details in Leadrat
**Check:** Backend logs for payload
```bash
docker logs realestate_backend_java | grep "Lead status update payload"
```
**Should show:** `"scheduledDate"` and `"meetingOrSiteVisit"` fields

### Issue: Leadrat shows "failed"
**Check:** Leadrat API credentials in backend logs
```bash
docker logs realestate_backend_java | grep -i "leadrat\|auth\|token"
```

---

## Commit When Ready

Once all tests pass:

```bash
git add backend-java/src/main/java/com/leadrat/crm/leadrat/LeadratClient.java
git add backend-java/src/main/java/com/leadrat/crm/lead/LeadService.java
git commit -m "Fix: Forward appointment scheduling fields to Leadrat API

- LeadratClient now extracts scheduledDate and meetingOrSiteVisit from statusUpdate map
- LeadService returns minimal LeadDto to prevent empty response issues
- All appointment details now properly saved in Leadrat CRM"
```

---

## Estimated Time
- **Site Visit Test:** 3 minutes
- **Leadrat Verification:** 2 minutes
- **Callback & Meeting Tests:** 4 minutes
- **Total:** ~10 minutes

**Status:** ✅ Ready to test!
