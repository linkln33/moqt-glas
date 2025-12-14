# Netlify Deployment Guide

## Prerequisites

1. GitHub account with repository: https://github.com/linkln33/moqt-glas
2. Netlify account (free tier works)
3. Supabase project set up
4. Upstash Redis account
5. Telegram Bot created

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

### Option A: Via Netlify Dashboard

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect to GitHub
4. Select repository: `linkln33/moqt-glas`
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Node version**: `18`
6. Click **"Deploy site"**

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

```
NEXT_PUBLIC_TELEGRAM_BOT_NAME=your_bot_name
TELEGRAM_BOT_TOKEN=your_bot_token
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
UPSTASH_REDIS_URL=your_upstash_redis_url
UPSTASH_REDIS_TOKEN=your_upstash_redis_token
NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
```

## Step 4: Configure Telegram Bot Domain

1. Get your Netlify site URL (e.g., `https://moqt-glas.netlify.app`)
2. Extract domain: `moqt-glas.netlify.app`
3. In Telegram, message [@BotFather](https://t.me/botfather)
4. Send: `/setdomain`
5. Select your bot
6. Enter domain: `moqt-glas.netlify.app`

## Step 5: Redeploy

After setting environment variables:
1. Go to Netlify Dashboard
2. Click **"Trigger deploy"** → **"Clear cache and deploy site"**

## Step 6: Verify

1. Visit your Netlify site URL
2. Test Telegram login
3. Create a test poll
4. Test voting functionality

## Troubleshooting

### Build Fails

- Check Node version (should be 18+)
- Verify all dependencies are in `package.json`
- Check build logs in Netlify dashboard

### Telegram Login Not Working

- Verify domain is set in BotFather
- Check `NEXT_PUBLIC_TELEGRAM_BOT_NAME` matches your bot username
- Ensure site is using HTTPS (Netlify provides this automatically)

### Database Errors

- Verify Supabase environment variables
- Check Supabase project is active
- Verify RLS policies allow public read access

### Rate Limiting Not Working

- Verify Upstash Redis credentials
- Check free tier limits (10K commands/day)

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
