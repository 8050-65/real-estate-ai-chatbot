#!/usr/bin/env node

/**
 * Local development server for Leadrat Chat Widget
 *
 * Usage: node serve-local.js [port]
 * Example: node serve-local.js 3000
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.argv[2] || 3000;
const DIST_DIR = path.join(__dirname, "dist");
const TEST_FILE = path.join(__dirname, "test-local.html");

const MIME_TYPES = {
  ".js": "application/javascript",
  ".html": "text/html",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const server = http.createServer((req, res) => {
  // Add CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-cache");

  // Handle OPTIONS
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Serve test page at root
  if (req.url === "/" || req.url === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(fs.readFileSync(TEST_FILE));
    return;
  }

  // Serve dist files
  if (req.url.startsWith("/dist/")) {
    const filePath = path.join(
      DIST_DIR,
      req.url.replace("/dist/", "")
    );

    if (fs.existsSync(filePath) && filePath.startsWith(DIST_DIR)) {
      const ext = path.extname(filePath);
      const mimeType = MIME_TYPES[ext] || "application/octet-stream";

      res.writeHead(200, { "Content-Type": mimeType });
      res.end(fs.readFileSync(filePath));
      return;
    }
  }

  // 404
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("404 Not Found");
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`
╔════════════════════════════════════════════════════╗
║   Leadrat Chat Widget - Local Development Server   ║
╚════════════════════════════════════════════════════╝

📍 URL: ${url}
📍 Test Page: ${url}/
📍 Widget Script: ${url}/dist/leadrat-chat.js
📍 Chat UI: ${url}/dist/chat-ui.html

📋 Configuration:
   API URL: http://localhost:8000/api/v1/chat
   Bot Name: Leadrat Assistant
   Primary Color: #6C63FF

🚀 Next Steps:
   1. Make sure your backend is running (http://localhost:8000)
   2. Open ${url} in your browser
   3. Enter your API endpoint and click "Load Widget"
   4. Test the chat interface

💡 Quick test API:
   curl -X POST http://localhost:8000/api/v1/chat/message \\
     -H "Content-Type: application/json" \\
     -d '{"message":"Hello!","session_id":"test","tenant_id":"dubait11","conversation_history":[]}'

Press Ctrl+C to stop the server.
  `);
});

process.on("SIGINT", () => {
  console.log("\n\nServer stopped.");
  process.exit(0);
});
