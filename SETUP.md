# Setup Guide - Моят Глас

Complete setup guide including Telegram integration and user system configuration.

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Supabase account (free tier)
- Upstash Redis account (free tier)
- Telegram Bot (via @BotFather)

---

## Step 1: Install Dependencies

```bash
npm install
```

---

## Step 2: Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Run the migration file: `supabase/migrations/001_initial_schema.sql`
4. Copy your project URL and anon key from Settings > API

**Note**: If using the extended user management system, ensure:
- `voting_user_profiles` table exists
- `get_or_create_voting_user_from_telegram` function exists
- `update_voting_user_last_login` function exists

---

## Step 3: Set Up Upstash Redis

1. Create account at [upstash.com](https://upstash.com)
2. Create a new Redis database (free tier)
3. Copy the REST URL and token

---

## Step 4: Create Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow instructions to create your bot
4. **Save the bot token** (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
5. Note bot username (without @)
6. Send `/setdomain` to BotFather
7. Enter your domain (e.g., `yourdomain.com` or `your-app.netlify.app`)

**Important**: Domain must match your deployment URL. For local development, use ngrok or similar tunnel.

---

## Step 5: Configure Environment Variables

Create `.env.local` file:

```env
# Telegram Bot Configuration (REQUIRED)
NEXT_PUBLIC_TELEGRAM_BOT_NAME=your_bot_username
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather

# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://igjkhyisdwezrnjhgsta.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Upstash Redis (REQUIRED for rate limiting)
UPSTASH_REDIS_URL=https://your-redis.upstash.io
UPSTASH_REDIS_TOKEN=your_redis_token

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Local dev
# NEXT_PUBLIC_APP_URL=https://your-domain.com  # Production
```

**Environment Variable Details:**

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_TELEGRAM_BOT_NAME` | Bot username (without @) | From BotFather after creating bot |
| `TELEGRAM_BOT_TOKEN` | Bot API token | From BotFather after creating bot |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard → Settings → API |
| `UPSTASH_REDIS_URL` | Redis REST URL | Upstash Dashboard → Database → REST URL |
| `UPSTASH_REDIS_TOKEN` | Redis REST token | Upstash Dashboard → Database → REST Token |
| `NEXT_PUBLIC_APP_URL` | Your app URL | Your deployment URL |

---

## Step 6: Local Development Setup (HTTPS Required)

For local testing, you need HTTPS:

1. **Option A: Use ngrok (Recommended)**
   ```bash
   # Install ngrok
   npm install -g ngrok
   
   # Start Next.js dev server
   npm run dev
   
   # In another terminal, create tunnel
   ngrok http 3000
   
   # Use ngrok URL (e.g., https://abc123.ngrok.io) in:
   # - BotFather /setdomain command
   # - NEXT_PUBLIC_APP_URL environment variable
   ```

2. **Option B: Use localtunnel**
   ```bash
   npm install -g localtunnel
   lt --port 3000
   ```

3. **Option C: Deploy to staging first**
   - Deploy to Netlify/Vercel
   - Use staging URL for testing

---

## Step 7: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Step 8: Testing Checklist

### Pre-Deployment Testing

- [ ] **Environment Variables**
  - [ ] All required variables are set
  - [ ] `NEXT_PUBLIC_TELEGRAM_BOT_NAME` matches bot username
  - [ ] `TELEGRAM_BOT_TOKEN` is valid
  - [ ] Bot domain is set in BotFather

- [ ] **Database**
  - [ ] Supabase migration ran successfully
  - [ ] `voters` table exists
  - [ ] Can insert test voter record

- [ ] **Local Testing** (if using tunnel)
  - [ ] ngrok/localtunnel is running
  - [ ] Domain set in BotFather matches tunnel URL
  - [ ] `NEXT_PUBLIC_APP_URL` matches tunnel URL

### Functionality Testing

- [ ] **Login Flow**
  - [ ] Visit `/login` page
  - [ ] Telegram Login Widget appears
  - [ ] Click "Login with Telegram"
  - [ ] Telegram authentication popup opens
  - [ ] After auth, redirects to `/elections`
  - [ ] Voter record created in database

- [ ] **Authentication Verification**
  - [ ] Check browser console for errors
  - [ ] Verify API call to `/api/auth/telegram/verify` succeeds
  - [ ] Check Supabase `voters` table for new record
  - [ ] Verify `localStorage` contains `telegram_auth` and `telegram_id`

---

## Telegram Integration Status

### ✅ Implementation Complete

All Telegram integration components are implemented and production-ready:

1. **Telegram Login Widget** (`components/telegram-login.tsx`) ✅
2. **Backend Verification API** (`app/api/auth/telegram/verify/route.ts`) ✅
3. **Authentication Library** (`lib/telegram-auth.ts`) ✅
4. **Login Page** (`app/(auth)/login/page.tsx`) ✅
5. **Database Schema** (includes `voters` table) ✅

### How Telegram Authentication Works

1. User clicks "Login with Telegram"
2. Telegram authenticates the user
3. Widget returns user data with cryptographic hash
4. Backend verifies hash using HMAC-SHA-256
5. Voter profile created/updated in database
6. Session stored and user redirected

### Security Features

- ✅ HMAC-SHA-256 hash verification
- ✅ 24-hour auth expiry validation
- ✅ Server-side token storage
- ✅ Rate limiting integrated

---

## User Management System

The platform includes an extended user management system with:

### Tables
- `voting_user_profiles` - Main user profiles with roles (voter/admin/moderator)
- `voting_user_sessions` - Session tracking
- `voters` - Backward compatible voter records

### Functions
- `get_or_create_voting_user_from_telegram()` - Create user from Telegram auth
- `update_voting_user_last_login()` - Track login activity

### TypeScript Library
- `lib/user-management.ts` - User management functions

See database migrations for full schema details.

---

## Troubleshooting

### Telegram Login Widget Not Appearing
- Check `NEXT_PUBLIC_TELEGRAM_BOT_NAME` is set correctly
- Verify bot exists and is active
- Check browser console for JavaScript errors
- Ensure domain is set in BotFather
- Verify HTTPS is enabled (required for production)

### "Bot token не е конфигуриран" Error
- Check `TELEGRAM_BOT_TOKEN` is set in environment variables
- Verify token format (should be: `123456789:ABC...`)
- Restart dev server after adding environment variables

### "Невалидна автентификация" Error
- Verify bot token is correct
- Check domain matches BotFather setting
- Verify auth is not older than 24 hours

### Database Errors
- Check Supabase connection
- Verify RLS policies
- Check service role key permissions

### Rate Limiting Not Working
- Verify Upstash Redis credentials
- Check free tier limits (10K commands/day)
- Check network connectivity

---

## Next Steps

1. Customize Bulgarian translations in `messages/bg.json`
2. Create test elections (see FEATURES.md)
3. Set up monitoring and alerts
4. Configure backup and recovery
5. Deploy to production (see DEPLOYMENT.md)

---

## Support Resources

- **Telegram Bot API Docs**: https://core.telegram.org/bots/api
- **Telegram Login Widget**: https://core.telegram.org/widgets/login
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Upstash Redis Docs**: https://docs.upstash.com/redis

---

**Status**: ✅ Ready for configuration and deployment!
