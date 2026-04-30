# Deploy Leadrat Widget to Cloudflare Pages

## Overview

Cloudflare Pages is perfect for hosting static files like our embeddable widget:
- ✅ Free CDN with global edge locations
- ✅ Unlimited bandwidth
- ✅ Zero cost for static assets
- ✅ 500 builds/month (free plan)
- ✅ Automatic CORS headers
- ✅ Automatic cache optimization

## Deployment Options

### Option 1: GitHub Integration (Recommended)

**Pros:** Automatic deploys on push, easy to manage
**Time:** 5 minutes

#### Steps:

1. **Push to GitHub**
   ```bash
   cd /path/to/real-estate-ai-chatbot
   git add widget/
   git commit -m "Add embeddable chatbot widget"
   git push origin main
   ```

2. **Login to Cloudflare**
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Sign in (create free account if needed)

3. **Create Pages Project**
   - Click "Pages" in left sidebar
   - Click "Create a project"
   - Select "Connect to Git"
   - Select your GitHub repo
   - Click "Begin setup"

4. **Configure Build Settings**
   - **Project name:** `leadrat-chat-widget`
   - **Production branch:** `main`
   - **Framework preset:** `None`
   - **Build command:** 
     ```
     cd widget && npm install && npm run build
     ```
   - **Build output directory:** 
     ```
     widget/dist
     ```

5. **Environment Variables** (Optional)
   - None required for this project

6. **Click Deploy**
   - Wait for build to complete (~2-3 minutes)
   - You'll get a URL like: `https://leadrat-chat-widget.pages.dev`

### Option 2: Direct Upload (Drag & Drop)

**Pros:** Instant deployment, no Git needed
**Time:** 2 minutes

#### Steps:

1. **Build locally**
   ```bash
   cd widget
   npm install
   npm run build
   ```

2. **Login to Cloudflare**
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)

3. **Create Pages Project**
   - Click "Pages" → "Create a project" → "Direct upload"
   - Project name: `leadrat-chat-widget`

4. **Upload Files**
   - Drag `widget/dist/` folder to upload area
   - Or click to browse and select files

5. **Deploy**
   - Cloudflare automatically uploads and deploys
   - You get a URL immediately

### Option 3: Wrangler CLI (Advanced)

**Pros:** Full automation, scriptable
**Time:** 10 minutes setup + 1 minute per deploy

#### Setup:

```bash
# Install wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
cd widget
wrangler pages deploy dist/ --project-name=leadrat-chat-widget
```

## Expected Deployment URLs

Once deployed, your widget will be available at:

```
https://leadrat-chat-widget.pages.dev/leadrat-chat.js
https://leadrat-chat-widget.pages.dev/chat-ui.html
```

## Post-Deployment Verification

### 1. Check Files Are Accessible

```bash
# Test main script
curl -I https://leadrat-chat-widget.pages.dev/leadrat-chat.js

# Test chat UI
curl -I https://leadrat-chat-widget.pages.dev/chat-ui.html
```

Expected response:
```
HTTP/1.1 200 OK
Content-Type: application/javascript (or text/html)
Cache-Control: public, max-age=...
Access-Control-Allow-Origin: *
```

### 2. Create Test HTML File

Create `test-widget.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Leadrat Widget Test</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      background: #f0f0f0;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 20px;
      border-radius: 8px;
    }
    h1 { color: #333; }
    p { color: #666; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🤖 Leadrat Chat Widget Test</h1>
    <p>Chat widget should appear in the bottom-right corner.</p>
    <p>This is a test page to verify the widget loads correctly from Cloudflare Pages.</p>

    <!-- Widget Configuration -->
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

    <!-- Load Widget from Cloudflare Pages -->
    <script src="https://leadrat-chat-widget.pages.dev/leadrat-chat.js" async></script>
  </div>

  <script>
    console.log('Test page loaded. Widget should load momentarily...');
    setTimeout(() => {
      const button = document.getElementById('leadrat-chat-launcher');
      if (button) {
        console.log('✅ Widget button found in DOM');
      } else {
        console.log('⚠️ Widget button not found - check script loaded');
      }
    }, 1000);
  </script>
</body>
</html>
```

### 3. Test in Browser

1. Save the HTML file
2. Open in browser
3. Verify:
   - ✅ Purple chat button appears bottom-right
   - ✅ Button is clickable
   - ✅ Chat window opens
   - ✅ No console errors
   - ✅ Can type messages
   - ✅ Messages send to backend

### 4. Check Browser Console

Open DevTools (F12) and check:
- ✅ No 404 errors for script files
- ✅ No CORS errors
- ✅ No JavaScript errors
- ✅ Console shows "Widget initialized" or similar

## Configuration for Different Backends

### Local Backend (Development)

```javascript
window.LeadratChatConfig = {
  apiUrl: "http://localhost:8000/api/v1/chat",
  botName: "Leadrat Assistant",
  botSubtitle: "Real Estate AI",
  primaryColor: "#6C63FF"
};
```

### Render.com Backend (Production)

```javascript
window.LeadratChatConfig = {
  apiUrl: "https://real-estate-rag-dev.onrender.com/api/v1/chat",
  botName: "Leadrat Assistant",
  botSubtitle: "Real Estate AI",
  primaryColor: "#6C63FF"
};
```

### Custom Domain Backend

```javascript
window.LeadratChatConfig = {
  apiUrl: "https://your-api-domain.com/api/v1/chat",
  botName: "Leadrat Assistant",
  botSubtitle: "Real Estate AI",
  primaryColor: "#6C63FF"
};
```

## Updating the Widget

### If Using GitHub Integration

1. Make changes to `widget/src/`
2. Rebuild: `npm run build`
3. Push to GitHub: `git push`
4. Cloudflare automatically redeploys

### If Using Direct Upload

1. Make changes to `widget/src/`
2. Rebuild: `npm run build`
3. Go to Cloudflare Pages project
4. Click "Deployments" → "Upload a new version"
5. Drag `widget/dist/` folder

### If Using Wrangler CLI

```bash
cd widget
npm run build
wrangler pages deploy dist/ --project-name=leadrat-chat-widget
```

## Troubleshooting

### Widget Not Loading

**Problem:** Chat button doesn't appear
**Solution:**
1. Check Cloudflare Pages deployment status
2. Verify URL is correct in script src
3. Check browser console for CORS errors
4. Verify `LeadratChatConfig` is set before script loads

### CORS Errors

**Problem:** "Access to XMLHttpRequest blocked by CORS"
**Solution:**
1. Cloudflare Pages automatically sets CORS headers
2. Verify backend has CORS enabled
3. Check backend logs for origin validation

### Script Not Found (404)

**Problem:** "Failed to load script from CDN"
**Solution:**
1. Verify project name matches URL
2. Check build output directory is set to `widget/dist`
3. Verify files are in correct folder
4. Check deployment logs in Cloudflare

### Chat Not Responding

**Problem:** Messages don't send to backend
**Solution:**
1. Verify API URL is correct in config
2. Check backend is running and accessible
3. Verify backend has CORS enabled
4. Test API manually: 
   ```bash
   curl -X POST https://your-api.com/api/v1/chat/message \
     -H "Content-Type: application/json" \
     -d '{"message":"test","session_id":"test","tenant_id":"test","conversation_history":[]}'
   ```

## Performance Monitoring

### Check Cache Hit Rate

```bash
# View Cloudflare Analytics in dashboard
# Pages → Your Project → Analytics
# Monitor: Cache hit ratio, bandwidth usage
```

### Monitor Widget Performance

1. Open DevTools Network tab
2. Load widget page
3. Check:
   - leadrat-chat.js load time
   - chat-ui.html load time
   - API response times

Expected:
- Script load: <100ms
- HTML load: <100ms
- API response: 1-5 seconds (depends on LLM)

## Custom Domain (Optional)

To use your own domain instead of `.pages.dev`:

1. In Cloudflare Pages project settings
2. Click "Custom domains"
3. Add your domain
4. Update DNS records
5. Your widget will be at:
   ```
   https://your-domain.com/leadrat-chat.js
   https://your-domain.com/chat-ui.html
   ```

## Security Considerations

✅ **Already Enabled:**
- HTTPS by default
- DDoS protection
- Auto CORS headers
- Rate limiting available

✅ **Recommended:**
- Restrict backend API to authenticated requests
- Implement rate limiting on `/api/v1/chat/message`
- Monitor for abuse patterns
- Use API keys if needed

## Cost

**Free Tier:**
- ✅ Unlimited bandwidth
- ✅ Unlimited requests
- ✅ 500 builds/month
- ✅ Global CDN
- ✅ Perfect for static assets

**If you exceed free tier:**
- Pay-as-you-go starting at $20/month
- Still very affordable for widget hosting

## Next Steps

1. **Deploy** using one of the three options above
2. **Verify** with test HTML file
3. **Update** your documentation with the CDN URLs
4. **Share** the URLs with your team
5. **Monitor** performance in Cloudflare dashboard

## URLs Summary

Once deployed:

```
Project Name: leadrat-chat-widget
Widget Script: https://leadrat-chat-widget.pages.dev/leadrat-chat.js
Chat UI: https://leadrat-chat-widget.pages.dev/chat-ui.html
Dashboard: https://dash.cloudflare.com → Pages → leadrat-chat-widget
```

## Support

If deployment fails:
1. Check build logs in Cloudflare dashboard
2. Verify `widget/dist/` contains both files
3. Check GitHub integration has correct permissions
4. Review build command is exact: `cd widget && npm install && npm run build`
5. Verify output directory is: `widget/dist`
