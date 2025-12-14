# Telegram Integration - Preparation & Setup Guide

## 📋 Current Implementation Status

### ✅ Already Implemented

1. **Telegram Login Widget Component** (`components/telegram-login.tsx`)
   - Client-side widget integration
   - Handles Telegram authentication callback
   - Proper cleanup and error handling

2. **Backend Verification API** (`app/api/auth/telegram/verify/route.ts`)
   - HMAC-SHA-256 hash verification
   - Auth date validation (24-hour expiry)
   - Voter profile creation/update in Supabase
   - Error handling with Bulgarian messages

3. **Authentication Library** (`lib/telegram-auth.ts`)
   - `verifyTelegramAuth()` - Cryptographic verification
   - `getTelegramId()` - Extract Telegram user ID
   - Type-safe interfaces

4. **Login Page** (`app/(auth)/login/page.tsx`)
   - Beautiful glass-morphism UI
   - Loading states
   - Error handling
   - Redirect to elections after auth

5. **Database Schema** (`supabase/migrations/001_initial_schema.sql`)
   - `voters` table with Telegram ID as primary key
   - Proper indexes and constraints
   - Support for username, photo_url, etc.

---

## 🔧 Required Configuration

### Step 1: Create Telegram Bot

1. **Open Telegram** and search for [@BotFather](https://t.me/botfather)

2. **Create a new bot:**
   ```
   /newbot
   ```
   - Follow prompts to set bot name and username
   - **Save the bot token** (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

3. **Set bot domain** (for Login Widget):
   ```
   /setdomain
   ```
   - Select your bot
   - Enter your domain (e.g., `yourdomain.com` or `your-app.netlify.app`)
   - **Important**: Domain must match your deployment URL

4. **Optional - Configure bot settings:**
   ```
   /setdescription - Set bot description
   /setabouttext - Set about text
   /setuserpic - Set bot profile picture
   ```

### Step 2: Environment Variables

Create `.env.local` (for local development) or configure in your hosting platform:

```env
# Telegram Bot Configuration (REQUIRED)
NEXT_PUBLIC_TELEGRAM_BOT_NAME=your_bot_username
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather

# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
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

### Step 3: Database Setup

1. **Run Supabase Migration:**
   - Go to Supabase Dashboard → SQL Editor
   - Run: `supabase/migrations/001_initial_schema.sql`
   - Verify tables are created:
     - `voters`
     - `elections`
     - `questions`
     - `options`
     - `votes`
     - `suspicious_activities`

2. **Verify RLS Policies:**
   - Check that Row Level Security is configured
   - Service role key should bypass RLS for API routes

### Step 4: Local Development Setup

**For local testing, you need HTTPS:**

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

## 🧪 Testing Checklist

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

- [ ] **Error Handling**
  - [ ] Test with invalid bot token (should show error)
  - [ ] Test with expired auth (should reject)
  - [ ] Test with missing environment variables

- [ ] **Security**
  - [ ] Verify hash validation works (try tampering with auth data)
  - [ ] Check auth date validation (24-hour expiry)
  - [ ] Verify duplicate Telegram IDs are handled (upsert)

---

## 🚀 Deployment Checklist

### Netlify Deployment

1. **Environment Variables in Netlify:**
   - Go to Site settings → Environment variables
   - Add all required variables
   - **Important**: Use production domain for `NEXT_PUBLIC_APP_URL`

2. **Bot Domain Configuration:**
   - Get your Netlify site URL (e.g., `https://moqt-glas.netlify.app`)
   - Extract domain: `moqt-glas.netlify.app`
   - Message @BotFather: `/setdomain`
   - Enter domain: `moqt-glas.netlify.app`

3. **Redeploy:**
   - After setting environment variables, trigger redeploy
   - Clear cache and deploy

### Vercel Deployment

1. **Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add all required variables
   - Set for Production, Preview, and Development

2. **Bot Domain:**
   - Same as Netlify - set domain in BotFather

---

## 🔍 Troubleshooting

### Issue: Telegram Login Widget Not Appearing

**Symptoms:**
- Widget doesn't load
- Blank space where widget should be

**Solutions:**
1. Check `NEXT_PUBLIC_TELEGRAM_BOT_NAME` is set correctly
2. Verify bot exists and is active
3. Check browser console for JavaScript errors
4. Ensure domain is set in BotFather
5. Verify HTTPS is enabled (required for production)

### Issue: "Bot token не е конфигуриран" Error

**Symptoms:**
- Error message after clicking login
- 500 error from API

**Solutions:**
1. Check `TELEGRAM_BOT_TOKEN` is set in environment variables
2. Verify token format (should be: `123456789:ABC...`)
3. Restart dev server after adding environment variables
4. Check token is not expired (regenerate if needed)

### Issue: "Невалидна автентификация" Error

**Symptoms:**
- Authentication fails
- 401 error from API

**Solutions:**
1. Verify bot token is correct
2. Check domain matches BotFather setting
3. Ensure auth data is not tampered with
4. Verify auth is not older than 24 hours
5. Check hash verification logic in `lib/telegram-auth.ts`

### Issue: Widget Opens But Doesn't Callback

**Symptoms:**
- Telegram popup opens
- User authenticates
- Nothing happens after

**Solutions:**
1. Check domain is set correctly in BotFather
2. Verify `NEXT_PUBLIC_APP_URL` matches deployment URL
3. Check browser console for callback errors
4. Ensure HTTPS is used (required)
5. Verify `handleTelegramAuth` function is defined globally

### Issue: Voter Not Created in Database

**Symptoms:**
- Auth succeeds but no database record

**Solutions:**
1. Check Supabase connection
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
3. Check RLS policies allow inserts
4. Verify `voters` table exists
5. Check Supabase logs for errors

### Issue: Domain Already Used Error

**Symptoms:**
- BotFather says domain is already set for another bot

**Solutions:**
1. You can only use one bot per domain
2. Either use a different domain or different bot
3. For testing, use subdomain or different path

---

## 📚 Code Reference

### Key Files

- **Component**: `components/telegram-login.tsx`
- **API Route**: `app/api/auth/telegram/verify/route.ts`
- **Auth Library**: `lib/telegram-auth.ts`
- **Login Page**: `app/(auth)/login/page.tsx`
- **Database Schema**: `supabase/migrations/001_initial_schema.sql`

### How It Works

1. **User clicks "Login with Telegram"**
   - `TelegramLogin` component loads Telegram widget script
   - Widget renders login button

2. **User authenticates in Telegram**
   - Telegram popup opens
   - User confirms authentication
   - Telegram returns auth data with hash

3. **Frontend sends auth data to API**
   - `handleTelegramAuth` callback receives data
   - POST request to `/api/auth/telegram/verify`
   - Auth data includes: `id`, `first_name`, `username`, `hash`, etc.

4. **Backend verifies authentication**
   - Extracts hash from auth data
   - Creates data check string (sorted keys)
   - Computes HMAC-SHA-256 using bot token
   - Compares computed hash with received hash
   - Validates auth date (not older than 24 hours)

5. **Create/update voter profile**
   - Upsert voter in `voters` table
   - Use Telegram ID as primary key
   - Store name, username, photo URL

6. **Store session and redirect**
   - Save auth data to `localStorage`
   - Redirect to `/elections` page

---

## 🔐 Security Considerations

### ✅ Implemented Security Features

1. **Cryptographic Verification**
   - HMAC-SHA-256 hash verification
   - Prevents tampering with auth data
   - Only bot owner can verify

2. **Timestamp Validation**
   - Auth must be within 24 hours
   - Prevents replay attacks
   - Fresh authentication required

3. **Bot Token Security**
   - Stored in environment variables
   - Never exposed to client
   - Server-side verification only

### ⚠️ Security Best Practices

1. **Protect Bot Token**
   - Never commit to git
   - Use environment variables
   - Rotate if compromised

2. **HTTPS Required**
   - Telegram requires HTTPS for Login Widget
   - Use HTTPS in production
   - Use tunnel for local testing

3. **Domain Validation**
   - Only allow your domain in BotFather
   - Prevents unauthorized use
   - Verify domain matches deployment URL

4. **Rate Limiting**
   - Already implemented via Upstash Redis
   - Prevents brute force attacks
   - Limits per IP, device, Telegram ID

---

## 📝 Next Steps After Setup

1. **Test Complete Flow**
   - Create test election
   - Login with Telegram
   - Cast vote
   - View results

2. **Monitor Logs**
   - Check Supabase logs
   - Monitor API errors
   - Track authentication success rate

3. **Optimize UX**
   - Add loading states
   - Improve error messages
   - Add retry logic

4. **Add Features** (Optional)
   - Phone number collection via bot
   - Profile picture display
   - User settings page

---

## 🆘 Support Resources

- **Telegram Bot API Docs**: https://core.telegram.org/bots/api
- **Telegram Login Widget**: https://core.telegram.org/widgets/login
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Upstash Redis Docs**: https://docs.upstash.com/redis

---

## ✅ Final Checklist

Before going live:

- [ ] Bot created and token saved
- [ ] Domain set in BotFather
- [ ] All environment variables configured
- [ ] Database migration run
- [ ] Local testing completed
- [ ] Deployment successful
- [ ] Production environment variables set
- [ ] Production domain set in BotFather
- [ ] End-to-end testing passed
- [ ] Error handling verified
- [ ] Security measures in place

---

**Status**: ✅ Telegram integration is fully implemented and ready for configuration!
