#!/usr/bin/env pwsh
# =============================================================================
# Leadrat Widget — Cloudflare Pages Deploy Script (Windows PowerShell)
# =============================================================================
# Run this once to deploy widget/dist to Cloudflare Pages:
#
#   .\deploy\deploy-cloudflare.ps1
#
# Prerequisites:
#   1. Cloudflare account (free): https://dash.cloudflare.com/sign-up
#   2. API Token with "Cloudflare Pages: Edit" permission
#      → https://dash.cloudflare.com/profile/api-tokens
#      → Click "Create Token" → use template "Edit Cloudflare Pages"
#   3. Node.js 18+ installed
# =============================================================================

param(
  [string]$ApiToken = $env:CLOUDFLARE_API_TOKEN,
  [string]$ProjectName = "leadrat-chat-widget",
  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"
$DistDir = Join-Path $PSScriptRoot "..\dist"

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Leadrat Widget — Cloudflare Pages Deploy" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Check API token ────────────────────────────────────────────────────
if (-not $ApiToken) {
  Write-Host "❌ CLOUDFLARE_API_TOKEN not set." -ForegroundColor Red
  Write-Host ""
  Write-Host "Get one from: https://dash.cloudflare.com/profile/api-tokens" -ForegroundColor Yellow
  Write-Host "  1. Click 'Create Token'"
  Write-Host "  2. Use template: 'Edit Cloudflare Pages'"
  Write-Host "  3. Copy the token, then run:"
  Write-Host ""
  Write-Host '  $env:CLOUDFLARE_API_TOKEN = "paste-token-here"' -ForegroundColor Green
  Write-Host '  .\deploy\deploy-cloudflare.ps1' -ForegroundColor Green
  Write-Host ""
  exit 1
}

# ── Step 2: Verify dist files ──────────────────────────────────────────────────
Write-Host "→ Checking dist files..." -ForegroundColor Gray
$required = @("leadrat-chat.js", "chat-ui.html", "_headers")
foreach ($f in $required) {
  $path = Join-Path $DistDir $f
  if (-not (Test-Path $path)) {
    Write-Host "❌ Missing: $path" -ForegroundColor Red
    exit 1
  }
  $size = (Get-Item $path).Length
  Write-Host "  ✓ $f ($size bytes)" -ForegroundColor Green
}

# ── Step 3: Deploy via Wrangler ────────────────────────────────────────────────
Write-Host ""
Write-Host "→ Deploying to Cloudflare Pages..." -ForegroundColor Gray
Write-Host "  Project : $ProjectName" -ForegroundColor Gray
Write-Host "  Branch  : $Branch" -ForegroundColor Gray
Write-Host "  Folder  : $DistDir" -ForegroundColor Gray
Write-Host ""

$env:CLOUDFLARE_API_TOKEN = $ApiToken

npx -y wrangler@latest pages deploy $DistDir `
  --project-name $ProjectName `
  --branch $Branch `
  --commit-dirty=true

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
  Write-Host "  ✅ Deployed Successfully!" -ForegroundColor Green
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
  Write-Host ""
  Write-Host "  CDN URLs (live within ~60 seconds):" -ForegroundColor White
  Write-Host "  JS  : https://$ProjectName.pages.dev/leadrat-chat.js" -ForegroundColor Cyan
  Write-Host "  HTML: https://$ProjectName.pages.dev/chat-ui.html" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "  Embed snippet:" -ForegroundColor White
  Write-Host @"

  <script>
    window.LeadratChatConfig = {
      apiUrl:       "https://real-estate-rag-dev.onrender.com/api/v1/chat/message",
      botName:      "Leadrat Assistant",
      botSubtitle:  "Real Estate AI",
      primaryColor: "#6C63FF",
      tenantId:     "dubait11"
    };
  </script>
  <script src="https://$ProjectName.pages.dev/leadrat-chat.js" async></script>

"@ -ForegroundColor Yellow
} else {
  Write-Host ""
  Write-Host "❌ Deploy failed. Check output above." -ForegroundColor Red
  exit 1
}
