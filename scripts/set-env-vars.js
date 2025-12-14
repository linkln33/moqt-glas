#!/usr/bin/env node

/**
 * Set Netlify Environment Variables
 * Usage: node scripts/set-env-vars.js
 * 
 * This script sets all required environment variables for the Telegram bot.
 * You can modify the values below or pass them as environment variables.
 */

const { execSync } = require('child_process');

// Get values from environment variables or use defaults
const envVars = {
  NEXT_PUBLIC_TELEGRAM_BOT_NAME: process.env.TELEGRAM_BOT_NAME || '',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL || 'https://igjkhyisdwezrnjhgsta.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  UPSTASH_REDIS_URL: process.env.REDIS_URL || '',
  UPSTASH_REDIS_TOKEN: process.env.REDIS_TOKEN || '',
  NEXT_PUBLIC_APP_URL: process.env.APP_URL || 'https://moqt-glas.netlify.app',
};

function setEnvVar(key, value) {
  if (!value) {
    console.log(`⏭️  Skipping ${key} (not provided)`);
    return false;
  }
  
  try {
    execSync(`netlify env:set ${key} "${value}" --context production`, {
      stdio: 'inherit',
      encoding: 'utf8'
    });
    console.log(`✅ Set ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to set ${key}:`, error.message);
    return false;
  }
}

console.log('🔧 Setting Netlify Environment Variables');
console.log('=======================================\n');

let successCount = 0;
for (const [key, value] of Object.entries(envVars)) {
  if (setEnvVar(key, value)) {
    successCount++;
  }
}

console.log(`\n✅ Set ${successCount} environment variables`);
console.log('\n📋 Next steps:');
console.log('1. Update Telegram bot domain in @BotFather');
console.log('2. Trigger deployment: netlify deploy --prod');
console.log('3. Test your site\n');
