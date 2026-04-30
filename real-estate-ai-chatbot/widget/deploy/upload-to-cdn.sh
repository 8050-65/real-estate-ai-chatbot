#!/bin/bash
# =============================================================================
# Leadrat AI Chatbot — CDN Upload Script
# =============================================================================
# Usage:  chmod +x upload-to-cdn.sh && ./upload-to-cdn.sh
#
# Set these env vars before running:
#   export AWS_BUCKET="your-s3-bucket"
#   export AWS_CF_ID="your-cloudfront-distribution-id"
#   export CDN_BASE_URL="https://cdn.yourdomain.com"
# =============================================================================

set -e

DIST_DIR="$(dirname "$0")/../dist"
BUCKET="${AWS_BUCKET:-YOUR_BUCKET_NAME}"
CF_ID="${AWS_CF_ID:-YOUR_CF_DISTRIBUTION_ID}"
PREFIX="chatbot"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Leadrat AI Chatbot — CDN Deploy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Option A: AWS S3 + CloudFront ─────────────────────────────────────────────
if command -v aws &> /dev/null; then
  echo "→ Uploading leadrat-chat.js to S3..."
  aws s3 cp "$DIST_DIR/leadrat-chat.js" \
    "s3://$BUCKET/$PREFIX/leadrat-chat.js" \
    --cache-control "public,max-age=86400" \
    --content-type "application/javascript" \
    --acl public-read

  echo "→ Uploading chat-ui.html to S3..."
  aws s3 cp "$DIST_DIR/chat-ui.html" \
    "s3://$BUCKET/$PREFIX/chat-ui.html" \
    --cache-control "public,max-age=3600" \
    --content-type "text/html; charset=utf-8" \
    --acl public-read

  echo "→ Invalidating CloudFront cache..."
  aws cloudfront create-invalidation \
    --distribution-id "$CF_ID" \
    --paths "/$PREFIX/*"

  echo ""
  echo "✅ Deployed to AWS S3 + CloudFront"
  echo ""
  echo "Embed URLs:"
  echo "  JS  : https://cdn.yourdomain.com/$PREFIX/leadrat-chat.js"
  echo "  HTML: https://cdn.yourdomain.com/$PREFIX/chat-ui.html"

# ── Option B: Cloudflare R2 with wrangler ─────────────────────────────────────
elif command -v wrangler &> /dev/null; then
  echo "→ Uploading via Cloudflare R2 (wrangler)..."
  wrangler r2 object put "$BUCKET/$PREFIX/leadrat-chat.js" \
    --file "$DIST_DIR/leadrat-chat.js" \
    --content-type "application/javascript"

  wrangler r2 object put "$BUCKET/$PREFIX/chat-ui.html" \
    --file "$DIST_DIR/chat-ui.html" \
    --content-type "text/html; charset=utf-8"

  echo "✅ Deployed to Cloudflare R2"

# ── Option C: Google Cloud Storage ────────────────────────────────────────────
elif command -v gsutil &> /dev/null; then
  echo "→ Uploading to Google Cloud Storage..."
  gsutil -h "Cache-Control:public,max-age=86400" \
    -h "Content-Type:application/javascript" \
    cp "$DIST_DIR/leadrat-chat.js" "gs://$BUCKET/$PREFIX/leadrat-chat.js"

  gsutil -h "Cache-Control:public,max-age=3600" \
    -h "Content-Type:text/html; charset=utf-8" \
    cp "$DIST_DIR/chat-ui.html" "gs://$BUCKET/$PREFIX/chat-ui.html"

  gsutil acl ch -u AllUsers:R "gs://$BUCKET/$PREFIX/leadrat-chat.js"
  gsutil acl ch -u AllUsers:R "gs://$BUCKET/$PREFIX/chat-ui.html"

  echo "✅ Deployed to Google Cloud Storage"

else
  echo "❌ No cloud CLI found. Install one of:"
  echo "   AWS CLI   : https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
  echo "   Wrangler  : npm install -g wrangler"
  echo "   gsutil    : https://cloud.google.com/storage/docs/gsutil_install"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Required CDN Response Headers:"
echo "  Access-Control-Allow-Origin: *"
echo "  Cache-Control: public, max-age=86400"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
