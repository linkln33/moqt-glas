# Set Environment Variables

The following environment variables need to be set in Netlify for the Telegram bot to work.

## Already Set ✅
- `NEXT_PUBLIC_SUPABASE_URL` = `https://igjkhyisdwezrnjhgsta.supabase.co`
- `NEXT_PUBLIC_APP_URL` = `https://moqt-glas.netlify.app`

## Need to Set 🔧

Run these commands (replace with your actual values):

```bash
# Telegram Bot
netlify env:set NEXT_PUBLIC_TELEGRAM_BOT_NAME "your_bot_username" --context production
netlify env:set TELEGRAM_BOT_TOKEN "your_bot_token" --context production

# Supabase
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "your_anon_key" --context production
netlify env:set SUPABASE_SERVICE_ROLE_KEY "your_service_role_key" --context production

# Upstash Redis
netlify env:set UPSTASH_REDIS_URL "https://your-redis.upstash.io" --context production
netlify env:set UPSTASH_REDIS_TOKEN "your_redis_token" --context production
```

## Or Use the Interactive Script

```bash
npm run setup-bot
```

This will prompt you for all values and set them automatically.

## Verify

Check all environment variables:

```bash
netlify env:list
```

## After Setting Variables

1. Update Telegram bot domain in @BotFather:
   - Send: `/setdomain`
   - Enter: `moqt-glas.netlify.app`

2. Trigger deployment:
   ```bash
   netlify deploy --prod
   ```

3. Test your site: https://moqt-glas.netlify.app
