# Telegram Integration - Quick Setup Checklist

## ✅ Pre-Setup Verification

- [x] Telegram Login Widget component implemented
- [x] Backend verification API implemented
- [x] Authentication library ready
- [x] Database schema includes `voters` table
- [x] Login page with UI ready

## 🚀 Setup Steps (5 minutes)

### 1. Create Telegram Bot (2 min)
- [ ] Open Telegram → Search [@BotFather](https://t.me/botfather)
- [ ] Send `/newbot` and follow instructions
- [ ] **Save bot token** (format: `123456789:ABC...`)
- [ ] Note bot username (without @)

### 2. Configure Environment Variables (1 min)
Add to `.env.local` (local) or hosting platform (production):

```env
NEXT_PUBLIC_TELEGRAM_BOT_NAME=your_bot_username
TELEGRAM_BOT_TOKEN=your_bot_token
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or production URL
```

### 3. Set Bot Domain (1 min)
- [ ] Get your app URL (e.g., `your-app.netlify.app`)
- [ ] Message @BotFather: `/setdomain`
- [ ] Select your bot
- [ ] Enter domain: `your-app.netlify.app`

### 4. Run Database Migration (1 min)
- [ ] Go to Supabase Dashboard → SQL Editor
- [ ] Run: `supabase/migrations/001_initial_schema.sql`
- [ ] Verify `voters` table created

## 🧪 Quick Test

- [ ] Start dev server: `npm run dev`
- [ ] Visit `/login`
- [ ] Click "Login with Telegram"
- [ ] Authenticate in Telegram popup
- [ ] Should redirect to `/elections`
- [ ] Check Supabase `voters` table for new record

## 📋 Production Deployment

### Netlify/Vercel
- [ ] Add all environment variables in hosting dashboard
- [ ] Set `NEXT_PUBLIC_APP_URL` to production URL
- [ ] Set domain in BotFather to production domain
- [ ] Deploy and test

## 🔍 Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Widget not appearing | Check `NEXT_PUBLIC_TELEGRAM_BOT_NAME` |
| "Bot token не е конфигуриран" | Check `TELEGRAM_BOT_TOKEN` env var |
| "Невалидна автентификация" | Verify domain in BotFather matches URL |
| No callback after auth | Ensure HTTPS and domain configured |
| Voter not created | Check Supabase connection and RLS policies |

## 📚 Full Documentation

See [TELEGRAM_INTEGRATION_PREP.md](./TELEGRAM_INTEGRATION_PREP.md) for:
- Detailed setup instructions
- Complete troubleshooting guide
- Security considerations
- Code reference

---

**Status**: Ready to configure! 🎉
