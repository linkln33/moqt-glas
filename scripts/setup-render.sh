#!/bin/bash

# Render Configuration Script for Telegram Bot
# This script helps configure all environment variables in Render

set -e

echo "🚀 Render Configuration Script for Telegram Bot"
echo "=============================================="
echo ""
echo "This script will help you set all required environment variables."
echo "Make sure you have:"
echo "  1. Created a Render account at https://render.com"
echo "  2. Deployed your service to Render"
echo "  3. Have your service URL ready"
echo ""

read -p "Press Enter to continue or Ctrl+C to exit..."

echo ""
echo "📝 Please provide the following information:"
echo "   (Press Enter to skip if you want to set manually later)"
echo ""

read -p "Render Service URL (e.g., https://moqt-glas.onrender.com): " RENDER_URL
read -p "Telegram Bot Username (without @): " TELEGRAM_BOT_NAME
read -sp "Telegram Bot Token: " TELEGRAM_BOT_TOKEN
echo ""
read -p "Supabase URL [https://igjkhyisdwezrnjhgsta.supabase.co]: " SUPABASE_URL
SUPABASE_URL=${SUPABASE_URL:-https://igjkhyisdwezrnjhgsta.supabase.co}
read -sp "Supabase Anon Key: " SUPABASE_ANON_KEY
echo ""
read -sp "Supabase Service Role Key: " SUPABASE_SERVICE_ROLE_KEY
echo ""

echo ""
echo "📋 Environment Variables to Set in Render:"
echo "=========================================="
echo ""
echo "Go to: Render Dashboard → Your Service → Environment"
echo ""
echo "Add these variables:"
echo ""
echo "NODE_VERSION=20"
echo "NPM_FLAGS=--legacy-peer-deps"
echo "NEXT_PUBLIC_TELEGRAM_BOT_NAME=$TELEGRAM_BOT_NAME"
echo "TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN"
echo "NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY"
echo "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY"
echo "NEXT_PUBLIC_APP_URL=$RENDER_URL"
echo ""

if [ -n "$RENDER_URL" ]; then
  DOMAIN=$(echo $RENDER_URL | sed 's|https\?://||' | sed 's|/.*||')
  echo "📋 Next steps:"
  echo "1. Set the environment variables above in Render Dashboard"
  echo "2. Update Telegram bot domain in @BotFather:"
  echo "   - Send: /setdomain"
  echo "   - Enter: $DOMAIN"
  echo "3. Save changes in Render (will trigger redeploy)"
  echo "4. Test your site: $RENDER_URL"
  echo ""
fi
