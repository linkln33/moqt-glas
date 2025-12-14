#!/bin/bash

# Quick script to set Netlify environment variables
# Usage: ./scripts/set-netlify-env.sh

set -e

echo "🔧 Netlify Environment Variables Setup"
echo "======================================"
echo ""
echo "This script will help you set all required environment variables."
echo "Make sure you're logged in with: palmheist@gmail.com"
echo ""

# Check if site is linked
if [ ! -f ".netlify/state.json" ] || grep -q "placeholder" .netlify/state.json 2>/dev/null; then
    echo "⚠️  Site not linked. Please run: netlify link"
    echo "   Or provide your site ID:"
    read -p "Site ID: " SITE_ID
    if [ -n "$SITE_ID" ]; then
        mkdir -p .netlify
        echo "{\"siteId\": \"$SITE_ID\"}" > .netlify/state.json
    fi
fi

SITE_ID=$(cat .netlify/state.json 2>/dev/null | grep -o '"siteId":"[^"]*"' | cut -d'"' -f4 || echo "")

if [ -z "$SITE_ID" ] || [ "$SITE_ID" == "placeholder" ]; then
    echo "❌ Please link your site first: netlify link"
    exit 1
fi

echo "✅ Site ID: $SITE_ID"
echo ""

# Get site URL
SITE_URL=$(netlify api getSite --data "{\"site_id\": \"$SITE_ID\"}" 2>/dev/null | grep -o '"url":"[^"]*"' | cut -d'"' -f4 || echo "")
if [ -z "$SITE_URL" ]; then
    SITE_URL="https://$SITE_ID.netlify.app"
fi

echo "🌐 Site URL: $SITE_URL"
echo ""
echo "📝 Please provide the following values:"
echo "   (Press Enter to skip if you want to set manually later)"
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

# Set each variable
[ -n "$TELEGRAM_BOT_NAME" ] && netlify env:set NEXT_PUBLIC_TELEGRAM_BOT_NAME "$TELEGRAM_BOT_NAME" --context production
[ -n "$TELEGRAM_BOT_TOKEN" ] && netlify env:set TELEGRAM_BOT_TOKEN "$TELEGRAM_BOT_TOKEN" --context production
[ -n "$SUPABASE_URL" ] && netlify env:set NEXT_PUBLIC_SUPABASE_URL "$SUPABASE_URL" --context production
[ -n "$SUPABASE_ANON_KEY" ] && netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "$SUPABASE_ANON_KEY" --context production
[ -n "$SUPABASE_SERVICE_ROLE_KEY" ] && netlify env:set SUPABASE_SERVICE_ROLE_KEY "$SUPABASE_SERVICE_ROLE_KEY" --context production
[ -n "$REDIS_URL" ] && netlify env:set UPSTASH_REDIS_URL "$REDIS_URL" --context production
[ -n "$REDIS_TOKEN" ] && netlify env:set UPSTASH_REDIS_TOKEN "$REDIS_TOKEN" --context production
[ -n "$APP_URL" ] && netlify env:set NEXT_PUBLIC_APP_URL "$APP_URL" --context production

echo ""
echo "✅ Environment variables set!"
echo ""
echo "📋 Next steps:"
echo "1. Update Telegram bot domain:"
echo "   - Open Telegram → @BotFather"
echo "   - Send: /setdomain"
echo "   - Enter: $(echo $APP_URL | sed 's|https\?://||' | sed 's|/.*||')"
echo ""
echo "2. Trigger deployment:"
echo "   netlify deploy --prod"
echo ""
