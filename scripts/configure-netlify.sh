#!/bin/bash

# Netlify Configuration Script for Telegram Bot
# This script helps configure all environment variables in Netlify

set -e

echo "🚀 Netlify Configuration Script for Telegram Bot"
echo "================================================"
echo ""

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI is not installed."
    echo "Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Check if logged in
if ! netlify status &> /dev/null; then
    echo "🔐 Please log in to Netlify..."
    netlify login
fi

# Get site info
echo ""
echo "📋 Getting site information..."
SITE_INFO=$(netlify status --json 2>/dev/null || echo "{}")
SITE_ID=$(echo "$SITE_INFO" | grep -o '"siteId":"[^"]*"' | cut -d'"' -f4 || echo "")

if [ -z "$SITE_ID" ] || [ "$SITE_ID" == "placeholder" ]; then
    echo "⚠️  No site linked. Please link your site first:"
    echo "   netlify link"
    echo ""
    read -p "Press Enter to continue after linking, or Ctrl+C to exit..."
    SITE_INFO=$(netlify status --json 2>/dev/null || echo "{}")
    SITE_ID=$(echo "$SITE_INFO" | grep -o '"siteId":"[^"]*"' | cut -d'"' -f4 || echo "")
fi

if [ -z "$SITE_ID" ] || [ "$SITE_ID" == "placeholder" ]; then
    echo "❌ Could not find site ID. Please run 'netlify link' first."
    exit 1
fi

echo "✅ Site ID: $SITE_ID"
echo ""

# Get current site URL
SITE_URL=$(netlify api getSite --data "{\"site_id\": \"$SITE_ID\"}" 2>/dev/null | grep -o '"url":"[^"]*"' | cut -d'"' -f4 || echo "")
if [ -z "$SITE_URL" ]; then
    SITE_URL="https://$SITE_ID.netlify.app"
fi

echo "🌐 Site URL: $SITE_URL"
echo ""

# Collect environment variables
echo "📝 Please provide the following information:"
echo ""

read -p "Telegram Bot Username (without @): " TELEGRAM_BOT_NAME
read -sp "Telegram Bot Token: " TELEGRAM_BOT_TOKEN
echo ""
read -p "Supabase URL [https://igjkhyisdwezrnjhgsta.supabase.co]: " SUPABASE_URL
SUPABASE_URL=${SUPABASE_URL:-https://igjkhyisdwezrnjhgsta.supabase.co}
read -sp "Supabase Anon Key: " SUPABASE_ANON_KEY
echo ""
read -sp "Supabase Service Role Key: " SUPABASE_SERVICE_ROLE_KEY
echo ""
read -p "Upstash Redis URL: " REDIS_URL
read -sp "Upstash Redis Token: " REDIS_TOKEN
echo ""
read -p "App URL [$SITE_URL]: " APP_URL
APP_URL=${APP_URL:-$SITE_URL}

echo ""
echo "🔧 Setting environment variables..."

# Set environment variables
netlify env:set NEXT_PUBLIC_TELEGRAM_BOT_NAME "$TELEGRAM_BOT_NAME"
netlify env:set TELEGRAM_BOT_TOKEN "$TELEGRAM_BOT_TOKEN"
netlify env:set NEXT_PUBLIC_SUPABASE_URL "$SUPABASE_URL"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "$SUPABASE_ANON_KEY"
netlify env:set SUPABASE_SERVICE_ROLE_KEY "$SUPABASE_SERVICE_ROLE_KEY"
netlify env:set UPSTASH_REDIS_URL "$REDIS_URL"
netlify env:set UPSTASH_REDIS_TOKEN "$REDIS_TOKEN"
netlify env:set NEXT_PUBLIC_APP_URL "$APP_URL"

echo ""
echo "✅ Environment variables configured!"
echo ""
echo "📋 Next steps:"
echo "1. Update Telegram bot domain in BotFather:"
echo "   - Open Telegram → @BotFather"
echo "   - Send: /setdomain"
echo "   - Enter domain: $(echo $APP_URL | sed 's|https\?://||' | sed 's|/.*||')"
echo ""
echo "2. Trigger a new deployment:"
echo "   netlify deploy --prod"
echo ""
echo "3. Or trigger from dashboard:"
echo "   https://app.netlify.com/sites/$SITE_ID/deploys"
echo ""
