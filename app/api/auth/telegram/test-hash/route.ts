import { NextRequest, NextResponse } from 'next/server';
import { verifyTelegramAuth } from '@/lib/telegram-auth';
import crypto from 'crypto';

/**
 * Test endpoint to verify hash verification logic
 * POST /api/auth/telegram/test-hash
 * Body: { authData, botToken }
 */
export async function POST(request: NextRequest) {
  try {
    const { authData, botToken } = await request.json();

    if (!authData || !botToken) {
      return NextResponse.json(
        { error: 'Missing authData or botToken' },
        { status: 400 }
      );
    }

    // Manual hash calculation for debugging
    const { hash, ...data } = authData;
    
    // Build data-check-string exactly as Telegram docs specify
    const dataCheckArray: string[] = [];
    const sortedKeys = Object.keys(data).sort();
    
    for (const key of sortedKeys) {
      const value = data[key as keyof typeof data];
      if (value !== undefined && value !== null) {
        const stringValue = String(value);
        dataCheckArray.push(`${key}=${stringValue}`);
      }
    }
    
    const dataCheckString = dataCheckArray.join('\n');
    
    // Compute secret key
    const secretKey = crypto
      .createHash('sha256')
      .update(botToken, 'utf8')
      .digest();
    
    // Compute hash
    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString, 'utf8')
      .digest('hex');
    
    // Test with verifyTelegramAuth function
    const isValid = verifyTelegramAuth(authData, botToken);

    return NextResponse.json({
      success: true,
      debug: {
        receivedHash: hash,
        computedHash,
        match: computedHash.toLowerCase() === hash.toLowerCase(),
        isValid,
        dataCheckString,
        dataCheckStringBytes: Buffer.from(dataCheckString, 'utf8').toString('hex'),
        sortedKeys,
        botTokenLength: botToken.length,
        botTokenPrefix: botToken.substring(0, 10) + '...',
      },
    });
  } catch (error: any) {
    console.error('Test hash error:', error);
    return NextResponse.json(
      { error: error.message || 'Test failed' },
      { status: 500 }
    );
  }
}
