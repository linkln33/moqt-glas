# Deploy to Cloudflare Pages - Моят Глас

Complete guide for deploying your Next.js voting app to Cloudflare Pages.

## Why Cloudflare Pages?

- ✅ **Unlimited bandwidth** (no limits!)
- ✅ **500 builds/month** (free tier)
- ✅ **Global CDN** (300+ data centers worldwide)
- ✅ **Free SSL** and DDoS protection
- ✅ **Fast deployments** (usually < 2 minutes)
- ✅ **GitHub integration** (auto-deploy on push)

## Prerequisites

1. GitHub account with repository: https://github.com/linkln33/moqt-glas
2. Cloudflare account (free) - Sign up at [dash.cloudflare.com](https://dash.cloudflare.com)
3. Supabase project configured
4. Telegram Bot created

## Important: Cloudflare Pages + Next.js

Cloudflare Pages supports Next.js in two ways:

### Option 1: Static Export (Simpler, but no API routes)
- ✅ Simple setup
- ✅ Fast builds
- ❌ No API routes support
- ❌ No server-side rendering

### Option 2: Next.js with Adapter (Full features)
- ✅ Supports API routes (via Cloudflare Workers)
- ✅ Supports server-side rendering
- ⚠️ Requires adapter installation
- ⚠️ More complex setup

**For this app (has API routes):** We'll use Option 2 with the adapter.

## Step 1: Install Cloudflare Next.js Adapter

```bash
npm install --save-dev @cloudflare/next-on-pages --legacy-peer-deps
```

**Note:** 
- The adapter is deprecated but still works
- It requires Next.js 14.3.0+, but we're using 14.2.0
- The `--legacy-peer-deps` flag allows installation
- Consider updating Next.js to 14.3.0+ later for better compatibility
- Alternative: Consider using OpenNext adapter (newer, but more setup)

## Step 2: Update package.json

Add build script for Cloudflare:

```json
{
  "scripts": {
    "build": "next build",
    "build:cloudflare": "npx @cloudflare/next-on-pages",
    "pages:build": "npm run build && npm run build:cloudflare"
  }
}
```

## Step 3: Update next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['cdn.telegram.org'],
    unoptimized: false,
  },
  // Cloudflare Pages compatibility
  output: 'export', // For static export (if needed)
  // OR use adapter (recommended for API routes)
  // See Step 4
}

module.exports = nextConfig
```

**Note:** For API routes, we'll use the adapter instead of static export.

## Step 4: Create wrangler.toml (Optional)

Create `wrangler.toml` in project root:

```toml
name = "moqt-glas"
compatibility_date = "2024-01-01"

[env.production]
name = "moqt-glas"
```

## Step 5: Deploy to Cloudflare Pages

### Option A: Via Cloudflare Dashboard (Recommended)

1. **Go to Cloudflare Dashboard**
   - Visit [dash.cloudflare.com](https://dash.cloudflare.com)
   - Sign in or create free account

2. **Navigate to Pages**
   - Click **"Workers & Pages"** in sidebar
   - Click **"Create application"**
   - Select **"Pages"** tab
   - Click **"Connect to Git"**

3. **Connect GitHub**
   - Authorize Cloudflare to access GitHub
   - Select repository: `linkln33/moqt-glas`
   - Click **"Begin setup"**

4. **Configure Build Settings**
   - **Project name**: `moqt-glas` (or your choice)
   - **Production branch**: `main`
   - **Framework preset**: **Next.js (Static HTML Export)** or **None**
   - **Build command**: 
     ```
     npm install --legacy-peer-deps && npm run build && npm run build:cloudflare
     ```
   - **Build output directory**: `.vercel/output/static` (after adapter runs)
   - **Root directory**: `/` (leave empty)

5. **Add Environment Variables**
   Click **"Save and Deploy"** first, then add variables:
   
   Go to **Settings** → **Environment variables** → **Add variable**:
   
   ```env
   NEXT_PUBLIC_TELEGRAM_BOT_NAME=moqtglas_bot
   TELEGRAM_BOT_TOKEN=your_bot_token
   NEXT_PUBLIC_SUPABASE_URL=https://igjkhyisdwezrnjhgsta.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   UPSTASH_REDIS_URL=your_redis_url
   UPSTASH_REDIS_TOKEN=your_redis_token
   NODE_VERSION=20
   ```

6. **Deploy!**
   - Click **"Save and Deploy"**
   - Wait for build to complete (~2-5 minutes)
   - Your site will be live at: `https://moqt-glas.pages.dev` (or custom name)

### Option B: Via Wrangler CLI

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
npm run build
npx @cloudflare/next-on-pages
wrangler pages deploy .vercel/output/static
```

## Step 6: Configure Custom Domain (Optional)

1. In Cloudflare Pages dashboard → Your project → **Custom domains**
2. Click **"Set up a custom domain"**
3. Enter your domain (e.g., `moqt-glas.com`)
4. Follow DNS configuration instructions
5. Cloudflare will automatically provision SSL

## Step 7: Update Telegram Bot Domain

1. Get your Cloudflare Pages URL (e.g., `moqt-glas.pages.dev`)
2. Extract domain: `moqt-glas.pages.dev`
3. In Telegram, message [@BotFather](https://t.me/botfather)
4. Send: `/setdomain`
5. Select your bot: `moqtglas_bot`
6. Enter domain: `moqt-glas.pages.dev` (without https://)

## Step 8: Update Environment Variable

1. In Cloudflare Pages dashboard → Your project → **Settings** → **Environment variables**
2. Update `NEXT_PUBLIC_APP_URL` to your Cloudflare Pages URL:
   ```
   NEXT_PUBLIC_APP_URL=https://moqt-glas.pages.dev
   ```
3. This will trigger a new deployment

## Troubleshooting

### Build Fails

**Error: "Cannot find module @cloudflare/next-on-pages"**
- Solution: Run `npm install --save-dev @cloudflare/next-on-pages` locally
- Commit `package.json` and `package-lock.json`
- Redeploy

**Error: "API routes not working"**
- Solution: Ensure you're using `@cloudflare/next-on-pages` adapter
- API routes run on Cloudflare Workers (serverless functions)
- Check that build command includes `npx @cloudflare/next-on-pages`

### API Routes Not Working

Cloudflare Pages runs API routes via Cloudflare Workers. Ensure:
1. Adapter is installed and configured
2. Build command includes adapter step
3. Environment variables are set correctly

### Environment Variables Not Working

- Ensure variables are set in Cloudflare Pages dashboard
- Variables starting with `NEXT_PUBLIC_` are available in browser
- Other variables are only available server-side (API routes)
- Redeploy after adding/changing variables

### Slow First Load

- Cloudflare Pages uses edge caching
- First request may be slower (cold start)
- Subsequent requests are fast (cached)

## Cloudflare Pages Free Tier Limits

- ✅ **Unlimited bandwidth** (no limits!)
- ✅ **500 builds/month**
- ✅ **100 custom domains per project**
- ✅ **Unlimited preview deployments**
- ✅ **Free SSL** (automatic)
- ✅ **DDoS protection** (automatic)
- ⚠️ **Build time limit**: 20 minutes per build

## Advantages Over Netlify

- ✅ **Unlimited bandwidth** (Netlify: 100GB/month)
- ✅ **More builds** (500 vs 100 build minutes)
- ✅ **Better global CDN** (300+ data centers)
- ✅ **Free DDoS protection**
- ✅ **Faster edge network**

## Continuous Deployment

Cloudflare Pages automatically deploys when you:
- Push to `main` branch → Production deployment
- Push to other branches → Preview deployment (optional)

## Monitoring

- View deployment logs in Cloudflare Dashboard
- Check build status and errors
- View analytics (requests, bandwidth, etc.)

## Next Steps

1. ✅ Deploy to Cloudflare Pages
2. ✅ Configure environment variables
3. ✅ Update Telegram bot domain
4. ✅ Test all features (login, voting, results)
5. ✅ Set up custom domain (optional)
6. ✅ Monitor usage and performance

---

**Your app will be live at:** `https://your-project-name.pages.dev`

**Need help?** Check [Cloudflare Pages Docs](https://developers.cloudflare.com/pages)
