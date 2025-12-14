# Environment Setup - Quick Guide

## ✅ What's Already Configured

- ✅ **Telegram Bot Token** - Added to `.env.local`
- ✅ **Supabase URL** - Configured
- ✅ **Supabase Anon Key** - Configured
- ✅ **Database Schema** - All tables and functions are set up
- ✅ **Example Elections** - 3 elections already exist in database

## ⚠️ What You Need to Complete

### 1. Telegram Bot Username

1. Open Telegram and go to [@BotFather](https://t.me/botfather)
2. Send `/mybots` to see your bots
3. Find the bot with token starting with `8061916889`
4. Note the bot username (e.g., `moqtglas_bot`)
5. Update `.env.local`:
   ```env
   NEXT_PUBLIC_TELEGRAM_BOT_NAME=your_actual_bot_username
   ```

### 2. Supabase Service Role Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `jntewcqbpvddjlgtacte`
3. Go to **Settings** → **API**
4. Find **service_role** key (⚠️ Keep this secret!)
5. Copy the key
6. Update `.env.local`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

### 3. Upstash Redis (Optional but Recommended)

For rate limiting functionality:

1. Create account at [upstash.com](https://upstash.com)
2. Create a new Redis database (free tier)
3. Copy the REST URL and token
4. Update `.env.local`:
   ```env
   UPSTASH_REDIS_URL=https://your-redis.upstash.io
   UPSTASH_REDIS_TOKEN=your_redis_token
   ```

**Note**: The app will work without Redis, but rate limiting won't function.

### 4. Set Telegram Bot Domain (For Production)

When deploying to production:

1. Go to [@BotFather](https://t.me/botfather)
2. Send `/setdomain`
3. Select your bot
4. Enter your domain (e.g., `your-app.netlify.app`)

## 🚀 After Configuration

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Test the setup**:
   - Visit http://localhost:3000
   - Try logging in with Telegram
   - Check that elections are displayed

## 📝 Current Database Status

- ✅ **Tables**: voters, elections, questions, options, votes, voting_user_profiles
- ✅ **Functions**: All user management functions are ready
- ✅ **Example Data**: 3 elections already exist

## 🔒 Security Notes

- ⚠️ Never commit `.env.local` to git (it's in `.gitignore`)
- ⚠️ Keep your bot token and service role key secret
- ⚠️ If tokens are exposed, revoke them immediately

## 🐛 Troubleshooting

### "Bot token не е конфигуриран"
- Check `TELEGRAM_BOT_TOKEN` is set correctly
- Restart dev server after adding env vars

### "Telegram ботът не е конфигуриран"
- Check `NEXT_PUBLIC_TELEGRAM_BOT_NAME` is set
- Verify bot username matches exactly (no @ symbol)

### Database Errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check Supabase project is active
- Verify RLS policies allow operations
