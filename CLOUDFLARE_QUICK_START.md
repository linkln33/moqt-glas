# Cloudflare Pages - Quick Start Guide

## 🚀 Quick Deploy (5 minutes)

### 1. Sign Up
- Go to [dash.cloudflare.com](https://dash.cloudflare.com)
- Create free account (or sign in)

### 2. Connect GitHub
- Click **"Workers & Pages"** → **"Create application"** → **"Pages"**
- Click **"Connect to Git"**
- Authorize Cloudflare → Select repo: `linkln33/moqt-glas`

### 3. Configure Build
- **Project name**: `moqt-glas`
- **Production branch**: `main`
- **Framework preset**: **None** (we'll configure manually)
- **Build command**: 
  ```
  npm install --legacy-peer-deps && npm run build && npm run build:cloudflare
  ```
- **Build output directory**: `.vercel/output/static`
- **Root directory**: `/` (leave empty)

### 4. Add Environment Variables
After first deploy, go to **Settings** → **Environment variables**:

```env
NEXT_PUBLIC_TELEGRAM_BOT_NAME=moqtglas_bot
TELEGRAM_BOT_TOKEN=your_token
NEXT_PUBLIC_SUPABASE_URL=https://igjkhyisdwezrnjhgsta.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key
UPSTASH_REDIS_URL=your_url
UPSTASH_REDIS_TOKEN=your_token
NODE_VERSION=20
```

### 5. Deploy
- Click **"Save and Deploy"**
- Wait ~3-5 minutes
- Your site: `https://moqt-glas.pages.dev`

### 6. Update Telegram Bot
1. Get your URL: `moqt-glas.pages.dev`
2. In Telegram → [@BotFather](https://t.me/botfather)
3. Send: `/setdomain`
4. Select bot → Enter: `moqt-glas.pages.dev`

### 7. Update App URL
- In Cloudflare → **Settings** → **Environment variables**
- Add/Update: `NEXT_PUBLIC_APP_URL=https://moqt-glas.pages.dev`
- This triggers a new deployment

## ✅ Done!

Your app is live at: `https://moqt-glas.pages.dev`

## 📚 Full Guide

See [DEPLOY_CLOUDFLARE.md](./DEPLOY_CLOUDFLARE.md) for detailed instructions and troubleshooting.

## 🆘 Troubleshooting

**Build fails?**
- Check build logs in Cloudflare dashboard
- Ensure `@cloudflare/next-on-pages` is in `package.json`
- Verify build command is correct

**API routes not working?**
- Ensure adapter is installed and build command includes `npm run build:cloudflare`
- Check environment variables are set
- Verify API routes are in `app/api/` directory

**Environment variables not working?**
- Variables must be set in Cloudflare dashboard
- Redeploy after adding variables
- `NEXT_PUBLIC_*` variables are available in browser
