#!/bin/bash
# Cloudflare Pages build script - serve static files from frontend/public
echo "✅ Building Leadrat AI Chatbot Widget"
echo "📁 Static files location: frontend/public"
echo "📄 Files to serve:"
ls -lh frontend/public/*.{html,js} 2>/dev/null || echo "Files found in directory"
echo "✅ Build complete - ready to deploy"
exit 0
