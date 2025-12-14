# Netlify Build Fix

## Issues Fixed

### 1. Removed `output: 'standalone'` from `next.config.js`
- **Problem**: The `standalone` output mode is for Docker deployments and is incompatible with Netlify's Next.js plugin
- **Solution**: Removed the `output: 'standalone'` line. Netlify's `@netlify/plugin-nextjs` plugin handles the build output automatically

### 2. Updated `netlify.toml`
- **Changed**: Build command to use `npm ci` for cleaner, reproducible installs
- **Removed**: `publish = ".next"` - The Next.js plugin handles the publish directory automatically
- **Kept**: Node version 18 and legacy peer deps flag

### 3. Added Node version to `package.json`
- **Added**: `engines` field specifying Node 18.x to ensure consistency

## Build Configuration

The app is now configured for Netlify with:
- ✅ Next.js 14.2.0
- ✅ Node 18 (specified in `.nvmrc`, `netlify.toml`, and `package.json`)
- ✅ Netlify Next.js plugin (`@netlify/plugin-nextjs`)
- ✅ Legacy peer deps flag for dependency resolution

## Next Steps

1. **Commit and push these changes**:
   ```bash
   git add .
   git commit -m "fix: Remove standalone output mode for Netlify compatibility"
   git push origin main
   ```

2. **Trigger a new build on Netlify**:
   - The build should now work correctly
   - If you still see errors, check the full build log starting from the error message

3. **If build still fails**, check:
   - Environment variables are set in Netlify dashboard
   - All required environment variables are present:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY` (for API routes)
     - `TELEGRAM_BOT_TOKEN`
     - `TELEGRAM_BOT_NAME`
     - `NEXT_PUBLIC_TELEGRAM_BOT_NAME`
     - `UPSTASH_REDIS_REST_URL`
     - `UPSTASH_REDIS_REST_TOKEN`

## Testing Locally

To test the build locally before deploying:

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
