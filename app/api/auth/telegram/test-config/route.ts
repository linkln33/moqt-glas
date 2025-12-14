import { NextResponse } from 'next/server';

/**
 * Test endpoint to verify Telegram bot configuration
 * Access: GET /api/auth/telegram/test-config
 */
export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const config = {
    botToken: {
      exists: !!botToken,
      length: botToken?.length || 0,
      format: botToken ? (botToken.includes(':') ? 'valid' : 'invalid (missing colon)') : 'missing',
      prefix: botToken ? botToken.substring(0, 10) + '...' : 'N/A',
      expectedFormat: 'number:alphanumeric_string',
      expectedLength: 46, // Typical Telegram bot token length
    },
    botName: {
      exists: !!botName,
      value: botName || 'NOT SET',
      expectedFormat: 'botname (without @)',
    },
    appUrl: {
      exists: !!appUrl,
      value: appUrl || 'NOT SET',
      expectedDomain: 'moqt-glas.onrender.com',
      domainMatch: appUrl?.includes('moqt-glas.onrender.com') || false,
    },
    recommendations: [] as string[],
  };

  // Add recommendations
  if (!botToken) {
    config.recommendations.push('Set TELEGRAM_BOT_TOKEN in Render environment variables');
  } else if (!botToken.includes(':')) {
    config.recommendations.push('TELEGRAM_BOT_TOKEN format is invalid (should contain colon)');
  } else if (botToken.length < 40 || botToken.length > 50) {
    config.recommendations.push(`TELEGRAM_BOT_TOKEN length is unusual (${botToken.length} chars, expected ~46)`);
  }

  if (!botName) {
    config.recommendations.push('Set NEXT_PUBLIC_TELEGRAM_BOT_NAME in Render environment variables');
  } else if (botName.startsWith('@')) {
    config.recommendations.push('NEXT_PUBLIC_TELEGRAM_BOT_NAME should not include @ symbol');
  }

  if (!appUrl) {
    config.recommendations.push('Set NEXT_PUBLIC_APP_URL in Render environment variables');
  } else if (!appUrl.includes('moqt-glas.onrender.com')) {
    config.recommendations.push('NEXT_PUBLIC_APP_URL should include moqt-glas.onrender.com');
  }

  // Check if domain should be set in BotFather
  if (appUrl) {
    const domain = appUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    config.recommendations.push(`Verify domain in BotFather: ${domain} (use /setdomain command)`);
  }

  return NextResponse.json({
    status: 'ok',
    config,
    allConfigured: botToken && botName && appUrl && botToken.includes(':'),
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
