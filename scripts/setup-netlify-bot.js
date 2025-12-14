#!/usr/bin/env node

/**
 * Complete Netlify Setup for Telegram Bot
 * This script will:
 * 1. Link the site (if needed)
 * 2. Set all required environment variables
 * 3. Provide instructions for Telegram bot configuration
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

function execCommand(command, options = {}) {
  try {
    return execSync(command, { 
      encoding: 'utf8', 
      stdio: options.stdio || 'pipe',
      ...options 
    });
  } catch (error) {
    if (options.ignoreError) {
      return '';
    }
    throw error;
  }
}

async function main() {
  console.log('🚀 Netlify Telegram Bot Configuration');
  console.log('====================================\n');

  // Check login status
  try {
    const status = execCommand('netlify status --json', { ignoreError: true });
    const statusJson = JSON.parse(status);
    console.log(`✅ Logged in as: ${statusJson.email || 'Unknown'}\n`);
  } catch (error) {
    console.log('❌ Not logged in. Please run: netlify login');
    process.exit(1);
  }

  // Check if site is linked
  let siteId = '';
  let siteUrl = '';
  
  try {
    const status = execCommand('netlify status --json', { ignoreError: true });
    const statusJson = JSON.parse(status);
    siteId = statusJson.siteId || '';
    
    if (!siteId || siteId === 'placeholder') {
      console.log('⚠️  Site not linked.\n');
      console.log('Let me help you link your site...\n');
      
      // List available sites
      try {
        const sites = execCommand('netlify sites:list --json', { ignoreError: true });
        const sitesJson = JSON.parse(sites);
        
        if (sitesJson && sitesJson.length > 0) {
          console.log('Available sites:');
          sitesJson.forEach((site, index) => {
            console.log(`  ${index + 1}. ${site.name} (${site.url})`);
          });
          console.log('');
          
          const choice = await question('Enter site number to link, or press Enter to link manually: ');
          
          if (choice && !isNaN(choice) && sitesJson[parseInt(choice) - 1]) {
            const selectedSite = sitesJson[parseInt(choice) - 1];
            siteId = selectedSite.id;
            siteUrl = selectedSite.url;
            
            // Link the site
            execCommand(`netlify link --id ${siteId}`, { stdio: 'inherit' });
            console.log(`\n✅ Linked to: ${selectedSite.name}\n`);
          } else {
            console.log('\nPlease run: netlify link');
            console.log('Then run this script again.\n');
            process.exit(0);
          }
        } else {
          console.log('No sites found. Please create a site first or run: netlify link\n');
          process.exit(0);
        }
      } catch (error) {
        console.log('Could not list sites. Please run: netlify link');
        const manualId = await question('Or enter your site ID manually: ');
        if (manualId) {
          siteId = manualId;
          execCommand(`netlify link --id ${siteId}`, { stdio: 'inherit' });
        } else {
          process.exit(0);
        }
      }
    } else {
      console.log(`✅ Site already linked: ${siteId}\n`);
      
      // Get site URL
      try {
        const siteInfo = execCommand(`netlify api getSite --data '{"site_id": "${siteId}"}'`, { ignoreError: true });
        const siteJson = JSON.parse(siteInfo);
        siteUrl = siteJson.url || `https://${siteId}.netlify.app`;
      } catch (error) {
        siteUrl = `https://${siteId}.netlify.app`;
      }
    }
  } catch (error) {
    console.log('❌ Error checking site status');
    process.exit(1);
  }

  if (!siteId) {
    console.log('❌ Site ID is required. Please link your site first.');
    process.exit(1);
  }

  console.log(`🌐 Site URL: ${siteUrl}\n`);

  // Collect environment variables
  console.log('📝 Please provide the following information:\n');
  console.log('(You can press Enter to skip and set manually later)\n');

  const telegramBotName = await question('Telegram Bot Username (without @): ');
  const telegramBotToken = await question('Telegram Bot Token: ');
  const supabaseUrl = await question(`Supabase URL [https://igjkhyisdwezrnjhgsta.supabase.co]: `) || 'https://igjkhyisdwezrnjhgsta.supabase.co';
  const supabaseAnonKey = await question('Supabase Anon Key: ');
  const supabaseServiceRoleKey = await question('Supabase Service Role Key: ');
  const redisUrl = await question('Upstash Redis URL: ');
  const redisToken = await question('Upstash Redis Token: ');
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

  let successCount = 0;
  for (const [key, value] of envVars) {
    if (!value) {
      console.log(`⏭️  Skipping ${key} (empty)`);
      continue;
    }
    
    try {
      execCommand(`netlify env:set ${key} "${value}" --context production`, { stdio: 'inherit' });
      console.log(`✅ Set ${key}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to set ${key}:`, error.message);
    }
  }

  const domain = appUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  console.log('\n' + '='.repeat(50));
  console.log('✅ Configuration Complete!');
  console.log('='.repeat(50) + '\n');
  
  console.log(`📊 Set ${successCount} environment variables\n`);
  
  console.log('📋 Next Steps:\n');
  console.log('1. Update Telegram Bot Domain:');
  console.log('   - Open Telegram → @BotFather');
  console.log('   - Send: /setdomain');
  console.log(`   - Enter domain: ${domain}\n`);
  
  console.log('2. Trigger a new deployment:');
  console.log('   netlify deploy --prod\n');
  console.log(`   Or visit: https://app.netlify.com/sites/${siteId}/deploys\n`);
  
  console.log('3. Test your site:');
  console.log(`   Visit: ${appUrl}\n`);
  console.log('   - Test Telegram login');
  console.log('   - Create a test poll');
  console.log('   - Verify voting works\n');

  rl.close();
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  rl.close();
  process.exit(1);
});
