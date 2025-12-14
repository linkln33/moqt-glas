import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Verify if the bot token is correct by testing it against Telegram Bot API
 * GET /api/auth/telegram/verify-token
 */
export async function GET(request: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME;
  
  if (!botToken) {
    return NextResponse.json({
      error: 'TELEGRAM_BOT_TOKEN not set',
      provided: false,
    }, { status: 400 });
  }

  // Verify token format
  const tokenFormat = {
    length: botToken.length,
    hasColon: botToken.includes(':'),
    formatValid: /^\d+:[A-Za-z0-9_-]+$/.test(botToken),
    botId: botToken.split(':')[0],
    expectedLength: 46,
    expectedFormat: 'number:alphanumeric_string',
  };

  // Test token by calling Telegram Bot API getMe endpoint
  let apiTest = {
    tested: false,
    valid: false,
    botInfo: null as any,
    error: null as string | null,
  };

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    apiTest.tested = true;
    const data = await response.json();

    if (data.ok && data.result) {
      apiTest.valid = true;
      apiTest.botInfo = {
        id: data.result.id,
        is_bot: data.result.is_bot,
        first_name: data.result.first_name,
        username: data.result.username,
        can_join_groups: data.result.can_join_groups,
        can_read_all_group_messages: data.result.can_read_all_group_messages,
        supports_inline_queries: data.result.supports_inline_queries,
      };

      // Check if bot name matches
      if (botName && data.result.username) {
        apiTest.botInfo.nameMatch = botName === data.result.username || botName === `@${data.result.username}`;
        apiTest.botInfo.configuredName = botName;
        apiTest.botInfo.actualUsername = data.result.username;
      }
    } else {
      apiTest.valid = false;
      apiTest.error = data.description || 'Invalid token';
    }
  } catch (error: any) {
    apiTest.tested = true;
    apiTest.valid = false;
    apiTest.error = error.message || 'Failed to test token';
  }

  // Verify hash calculation works
  const testAuthData = {
    id: 123456789,
    first_name: 'Test',
    auth_date: Math.floor(Date.now() / 1000),
    hash: 'test_hash',
  };

  let hashTest = {
    tested: false,
    secretKeyLength: 0,
    secretKeyHex: '',
    canCalculate: false,
  };

  try {
    const { hash, ...data } = testAuthData;
    const sortedKeys = Object.keys(data).sort();
    const dataCheckArray = sortedKeys
      .filter(key => data[key as keyof typeof data] !== undefined && data[key as keyof typeof data] !== null)
      .map(key => `${key}=${String(data[key as keyof typeof data])}`);
    const dataCheckString = dataCheckArray.join('\n');

    const secretKey = crypto
      .createHash('sha256')
      .update(botToken, 'utf8')
      .digest();

    hashTest.tested = true;
    hashTest.secretKeyLength = secretKey.length;
    hashTest.secretKeyHex = secretKey.toString('hex').substring(0, 32) + '...';
    hashTest.canCalculate = true;
  } catch (error: any) {
    hashTest.tested = true;
    hashTest.canCalculate = false;
  }

  return NextResponse.json({
    tokenFormat,
    apiTest,
    hashTest,
    recommendations: [] as string[],
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
