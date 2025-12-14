# Deploy to Render - Моят Глас

Complete guide for deploying to Render (free alternative to Netlify).

## Why Render?

- ✅ **Free tier** - 750 hours/month (enough for always-on)
- ✅ **Automatic HTTPS** - Built-in SSL
- ✅ **Easy GitHub integration** - One-click deploy
- ✅ **Environment variables** - Easy management
- ✅ **Custom domains** - Free SSL
- ✅ **Good Next.js support** - Works out of the box

## Prerequisites

1. GitHub account with repository: https://github.com/linkln33/moqt-glas
2. Render account (free tier) - Sign up at [render.com](https://render.com)
3. Supabase project set up
4. Telegram Bot created

## Step 1: Deploy to Render

### Option A: Via Render Dashboard (Recommended)

1. Go to [render.com](https://render.com) and sign in (or create account)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account (if not already connected)
4. Select repository: `linkln33/moqt-glas`
5. Configure settings:
   - **Name**: `moqt-glas` (or your preferred name)
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `/` (leave empty)
   - **Environment**: `Node`
   - **Build Command**: `npm install --legacy-peer-deps && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: **Free** (750 hours/month)
6. Click **"Create Web Service"**

### Option B: Via Render.yaml (Auto-config)

Render will automatically detect `render.yaml` in your repo and use those settings.

## Step 2: Configure Environment Variables

In Render Dashboard → Your Service → Environment, add:

```env
NODE_VERSION=20
NPM_FLAGS=--legacy-peer-deps
NEXT_PUBLIC_TELEGRAM_BOT_NAME=moqtglas_bot
TELEGRAM_BOT_TOKEN=8061916889:AAGKjtjPDb_jstTayJsVQ4HStSNtFTfdu7E
NEXT_PUBLIC_SUPABASE_URL=https://igjkhyisdwezrnjhgsta.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://your-service.onrender.com
```

**Important**: 
- Add these one by one in the Environment tab
- `NEXT_PUBLIC_APP_URL` will be your Render URL (e.g., `https://moqt-glas.onrender.com`)

## Step 3: Configure Telegram Bot Domain

1. Get your Render service URL (e.g., `https://moqt-glas.onrender.com`)
2. Extract domain: `moqt-glas.onrender.com`
3. In Telegram, message [@BotFather](https://t.me/botfather)
4. Send: `/setdomain`
5. Select your bot: `moqtglas_bot`
6. Enter domain: `moqt-glas.onrender.com` (without https://)

## Step 4: Update Environment Variable

After first deployment:
1. Go to Render Dashboard → Your Service → Environment
2. Update `NEXT_PUBLIC_APP_URL` to your actual Render URL
3. Click **"Save Changes"** (this will trigger a redeploy)

## Step 5: Database Setup

Same as before:
1. Go to Supabase → SQL Editor
2. Run: `supabase/migrations/001_initial_schema.sql`
3. Run: `supabase/migrations/002_create_voting_user_system.sql` (if using user system)

## Step 6: Testing

- [ ] Visit your Render site
- [ ] Test Telegram login
- [ ] Create test poll
- [ ] Test voting functionality
- [ ] Verify results display

## Render Free Tier Limits

- ✅ **750 hours/month** - Enough for always-on service
- ✅ **512 MB RAM** - Sufficient for Next.js
- ✅ **Automatic SSL** - HTTPS included
- ✅ **Custom domains** - Free
- ⚠️ **Spins down after 15 min inactivity** - First request may be slow (wakes up in ~30 seconds)

## Advantages Over Netlify

- ✅ More generous free tier (750 hours vs 100 build minutes)
- ✅ Always-on option available
- ✅ Simple configuration
- ✅ Good for Next.js apps

## Custom Domain (Optional)

1. In Render Dashboard → Your Service → Settings → Custom Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update Telegram bot domain in BotFather

## Continuous Deployment

Render automatically deploys when you push to GitHub:
- `main` branch → Production
- Other branches → Preview deployments (if configured)

## Monitoring

- Check deployment logs in Render Dashboard
- View service metrics (CPU, Memory, Requests)
- Monitor build and deploy times

## Troubleshooting

### Build Fails

- Check Node version (should be 20)
- Verify environment variables are set
- Check build logs in Render Dashboard
- Ensure `--legacy-peer-deps` flag is used

### Service Spins Down

- Free tier services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds to wake up
- Consider upgrading to paid plan for always-on (or use a ping service)

### Telegram Login Not Working

- Verify domain is set in BotFather
- Check `NEXT_PUBLIC_TELEGRAM_BOT_NAME` matches bot username
- Ensure `NEXT_PUBLIC_APP_URL` matches your Render URL

### Environment Variables Not Working

- Make sure variables are set in the Environment tab
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

## Migration from Netlify

If you're migrating from Netlify:

1. **Export environment variables from Netlify:**
   - Go to Netlify Dashboard → Site settings → Environment variables
   - Copy all values

2. **Import to Render:**
   - Go to Render Dashboard → Your Service → Environment
   - Add all variables one by one

3. **Update Telegram bot domain:**
   - Set new Render domain in BotFather

4. **Update any hardcoded URLs:**
   - Search codebase for `netlify.app` references
   - Update to `onrender.com` if needed

## Keep Service Awake (Optional)

To prevent free tier spin-down, you can use a free ping service:
- [UptimeRobot](https://uptimerobot.com) - Free monitoring
- [Cron-job.org](https://cron-job.org) - Free cron jobs
- Set up a ping every 10-14 minutes to your Render URL

---

**Render Docs**: https://render.com/docs  
**Render Pricing**: https://render.com/pricing
