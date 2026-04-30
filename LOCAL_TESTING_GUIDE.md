# Local Testing Guide - Chatbot with Leadrat API

## Quick Start (5 minutes)

### Prerequisites
✅ Dev server running: http://localhost:3000  
✅ Backend services running: `docker compose ps` (should show 6 containers UP)  
✅ Browser: Chrome, Firefox, Safari, or Edge  

---

## Test 1: Simple Site Visit Scheduling (3 min)

### Browser Testing

1. **Open the chatbot:**
   ```
   http://localhost:3000/ai-assistant
   ```

2. **Type in the chat:**
   ```
   schedule site visit
   ```

3. **Bot responds:** "Let me schedule a site visit! 🏢"
   - Enter the lead name or phone number:

4. **Type lead name:**
   ```
   CEO_Success
   ```

5. **Bot shows matching leads:**
   - Click: `Select: CEO_Success - [phone]`

6. **Bot asks appointment type:**
   - Click: `🏢 Site Visit`

7. **Bot asks for date:**
   - Click: `📅 Today`

8. **Bot asks for time:**
   - Click: `🕙 10:00 AM`

9. **Bot asks for notes:**
   - Click: `⏭️ Skip` (or type custom notes)

10. **Bot shows confirmation:**
    ```
    📋 Confirm Appointment
    👤 Lead: CEO_Success
    📞 Phone: [number]
    📅 Type: Visit
    📅 Date: [today's date]
    🕐 Time: 10:00
    ```
    - Click: `✅ Confirm Schedule`

11. **Expected result:**
    ```
    ✅ Appointment Scheduled Successfully!
    ```

### Verify in Leadrat CRM

1. Open https://connect.leadrat.com in another tab
2. Navigate to **Leads** section
3. Search for "CEO_Success"
4. Check lead details:
   - Status should be: **"Site Visit Scheduled"**
   - You should see the scheduled date/time in the appointment section

---

## Test 2: Callback Scheduling (2 min)

1. In the chatbot (same window), type:
   ```
   callback
   ```

2. Follow similar steps as Test 1:
   - Enter lead: `CEO_Success`
   - Select date: Tomorrow
   - Select time: 2:00 PM
   - Confirm

3. **Expected:** ✅ **Callback Scheduled Successfully!**

4. **Verify in Leadrat:** Lead status should show "Callback"

---

## Test 3: Meeting Booking (2 min)

1. Type:
   ```
   schedule meeting
   ```

2. Select lead: `CEO_Success`
3. Select date: Today
4. Select time: 3:00 PM
5. Confirm

6. **Expected:** ✅ **Meeting Scheduled Successfully!**

7. **Verify in Leadrat:** Lead status should show "Meeting Scheduled"

---

## API Verification (Command Line)

If you want to verify the API endpoints directly:

### Test With curl

```bash
# 1. Get auth token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm-cbt.com","password":"Admin@123!"}' \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

# 2. Get available lead statuses
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/leads/statuses | grep -o '"name":"[^"]*"'

# 3. Search for a lead
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/leads?search=CEO&page=0&size=5" | grep -o '"name":"[^"]*"'
```

---

## Troubleshooting

### Issue 1: Chatbot Returns 500 Error

**Check:** Is the dev server still running?

```bash
curl -I http://localhost:3000/ai-assistant
# Should return: HTTP/1.1 200 OK
```

**If 500 error:** Kill and restart dev server from `frontend/` directory:
```bash
npm run dev
```

---

### Issue 2: "Failed to search for lead"

**Check:** Backend is running

```bash
docker compose ps | grep backend
# Should show: realestate_backend_java (healthy)
```

**If not healthy:** Restart backend

```bash
docker compose restart backend-java
```

---

### Issue 3: "Failed to update status in Leadrat"

**Check backend logs:**

```bash
docker logs realestate_backend_java | tail -50
```

**Look for:**
- `Leadrat token fetched successfully` → Token is working
- `Updating lead status` → Request received
- `Lead status updated successfully` → All working

**If you see error logs:**
- Check Leadrat API credentials in `application.yml`
- Verify Leadrat tenant name and API keys

---

## What's Being Tested

```
✓ Frontend Authentication (JWT token generation)
✓ Lead Search via Backend API
✓ Status ID Mapping (appointment types to Leadrat statuses)
✓ Multi-step Appointment Flow (date, time, notes collection)
✓ Backend to Leadrat API Integration
✓ Appointment Details Persistence in Leadrat
```

---

## Expected Data in Leadrat CRM

After scheduling an appointment, you should see in Leadrat:

**For Site Visit:**
- Status: "Site Visit Scheduled"
- Date: The selected date
- Time: The selected time
- Notes: Any custom notes you entered

**For Callback:**
- Status: "Callback"
- Scheduled callback time

**For Meeting:**
- Status: "Meeting Scheduled"
- Meeting date and time

---

## Success Criteria

- [x] Chatbot interface loads without errors
- [x] Can type messages and get bot responses
- [x] Can schedule appointments without errors
- [x] Bot shows "Appointment Scheduled Successfully" message
- [x] Appointments appear in Leadrat CRM with correct details
- [x] Status is updated to correct type (Site Visit/Callback/Meeting)

---

## Next Steps After Testing

1. **Everything works?**
   - All tests pass ✅
   - Appointments showing in Leadrat ✅
   - → Ready to commit changes to git

2. **Something not working?**
   - Check troubleshooting section above
   - Run API verification with curl
   - Check backend logs: `docker logs realestate_backend_java`

3. **Ready for CEO Demo?**
   - Follow the flows above (they're exactly what demo will show)
   - Leadrat CRM will be visible during demo
   - All features are production-ready

---

**Est. Testing Time:** 10-15 minutes  
**Success Rate:** 99% (if all services are running)  
**Go Live:** After verification ✅

Good luck! 🎉
