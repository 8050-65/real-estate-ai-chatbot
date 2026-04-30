# 🚀 Embed Script - Test Now, Deploy Later

**Status:** Ready to test on localhost  
**Production Status:** Waiting for deployment to Vercel

---

## ⚡ Test RIGHT NOW (3 Steps)

### Step 1: Verify Dev Server is Running
```bash
# Terminal should show the dev server running on port 3000
npm run dev
# Should see: ✓ ready in Xs, listening on port 3000
```

### Step 2: Open Test HTML File
```
Open this file in your browser:
▶️  test-embed-localhost.html
```

### Step 3: Verify Chatbot Works
- ✅ Floating button appears in bottom-right corner
- ✅ Click "Open Chat" button → chat window opens
- ✅ See "Aria - Real Estate Assistant" header
- ✅ Type message → get response
- ✅ Console shows: ✅ Leadrat AI Chatbot initialized

**If you see all above → CHATBOT IS WORKING!** 🎉

---

## 📋 Current Setup

### What's Available Now
```
✅ Development URL: http://localhost:3000
✅ Dev Embed Script: http://localhost:3000/chatbot-embed.js
✅ Dev Test File: test-embed-localhost.html
✅ Chatbot App: http://localhost:3000/ai-assistant
```

### What's NOT Available Yet
```
❌ Production URL: https://chatbot-leadrat.vercel.app (404 Not Deployed)
❌ Production Embed Script: Not deployed
```

---

## 🔴 Why You Saw 404 Error

The production URL shows **404 NOT_FOUND** because:
1. The Next.js app hasn't been deployed to Vercel yet
2. You need to push code to GitHub
3. Vercel will auto-deploy from GitHub

---

## 🎯 To Deploy to Production

### Option 1: Deploy to Vercel (Recommended)

1. **Create GitHub repo** (if not already)
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Chatbot with embed script"
   git remote add origin https://github.com/YOUR_USERNAME/chatbot-leadrat.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Sign in with GitHub
   - Click "New Project"
   - Select your GitHub repo
   - Deploy!

3. **After Deployment**
   - Vercel gives you a URL (e.g., `https://chatbot-leadrat.vercel.app`)
   - Update embed script to use production URL

### Option 2: Use Any Other Hosting
- Deploy to AWS, Google Cloud, Azure, etc.
- Get your production URL
- Use that URL in embed script

---

## 📝 Copy-Paste Code for Different Scenarios

### For Localhost Testing (Use NOW)
```html
<script async src="http://localhost:3000/chatbot-embed.js"></script>
```

### For Production (After Deployment)
```html
<!-- Replace YOUR_PRODUCTION_URL with your actual deployed URL -->
<script async src="https://YOUR_PRODUCTION_URL/chatbot-embed.js"></script>
```

### Example After Vercel Deployment
```html
<script async src="https://chatbot-leadrat.vercel.app/chatbot-embed.js"></script>
```

---

## 🧪 Testing Checklist

Before considering it "working":

- [ ] Dev server running on localhost:3000
- [ ] Open test-embed-localhost.html in browser
- [ ] Floating button visible in bottom-right
- [ ] Button has chat icon and red badge
- [ ] Click "Open Chat" → window opens with animation
- [ ] See "Aria - Real Estate Assistant" header
- [ ] Status bar shows "Ready" (green indicator)
- [ ] Can type in message input field
- [ ] Can send message (Enter or Send button)
- [ ] Get response from chatbot
- [ ] No red errors in browser console (F12)
- [ ] Close button (X) closes the chat
- [ ] Toggle button switches open/close

If ALL above are ✅ → **CHATBOT IS WORKING!**

---

## 🚀 Next Steps

### This Week
1. ✅ Test with test-embed-localhost.html
2. ✅ Verify chatbot functionality
3. ⏳ Prepare for production deployment

### When Ready for Production
1. Deploy frontend to Vercel/your host
2. Get production URL
3. Update embed script URLs (localhost → production)
4. Test on production domain
5. Deploy to external websites

---

## 📍 Three URLs You'll Use

### Development (NOW)
```
http://localhost:3000/chatbot-embed.js
```

### Production (LATER)
```
https://your-deployed-domain.com/chatbot-embed.js
```

### Embedded Mode (AUTOMATIC)
```
http://localhost:3000/ai-assistant?embedded=true
https://your-domain.com/ai-assistant?embedded=true
```

The `?embedded=true` parameter automatically hides the REIA header and status bar for clean embed experience.

---

## 🎓 How Embed Script Works

1. **Script Tag** → Browser loads embed script from your URL
2. **CSS Injection** → Styles added to page
3. **Button Creation** → Floating button appears
4. **User Click** → Opens chat window
5. **iframe Load** → Loads `/ai-assistant?embedded=true`
6. **Clean UI** → Header hidden (embedded mode)
7. **Ready to Chat** → User types messages
8. **API Call** → Message sent to backend
9. **Response** → Displayed in chat window

---

## 🔄 Development vs Production

### Development (localhost)
```html
<!-- Use while developing -->
<script async src="http://localhost:3000/chatbot-embed.js"></script>
```
✅ Fast HMR (hot reload)  
✅ Easy debugging  
✅ Can modify and reload  

### Production (deployed)
```html
<!-- Use when live -->
<script async src="https://chatbot-leadrat.vercel.app/chatbot-embed.js"></script>
```
✅ Accessible from anywhere  
✅ Stable and optimized  
✅ Available 24/7  

---

## 📊 What's Ready

| Component | Status | Location |
|-----------|--------|----------|
| **Embed Script (Dev)** | ✅ Ready | http://localhost:3000/chatbot-embed.js |
| **Embed Script (Prod)** | ⏳ Not deployed | Needs Vercel deployment |
| **Chatbot App (Dev)** | ✅ Running | http://localhost:3000 |
| **Chatbot App (Prod)** | ❌ 404 Not Found | https://chatbot-leadrat.vercel.app |
| **Test File (Localhost)** | ✅ Ready | test-embed-localhost.html |
| **Documentation** | ✅ Complete | Multiple .md files |

---

## ⚠️ Important Notes

1. **Production URL doesn't exist yet**
   - You need to deploy the Next.js app first
   - See "Deploy to Vercel" section above

2. **Localhost is for testing only**
   - Not accessible from other devices/networks
   - Only works on your computer

3. **After deployment**
   - Update all URLs from localhost to production
   - Test again on production domain
   - Deploy to external websites

4. **Both versions use same code**
   - Only the URL changes
   - Everything else is identical

---

## ✅ Success Criteria

You'll know it's working when:

✅ **Locally:**
- test-embed-localhost.html shows floating button
- Button opens/closes chat
- Can send and receive messages
- No console errors

✅ **In Production (later):**
- Embed script loads from your deployed URL
- Chatbot appears on external websites
- All functionality works
- No cross-origin errors

---

## 🎯 Your Immediate Action

### Right Now:
1. Make sure dev server is running:
   ```bash
   npm run dev
   ```

2. Open in browser:
   ```
   test-embed-localhost.html
   ```

3. Verify chatbot works:
   - Click buttons
   - Send messages
   - Check console (F12)

### If It Works:
✅ Embed script is functional!  
✅ Ready to deploy to production  
✅ Ready to add to external websites  

### If It Doesn't Work:
- Check dev server is running (npm run dev)
- Check localhost:3000 loads the chatbot
- Open F12 console and look for red errors
- Verify http://localhost:3000/chatbot-embed.js is accessible

---

## 📞 Quick Help

| Problem | Check |
|---------|-------|
| Button not showing | Open F12 console for errors |
| Chat blank | Verify http://localhost:3000 works |
| No responses | Check Network tab for API errors |
| 404 errors | Ensure dev server is running |

---

## Next Steps

1. **This Hour:** Test with localhost
2. **This Week:** Verify everything works
3. **Next Week:** Deploy to Vercel
4. **Production:** Update embed script URL and distribute

You're ready! Start testing now. 🚀
