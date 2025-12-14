# Why "Bot domain invalid" on Localhost?

## The Problem

Telegram Login Widget requires:
1. **HTTPS** (secure connection)
2. **Valid domain** set in BotFather using `/setdomain`

`localhost` doesn't work because:
- It's not a real domain that can be set in BotFather
- Telegram validates the domain against what's configured in BotFather
- Even with HTTPS, `localhost` is not accepted

## Solutions

### Option 1: Use ngrok (Recommended for Local Testing)

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   # or
   brew install ngrok  # macOS
   ```

2. **Start your Next.js dev server:**
   ```bash
   npm run dev
   ```

3. **In another terminal, create HTTPS tunnel:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`)

5. **Set domain in BotFather:**
   - Open Telegram → @BotFather
   - Send: `/setdomain`
   - Select your bot: `moqtglas_bot`
   - Enter domain: `abc123.ngrok.io` (without https://)

6. **Update environment variable:**
   ```bash
   # In .env.local
   NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
   ```

7. **Restart dev server** and visit the ngrok URL

### Option 2: Test on Deployed Site (Easiest)

1. **Deploy to Netlify** (already done ✅)
2. **Set domain in BotFather:**
   - Send: `/setdomain` to @BotFather
   - Enter: `moqt-glas.netlify.app`
3. **Test on:** https://moqt-glas.netlify.app

### Option 3: Use localtunnel (Alternative)

```bash
npm install -g localtunnel
lt --port 3000
# Use the provided URL in BotFather
```

## Current Status

✅ **Production (Netlify):**
- Domain: `moqt-glas.netlify.app`
- Needs to be set in BotFather: `/setdomain` → `moqt-glas.netlify.app`

❌ **Localhost:**
- Won't work without ngrok/tunnel
- Widget is disabled on localhost to prevent errors

## Quick Fix for Production

Run this in Telegram with @BotFather:
```
/setdomain
moqtglas_bot
moqt-glas.netlify.app
```

Then test on: https://moqt-glas.netlify.app/login
