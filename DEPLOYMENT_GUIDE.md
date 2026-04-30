# Embedded Chatbot - Deployment Guide

## Latest Commit
- **Hash:** `2f41c57`
- **Branch:** `main`
- **Status:** ✅ Ready for Deployment

## What's New

✅ **Floating Button Embed Widget**
- Small purple button at bottom-right corner (20px padding)
- Click to open/close chat widget
- Proper spacing and animations

✅ **Smart Demo Responses**
- Intelligent responses for properties, scheduling, pricing, leads
- Graceful API fallback (never shows errors)
- Always replies helpfully

✅ **Standalone Component**
- No SessionProvider dependency
- Works independently
- Easy to integrate anywhere

---

## Deployment Options

### Option A: Vercel (Recommended for Frontend)

**For Next.js Frontend:**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from frontend directory
cd frontend
vercel deploy --prod

# Set environment variables in Vercel dashboard:
NEXT_PUBLIC_API_URL=https://your-backend.com
NEXT_PUBLIC_RAG_URL=https://your-backend.com
```

**Environment Variables Needed:**
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_RAG_URL=https://api.yourdomain.com
```

**Update EMBED.js for Production:**
```javascript
// In frontend/public/EMBED.js, line 16
const config = {
  chatbotUrl: document.currentScript?.getAttribute('data-chatbot-url') || 'https://yourdomain.com',
};
```

---

### Option B: Docker Deployment

**Build Docker Image:**

```bash
cd frontend
docker build -t chatbot-frontend:latest .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://api.yourdomain.com \
  -e NEXT_PUBLIC_RAG_URL=https://api.yourdomain.com \
  chatbot-frontend:latest
```

**Docker Compose (Full Stack):**

```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
      - NEXT_PUBLIC_RAG_URL=http://backend:8000

  backend:
    build: ./backend-ai
    ports:
      - "8000:8000"
    depends_on:
      - frontend
```

---

### Option C: Traditional Server (Ubuntu/Linux)

**Prerequisites:**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2
```

**Deploy Frontend:**

```bash
# Clone repository
git clone https://github.com/8050-65/real-estate-ai-chatbot.git
cd real-estate-ai-chatbot/frontend

# Install dependencies
npm install

# Build
npm run build

# Start with PM2
pm2 start "npm start" --name "chatbot-frontend"
pm2 save
pm2 startup
```

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /EMBED.js {
        alias /var/www/chatbot-frontend/public/EMBED.js;
        add_header Content-Type application/javascript;
    }
}
```

---

## Pre-Deployment Checklist

### Frontend

- [ ] Update EMBED.js with production URL
- [ ] Test `/embed` page at production URL
- [ ] Test `/TEST.html` at production URL
- [ ] Verify floating button appears at bottom-right
- [ ] Verify chat opens when clicking button
- [ ] Test demo responses work
- [ ] Check browser console for errors
- [ ] Test on mobile (responsive design)

### Backend Integration

- [ ] API endpoint `/api/v1/chat/rag` is working
- [ ] FastAPI/Ollama service is running
- [ ] RAG knowledge base is loaded
- [ ] Demo fallback responses are working
- [ ] CORS headers allow frontend domain

### Testing URLs

After deployment, test these:

```
https://yourdomain.com/embed
https://yourdomain.com/TEST.html
https://yourdomain.com/EMBED.js
```

---

## Configuration for External Websites

**For websites wanting to embed the chatbot:**

```html
<!-- Add this line before </body> -->
<script async src="https://yourdomain.com/EMBED.js"></script>
```

**With custom URL:**

```html
<script async src="https://yourdomain.com/EMBED.js"
  data-chatbot-url="https://yourdomain.com">
</script>
```

**With custom button control:**

```html
<button onclick="window.leadratChatbot.open()">Chat with AI</button>
<button onclick="window.leadratChatbot.close()">Close</button>
<button onclick="window.leadratChatbot.toggle()">Toggle</button>
```

---

## Production Readiness

### Frontend Files Ready for Deployment

✅ **New Components:**
- `frontend/components/ai/EmbedChatWidget.tsx` - Standalone chat widget
- `frontend/app/embed/page.tsx` - Embed page with floating button

✅ **Public Files:**
- `frontend/public/EMBED.js` - Embed script (v3.0)
- `frontend/public/TEST.html` - Test page

✅ **Documentation:**
- `EMBED_FIXES_SUMMARY.md` - Technical details
- `EMBED_TESTING_GUIDE.md` - Testing instructions
- `DEPLOYMENT_GUIDE.md` - This file

### What's NOT Included in Deployment

❌ `node_modules/` - Auto-installed during build
❌ `.next/` - Built during `npm run build`
❌ Test/demo documentation files - Optional

---

## Rollback Plan

If issues occur after deployment:

```bash
# View recent commits
git log --oneline -10

# Rollback to previous version
git revert 2f41c57

# Push rollback
git push origin main
```

---

## Monitoring & Debugging

### Browser Console (F12)

Expected logs when `/embed` or `/TEST.html` loaded:

```
✅ Leadrat AI Chatbot initialized
🌐 URL: https://yourdomain.com
💡 API: window.leadratChatbot.open() / .close() / .toggle()
```

### Check Deployment Success

```bash
# Test if embed script is accessible
curl -I https://yourdomain.com/EMBED.js
# Should return: HTTP/2 200

# Test if embed page loads
curl -I https://yourdomain.com/embed
# Should return: HTTP/2 200

# Test if TEST page loads
curl -I https://yourdomain.com/TEST.html
# Should return: HTTP/2 200
```

---

## Support & Troubleshooting

### Issue: Blank page at /embed

**Solution:**
```bash
# Rebuild frontend
cd frontend
npm run build
npm start
```

### Issue: Widget doesn't appear at bottom-right

**Check:**
- Browser console for errors (F12)
- CSS not being overridden
- Z-index conflicts with other page elements
- Mobile viewport width

### Issue: Bot responses show errors

**Check:**
- Backend API is running
- `/api/v1/chat/rag` endpoint is accessible
- Demo fallback is working
- Network tab shows API response status

---

## Post-Deployment

1. ✅ Test all functionality
2. ✅ Monitor error logs
3. ✅ Collect user feedback
4. ✅ Plan improvements based on usage
5. ✅ Schedule regular backups

---

## Questions or Issues?

Refer to:
- `EMBED_TESTING_GUIDE.md` - Testing procedures
- `EMBED_FIXES_SUMMARY.md` - Technical details
- Git commit history: `git log`

---

**Status:** ✅ Ready for Production Deployment
**Last Updated:** 2026-04-29
**Commit:** 2f41c57
