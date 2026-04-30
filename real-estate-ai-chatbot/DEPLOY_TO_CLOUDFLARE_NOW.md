# 🚀 Deploy Widget to Cloudflare Pages NOW (5 minutes)

## Quickest Path: GitHub Integration

### Step 1: Prepare Repository (2 minutes)

```bash
cd /c/Users/vikra/source/repos/Chatbot_Leadrat/real-estate-ai-chatbot/real-estate-ai-chatbot

# Check git status
git status

# Add widget files
git add widget/

# Commit
git commit -m "Add embeddable chatbot widget for Cloudflare Pages deployment"

# Push to GitHub
git push origin main
```

### Step 2: Deploy on Cloudflare (3 minutes)

1. **Open Cloudflare Dashboard**
   - Go to: https://dash.cloudflare.com
   - Sign in (create free account if needed)

2. **Create Pages Project**
   - Click **"Pages"** in left sidebar
   - Click **"Create a project"**
   - Click **"Connect to Git"**

3. **Select Repository**
   - Find repo: `Chatbot_Leadrat` or similar
   - Click **"Begin setup"**

4. **Configure Build Settings**

   Fill in these exact values:

   ```
   Project name: leadrat-chat-widget
   Production branch: main
   Framework preset: None
   Build command: cd widget && npm install && npm run build
   Build output directory: widget/dist
   ```

5. **Deploy**
   - Click **"Save and Deploy"**
   - Wait for build (2-3 minutes)
   - You'll see: "Deployment successful"

### Step 3: Get Your URLs

Once deployed, you'll have:

```
https://leadrat-chat-widget.pages.dev/leadrat-chat.js
https://leadrat-chat-widget.pages.dev/chat-ui.html
```

---

## Verify Deployment (2 minutes)

### Test 1: Check Files Exist

```bash
curl -I https://leadrat-chat-widget.pages.dev/leadrat-chat.js
curl -I https://leadrat-chat-widget.pages.dev/chat-ui.html
```

Expected: `HTTP/1.1 200 OK`

### Test 2: Test in Browser

Create file `test-cloudflare.html` (anywhere):

```html
<!DOCTYPE html>
<html>
<head>
  <title>Widget Test</title>
  <style>body { font-family: Arial; padding: 40px; }</style>
</head>
<body>
  <h1>Leadrat Widget Test</h1>
  <p>Chat button should appear in bottom-right corner</p>

  <script>
    window.LeadratChatConfig = {
      apiUrl: "https://real-estate-rag-dev.onrender.com/api/v1/chat",
      botName: "Leadrat Assistant",
      botSubtitle: "Real Estate AI",
      primaryColor: "#6C63FF",
      position: "bottom-right",
      tenantId: "dubait11"
    };
  </script>
  <script src="https://leadrat-chat-widget.pages.dev/leadrat-chat.js" async></script>
</body>
</html>
```

Open in browser → Should see:
- ✅ Purple chat button in bottom-right
- ✅ Button is clickable
- ✅ Chat window opens
- ✅ Can type messages
- ✅ No console errors

---

## Troubleshooting Quick Fixes

### Build Failed?

Check Cloudflare Pages dashboard:
1. Click your project
2. Click "Deployments"
3. Click failed deployment
4. Read error log
5. Common fixes:
   - Remove trailing slashes from paths
   - Ensure `widget/` folder exists with `package.json`
   - Try redeploying

### Widget Not Appearing?

1. Check browser console (F12)
2. Verify script URL is correct
3. Check `LeadratChatConfig` is set
4. Verify backend is running

### 404 Not Found?

1. Check project name matches URL
2. Verify files are in `widget/dist/`
3. Check build output directory is set correctly
4. Try redeploying

---

## Final URLs to Share

Once deployed, share these with your team:

```
📌 Widget CDN URLs
├── Script: https://leadrat-chat-widget.pages.dev/leadrat-chat.js
├── UI: https://leadrat-chat-widget.pages.dev/chat-ui.html
└── Integration Code:
    
    <script>
      window.LeadratChatConfig = {
        apiUrl: "https://real-estate-rag-dev.onrender.com/api/v1/chat",
        botName: "Leadrat Assistant",
        botSubtitle: "Real Estate AI",
        primaryColor: "#6C63FF",
        position: "bottom-right",
        tenantId: "dubait11"
      };
    </script>
    <script src="https://leadrat-chat-widget.pages.dev/leadrat-chat.js" async></script>
```

---

## After Deployment

### Monitor Performance
- Cloudflare Dashboard → Pages → leadrat-chat-widget → Analytics
- Check: cache hit ratio, bandwidth, requests

### Update Documentation
- Share CDN URLs with team
- Update integration guides with real URLs
- Document any API key requirements

### Next Deployments
Any changes to `widget/src/`:
1. `npm run build`
2. `git add widget/`
3. `git commit -m "Update widget"`
4. `git push origin main`
5. Cloudflare auto-deploys! ✅

---

## Total Time
- **Setup**: 5 minutes
- **Build**: 2-3 minutes
- **Test**: 2 minutes
- **Total**: ~10 minutes

---

**Ready? Start with Step 1 above!** 🚀
