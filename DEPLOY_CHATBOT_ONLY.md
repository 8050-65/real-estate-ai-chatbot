# Deploy Embedded Chatbot Only (No CRM)

## Quick Deploy to Vercel

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Deploy from Frontend Directory
```bash
cd frontend
vercel deploy --prod
```

### Step 3: Set Environment Variables in Vercel Dashboard

Go to: **Settings → Environment Variables**

Add these:
```
NEXT_PUBLIC_API_URL=https://your-backend-api.com
NEXT_PUBLIC_RAG_URL=https://your-backend-api.com
```

### Step 4: Update EMBED.js for Production

**File:** `frontend/public/EMBED.js`

Change line 16 from:
```javascript
chatbotUrl: document.currentScript?.getAttribute('data-chatbot-url') || 'http://localhost:3000',
```

To:
```javascript
chatbotUrl: document.currentScript?.getAttribute('data-chatbot-url') || 'https://your-vercel-domain.vercel.app',
```

Then push to main:
```bash
git add frontend/public/EMBED.js
git commit -m "Update EMBED.js for production domain"
git push origin main
```

### Step 5: Verify Deployment

Test these URLs after deployment:

```
https://your-vercel-domain.vercel.app/embed
https://your-vercel-domain.vercel.app/EMBED.js
```

Expected result:
- ✅ Floating button at bottom-right corner
- ✅ Click button → chat widget opens
- ✅ Messages get demo responses
- ✅ No CRM dashboard visible
- ✅ No sidebar visible
- ✅ No login required

---

## What Gets Deployed

### ✅ Included
- `/embed` page (floating button + chat widget)
- `EmbedChatWidget` component
- `/EMBED.js` script
- `/TEST.html` test page
- Smart demo responses

### ❌ NOT Included
- Dashboard/CRM pages
- Sidebar navigation
- Login/authentication screens
- CRM modules

---

## For External Websites

After deployment, external sites can embed with:

```html
<script async src="https://your-vercel-domain.vercel.app/EMBED.js"></script>
```

---

## Rollback (If Needed)

```bash
# List recent commits
git log --oneline -5

# Revert to previous version
git revert <commit-hash>

# Push
git push origin main

# Redeploy to Vercel
vercel deploy --prod
```

---

## Success Indicators

✅ **Deployment is successful when:**
1. Can access `/embed` page
2. Floating button visible at bottom-right
3. Click button → widget opens
4. Type message → get response (not error)
5. No CRM dashboard visible
6. No sidebar visible
7. Works on mobile (responsive)

---

## Troubleshooting

### Issue: Still shows CRM dashboard

**Solution:** Make sure you're accessing `/embed` path
```
✅ https://your-domain.vercel.app/embed
❌ https://your-domain.vercel.app/
```

### Issue: Widget not at bottom-right

**Check:**
- Browser F12 console for errors
- Z-index not being overridden
- Mobile viewport issues

### Issue: Messages not responding

**Check:**
- Backend API is running
- Environment variables set correctly
- NEXT_PUBLIC_RAG_URL points to correct backend

---

## Current Production Status

**Latest Commit:** `f0a5c8e`
**Branch:** `main`
**Status:** ✅ Ready to Deploy
**Type:** Chatbot Only (No CRM)

---

**Deploy Now!** 🚀
