#!/usr/bin/env node

/**
 * Interactive Netlify Configuration Script
 * Configures all environment variables for Telegram bot to work
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function questionSecret(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let input = '';
    process.stdin.on('data', (char) => {
      char = char.toString();
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write('\n');
          resolve(input);
          break;
        case '\u0003':
          process.exit();
          break;
        case '\u007f':
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          input += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

function execCommand(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe', ...options });
  } catch (error) {
    if (options.ignoreError) {
      return '';
    }
    throw error;
  }
}

async function main() {
  console.log('🚀 Netlify Configuration Script for Telegram Bot');
  console.log('================================================\n');

  // Check if Netlify CLI is installed
  try {
    execCommand('netlify --version', { ignoreError: true });
  } catch (error) {
    console.log('📦 Installing Netlify CLI...');
    execCommand('npm install -g netlify-cli');
  }

  // Check if logged in
  try {
    execCommand('netlify status', { ignoreError: true });
  } catch (error) {
    console.log('🔐 Please log in to Netlify...');
    execCommand('netlify login', { stdio: 'inherit' });
  }

  // Get site info
  console.log('\n📋 Getting site information...');
  let siteId = '';
  let siteUrl = '';

  try {
    const status = execCommand('netlify status --json', { ignoreError: true });
    const statusJson = JSON.parse(status);
    siteId = statusJson.siteId || '';
  } catch (error) {
    // Try to get from .netlify/state.json
    try {
      const fs = require('fs');
      const state = JSON.parse(fs.readFileSync('.netlify/state.json', 'utf8'));
      siteId = state.siteId || '';
    } catch (e) {
      // Ignore
    }
  }

  if (!siteId || siteId === 'placeholder') {
    console.log('⚠️  No site linked. Please link your site first.');
    console.log('   Run: netlify link\n');
    const proceed = await question('Press Enter after linking, or type "skip" to continue: ');
    if (proceed.toLowerCase() === 'skip') {
      siteId = await question('Enter your Netlify Site ID: ');
    } else {
      try {
        const status = execCommand('netlify status --json', { ignoreError: true });
        const statusJson = JSON.parse(status);
        siteId = statusJson.siteId || '';
      } catch (error) {
        siteId = await question('Enter your Netlify Site ID: ');
      }
    }
  }

  if (!siteId) {
    console.log('❌ Site ID is required. Exiting.');
    process.exit(1);
  }

  console.log(`✅ Site ID: ${siteId}\n`);

  // Try to get site URL
  try {
    const siteInfo = execCommand(`netlify api getSite --data '{"site_id": "${siteId}"}'`, { ignoreError: true });
    const siteJson = JSON.parse(siteInfo);
    siteUrl = siteJson.url || `https://${siteId}.netlify.app`;
  } catch (error) {
    siteUrl = `https://${siteId}.netlify.app`;
  }

  console.log(`🌐 Site URL: ${siteUrl}\n`);

  // Collect environment variables
  console.log('📝 Please provide the following information:\n');

  const telegramBotName = await question('Telegram Bot Username (without @): ');
  const telegramBotToken = await questionSecret('Telegram Bot Token: ');
  const supabaseUrl = await question(`Supabase URL [https://igjkhyisdwezrnjhgsta.supabase.co]: `) || 'https://igjkhyisdwezrnjhgsta.supabase.co';
  const supabaseAnonKey = await questionSecret('Supabase Anon Key: ');
  const supabaseServiceRoleKey = await questionSecret('Supabase Service Role Key: ');
  const redisUrl = await question('Upstash Redis URL: ');
  const redisToken = await questionSecret('Upstash Redis Token: ');
  const appUrl = await question(`App URL [${siteUrl}]: `) || siteUrl;

  console.log('\n🔧 Setting environment variables...\n');

  // Set environment variables
  const envVars = [
    ['NEXT_PUBLIC_TELEGRAM_BOT_NAME', telegramBotName],
    ['TELEGRAM_BOT_TOKEN', telegramBotToken],
    ['NEXT_PUBLIC_SUPABASE_URL', supabaseUrl],
    ['NEXT_PUBLIC_SUPABASE_ANON_KEY', supabaseAnonKey],
    ['SUPABASE_SERVICE_ROLE_KEY', supabaseServiceRoleKey],
    ['UPSTASH_REDIS_URL', redisUrl],
    ['UPSTASH_REDIS_TOKEN', redisToken],
    ['NEXT_PUBLIC_APP_URL', appUrl],
  ];

  for (const [key, value] of envVars) {
    try {
      execCommand(`netlify env:set ${key} "${value}"`, { stdio: 'inherit' });
      console.log(`✅ Set ${key}`);
    } catch (error) {
      console.error(`❌ Failed to set ${key}:`, error.message);
    }
  }

  const domain = appUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  console.log('\n✅ Environment variables configured!\n');
  console.log('📋 Next steps:');
  console.log('1. Update Telegram bot domain in BotFather:');
  console.log(`   - Open Telegram → @BotFather`);
  console.log(`   - Send: /setdomain`);
  console.log(`   - Enter domain: ${domain}`);
  console.log('\n2. Trigger a new deployment:');
  console.log('   netlify deploy --prod');
  console.log(`\n3. Or trigger from dashboard:`);
  console.log(`   https://app.netlify.com/sites/${siteId}/deploys\n`);

  rl.close();
}

main().catch((error) => {
  console.error('❌ Error:', error);
  rl.close();
  process.exit(1);
});
