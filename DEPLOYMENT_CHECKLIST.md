# Deployment Checklist

## ✅ Pre-Deployment

- [x] Code pushed to GitHub: https://github.com/linkln33/moqt-glas
- [x] Netlify configuration added (`netlify.toml`)
- [x] Node version specified (`.nvmrc`)
- [x] Environment variables documented

## 📋 Netlify Setup Steps

### 1. Connect Repository
- [ ] Go to [Netlify Dashboard](https://app.netlify.com)
- [ ] Click **"Add new site"** → **"Import an existing project"**
- [ ] Connect to GitHub
- [ ] Select repository: `linkln33/moqt-glas`
- [ ] Branch: `main`

### 2. Build Settings (Auto-detected)
- Build command: `npm run build`
- Publish directory: `.next` (handled by plugin)
- Node version: `18` (from `.nvmrc`)

### 3. Environment Variables
Add these in **Site settings → Environment variables**:

```
NEXT_PUBLIC_TELEGRAM_BOT_NAME=your_bot_name
TELEGRAM_BOT_TOKEN=your_bot_token
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
UPSTASH_REDIS_URL=your_upstash_redis_url
UPSTASH_REDIS_TOKEN=your_upstash_redis_token
NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
```

### 4. Deploy
- [ ] Click **"Deploy site"**
- [ ] Wait for build to complete
- [ ] Note your site URL (e.g., `moqt-glas-123.netlify.app`)

### 5. Configure Telegram Bot
- [ ] Get your Netlify site URL
- [ ] Extract domain (e.g., `moqt-glas-123.netlify.app`)
- [ ] Message [@BotFather](https://t.me/botfather) on Telegram
- [ ] Send: `/setdomain`
- [ ] Select your bot
- [ ] Enter domain: `moqt-glas-123.netlify.app`

### 6. Update Environment Variable
- [ ] Update `NEXT_PUBLIC_APP_URL` with your actual Netlify URL
- [ ] Trigger redeploy: **"Trigger deploy"** → **"Clear cache and deploy site"**

## 🧪 Testing

- [ ] Visit your Netlify site
- [ ] Test Telegram login
- [ ] Create test poll (run SQL migration or use script)
- [ ] Test voting functionality
- [ ] Verify results display
- [ ] Test on mobile device

## 📊 Database Setup

### Run Migrations
1. Go to Supabase → SQL Editor
2. Run: `supabase/migrations/001_initial_schema.sql`
3. (Optional) Run: `supabase/migrations/002_test_bulgarian_election_simple.sql`

### Or Use Script
```bash
npm run create-poll
```

## 🔍 Post-Deployment

- [ ] Verify HTTPS is enabled (automatic on Netlify)
- [ ] Test all pages load correctly
- [ ] Check error logs in Netlify Dashboard
- [ ] Monitor function execution times
- [ ] Set up custom domain (optional)

## 🚨 Common Issues

### Build Fails
- Check Node version (should be 18)
- Verify all dependencies in `package.json`
- Check build logs for specific errors

### Telegram Login Not Working
- Verify domain set in BotFather
- Check `NEXT_PUBLIC_TELEGRAM_BOT_NAME` matches bot username
- Ensure site uses HTTPS

### Database Errors
- Verify Supabase credentials
- Check RLS policies
- Verify service role key has correct permissions

### Rate Limiting Not Working
- Check Upstash Redis credentials
- Verify free tier limits (10K commands/day)

## 📝 Next Steps

1. Set up monitoring (Netlify Analytics)
2. Configure custom domain
3. Set up error tracking (Sentry, etc.)
4. Create production poll with Bulgarian parties
5. Share with users!

---

**Repository**: https://github.com/linkln33/moqt-glas
**Netlify Docs**: https://docs.netlify.com/integrations/frameworks/nextjs/
