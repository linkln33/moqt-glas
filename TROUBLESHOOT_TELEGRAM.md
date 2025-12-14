# Troubleshooting "Bot domain invalid" Error

## Common Causes

1. **Domain format in BotFather is incorrect**
2. **Telegram propagation delay (5-10 minutes)**
3. **Bot name mismatch**
4. **Environment variable not set correctly**

## Step-by-Step Fix

### 1. Verify BotFather Domain Setting

**CRITICAL:** The domain format must be EXACT:

✅ **Correct:** `moqt-glas.onrender.com`
❌ **Wrong:** `https://moqt-glas.onrender.com`
❌ **Wrong:** `moqt-glas.onrender.com/`
❌ **Wrong:** `www.moqt-glas.onrender.com`

**How to check:**
1. Open Telegram → @BotFather
2. Send: `/mybots`
3. Select: `moqtglas_bot`
4. Click: "Bot Settings" → "Domain"
5. Verify it shows exactly: `moqt-glas.onrender.com`

**If it's wrong, fix it:**
1. Send: `/setdomain`
2. Select: `moqtglas_bot`
3. Enter: `moqt-glas.onrender.com` (NO https://, NO trailing slash)
4. Wait for confirmation

### 2. Verify Environment Variables

Check that these are set correctly in Render:

- `NEXT_PUBLIC_TELEGRAM_BOT_NAME` = `moqtglas_bot` (without @)
- `NEXT_PUBLIC_APP_URL` = `https://moqt-glas.onrender.com` (with https://)

**To check in Render:**
1. Go to Render Dashboard
2. Select your service: `moqt-glas`
3. Go to "Environment" tab
4. Verify both variables are set correctly

### 3. Wait for Propagation

After setting/updating the domain in BotFather:
- **Wait 5-10 minutes** for Telegram to propagate the change
- Clear your browser cache
- Try again in an incognito/private window

### 4. Verify Bot Name Match

The bot name in `NEXT_PUBLIC_TELEGRAM_BOT_NAME` must match exactly:
- Bot username: `@moqtglas_bot`
- Environment variable: `moqtglas_bot` (without @)

### 5. Test the Domain

You can verify the domain is accessible:
```bash
curl -I https://moqt-glas.onrender.com
```

Should return `200 OK`.

### 6. Check Browser Console

Open browser DevTools (F12) → Console tab and look for:
- Any errors related to Telegram widget
- Network errors when loading the widget

### 7. Common Mistakes

- ❌ Setting domain with `https://` in BotFather
- ❌ Setting domain with trailing slash `/`
- ❌ Using wrong bot name (e.g., `@moqtglas_bot` instead of `moqtglas_bot`)
- ❌ Not waiting for Telegram propagation
- ❌ Testing too quickly after setting domain

## Still Not Working?

1. **Double-check BotFather:**
   - Send `/mybots` → Select bot → "Bot Settings" → "Domain"
   - Make sure it's exactly `moqt-glas.onrender.com`

2. **Verify Render environment variables:**
   - Check both `NEXT_PUBLIC_TELEGRAM_BOT_NAME` and `NEXT_PUBLIC_APP_URL`
   - Redeploy if you just changed them

3. **Wait longer:**
   - Sometimes Telegram takes up to 15 minutes to propagate

4. **Try a different browser:**
   - Clear cache completely
   - Use incognito mode

5. **Check if service is running:**
   - Render free tier spins down after inactivity
   - First request may take ~30 seconds to wake up
