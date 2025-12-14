# Configure Netlify for Telegram Bot

This guide will help you configure all environment variables in Netlify using the CLI.

## Prerequisites

- Netlify CLI installed (already done ✅)
- Logged in with: `palmheist@gmail.com`
- Your site linked to Netlify

## Quick Setup

### Option 1: Interactive Script (Recommended)

Run the interactive configuration script:

```bash
npm run configure-netlify
```

This will:
1. Check if you're logged in
2. Link your site (if needed)
3. Prompt for all environment variables
4. Set them in Netlify

### Option 2: Manual CLI Commands

If you prefer to set variables manually:

```bash
# First, link your site (if not already linked)
netlify link

# Then set each environment variable:
netlify env:set NEXT_PUBLIC_TELEGRAM_BOT_NAME "your_bot_username" --context production
netlify env:set TELEGRAM_BOT_TOKEN "your_bot_token" --context production
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://igjkhyisdwezrnjhgsta.supabase.co" --context production
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "your_anon_key" --context production
netlify env:set SUPABASE_SERVICE_ROLE_KEY "your_service_role_key" --context production
netlify env:set UPSTASH_REDIS_URL "https://your-redis.upstash.io" --context production
netlify env:set UPSTASH_REDIS_TOKEN "your_redis_token" --context production
netlify env:set NEXT_PUBLIC_APP_URL "https://your-domain.com" --context production
```

### Option 3: Shell Script

Run the shell script:

```bash
./scripts/set-netlify-env.sh
```

## Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_TELEGRAM_BOT_NAME` | Bot username (without @) | `my_bot` |
| `TELEGRAM_BOT_TOKEN` | Bot token from BotFather | `123456:ABC-DEF...` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGc...` |
| `UPSTASH_REDIS_URL` | Upstash Redis REST URL | `https://xxx.upstash.io` |
| `UPSTASH_REDIS_TOKEN` | Upstash Redis token | `AX...` |
| `NEXT_PUBLIC_APP_URL` | Your app URL | `https://your-domain.com` |

## Verify Configuration

Check your environment variables:

```bash
netlify env:list
```

## After Configuration

1. **Update Telegram Bot Domain:**
   - Open Telegram → @BotFather
   - Send: `/setdomain`
   - Enter your domain (e.g., `your-domain.com` or `your-site.netlify.app`)

2. **Trigger Deployment:**
   ```bash
   netlify deploy --prod
   ```
   
   Or trigger from Netlify Dashboard → Deploys → "Trigger deploy"

3. **Test:**
   - Visit your site
   - Test Telegram login
   - Verify all features work

## Troubleshooting

### Not Logged In

```bash
netlify logout
netlify login
# Make sure to use: palmheist@gmail.com
```

### Site Not Linked

```bash
netlify link
# Select your site from the list
```

### Check Current Status

```bash
netlify status
```

### View Environment Variables

```bash
netlify env:list
```

### Update a Single Variable

```bash
netlify env:set VARIABLE_NAME "value" --context production
```

### Delete a Variable

```bash
netlify env:unset VARIABLE_NAME --context production
```

## Next Steps

After configuring:
- ✅ All environment variables set
- ✅ Telegram bot domain updated in BotFather
- ✅ New deployment triggered
- ✅ Site tested and working

Your Telegram bot should now work! 🎉
