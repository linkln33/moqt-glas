# Deployment Guide - Моят Глас

Complete guide for deploying the Bulgarian elections voting platform to Netlify.

## Prerequisites

1. GitHub account with repository: https://github.com/linkln33/moqt-glas
2. Netlify account (free tier works)
3. Supabase project set up
4. Upstash Redis account
5. Telegram Bot created

## Pre-Deployment Checklist

- [x] Code pushed to GitHub: https://github.com/linkln33/moqt-glas
- [x] Netlify configuration added (`netlify.toml`)
- [x] Node version specified (`.nvmrc`)
- [x] Environment variables documented

## Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add remote
git remote add origin https://github.com/linkln33/moqt-glas.git

# Add all files
git add .

# Commit
git commit -m "Initial commit: Bulgarian elections voting app"

# Push to GitHub
git push -u origin main
```

## Step 2: Deploy to Netlify

### Option A: Via Netlify Dashboard (Recommended)

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect to GitHub
4. Select repository: `linkln33/moqt-glas`
5. Branch: `main`
6. Build settings (auto-detected):
   - **Build command**: `npm run build`
   - **Publish directory**: `.next` (handled by plugin)
   - **Node version**: `18` (from `.nvmrc`)
7. Click **"Deploy site"**

### Option B: Via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

## Step 3: Configure Environment Variables

In Netlify Dashboard → Site settings → Environment variables, add:

```env
NEXT_PUBLIC_TELEGRAM_BOT_NAME=your_bot_name
TELEGRAM_BOT_TOKEN=your_bot_token
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
UPSTASH_REDIS_URL=your_upstash_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token
NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
```

## Step 4: Configure Telegram Bot Domain

1. Get your Netlify site URL (e.g., `https://moqt-glas-123.netlify.app`)
2. Extract domain: `moqt-glas-123.netlify.app`
3. In Telegram, message [@BotFather](https://t.me/botfather)
4. Send: `/setdomain`
5. Select your bot
6. Enter domain: `moqt-glas-123.netlify.app`

## Step 5: Update Environment Variable

- [ ] Update `NEXT_PUBLIC_APP_URL` with your actual Netlify URL
- [ ] Trigger redeploy: **"Trigger deploy"** → **"Clear cache and deploy site"**

## Step 6: Database Setup

### Run Migrations

1. Go to Supabase → SQL Editor
2. Run: `supabase/migrations/001_initial_schema.sql`
3. Run: `supabase/migrations/002_create_voting_user_system.sql` (if using user system)
4. (Optional) Run: `supabase/migrations/003_example_polls.sql` for example polls

### Or Use Script

```bash
npm run create-example-polls
```

## Step 7: Testing

- [ ] Visit your Netlify site
- [ ] Test Telegram login
- [ ] Create test poll (run SQL migration or use script)
- [ ] Test voting functionality
- [ ] Verify results display
- [ ] Test on mobile device

## Post-Deployment

- [ ] Verify HTTPS is enabled (automatic on Netlify)
- [ ] Test all pages load correctly
- [ ] Check error logs in Netlify Dashboard
- [ ] Monitor function execution times
- [ ] Set up custom domain (optional)

## Troubleshooting

### Build Fails

**Common Issues:**
- Check Node version (should be 18)
- Verify all dependencies in `package.json`
- Check build logs for specific errors

**Build Configuration:**
- ✅ Next.js 14.2.0
- ✅ Node 18 (specified in `.nvmrc`, `netlify.toml`, and `package.json`)
- ✅ Netlify Next.js plugin (`@netlify/plugin-nextjs`)
- ✅ Legacy peer deps flag for dependency resolution

**Testing Locally:**
```bash
# Use Node 18
nvm use 18

# Clean install
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Build
npm run build
```

If the local build succeeds, the Netlify build should also succeed.

### Telegram Login Not Working

- Verify domain is set in BotFather
- Check `NEXT_PUBLIC_TELEGRAM_BOT_NAME` matches bot username
- Ensure site uses HTTPS (Netlify provides this automatically)
- For local dev, use ngrok or similar tunnel

### Database Errors

- Verify Supabase credentials
- Check RLS policies
- Verify service role key has correct permissions
- Check Supabase project is active

### Rate Limiting Not Working

- Check Upstash Redis credentials
- Verify free tier limits (10K commands/day)
- Check network connectivity

## Custom Domain (Optional)

1. In Netlify Dashboard → Domain settings
2. Add custom domain
3. Follow DNS configuration instructions
4. Update Telegram bot domain in BotFather

## Continuous Deployment

Netlify automatically deploys when you push to GitHub:
- `main` branch → Production
- Other branches → Preview deployments

## Monitoring

- Check Netlify Analytics (available on paid plans)
- Monitor function logs in Netlify Dashboard
- Set up error tracking (e.g., Sentry)

## Next Steps

1. Set up monitoring (Netlify Analytics)
2. Configure custom domain
3. Set up error tracking (Sentry, etc.)
4. Create production poll with Bulgarian parties
5. Share with users!

---

**Repository**: https://github.com/linkln33/moqt-glas  
**Netlify Docs**: https://docs.netlify.com/integrations/frameworks/nextjs/
