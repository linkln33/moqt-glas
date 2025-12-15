import crypto from 'crypto';

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

/**
 * Verify Telegram authentication data
 * Based on official Telegram documentation: https://core.telegram.org/widgets/login
 * 
 * @param authData - Data received from Telegram Login Widget
 * @param botToken - Telegram bot token
 * @returns true if authentication is valid
 */
export function verifyTelegramAuth(
  authData: TelegramAuthData,
  botToken: string
): boolean {
  try {
    if (!authData || !authData.hash || !botToken) {
      console.error('❌ Missing required data:', {
        hasAuthData: !!authData,
        hasHash: !!authData?.hash,
        hasBotToken: !!botToken,
      });
      return false;
    }

    const { hash, ...data } = authData;
    
    console.log('🔐 Starting hash verification:', {
      hasHash: !!hash,
      dataKeys: Object.keys(data),
      botTokenLength: botToken.length,
      receivedData: data,
    });
    
    // According to Telegram docs:
    // 1. Exclude 'hash' from the data
    // 2. Sort remaining fields alphabetically
    // 3. Only include fields that are present (not undefined/null)
    // 4. Format: key=value with \n separator
    // 5. All values must be strings (Telegram sends them as strings in URL params)
    
    const dataCheckArray: string[] = [];
    
    // Get all keys, sort alphabetically
    const sortedKeys = Object.keys(data).sort();
    
    for (const key of sortedKeys) {
        const value = data[key as keyof typeof data];
      
      // Only include fields that are present (not undefined/null)
      // Empty strings are included (they are "present")
      if (value !== undefined && value !== null) {
        // Convert to string - Telegram sends all values as strings
        // This is critical: numbers must be converted to their string representation
        const stringValue = String(value);
        dataCheckArray.push(`${key}=${stringValue}`);
      }
    }
    
    // Join with newline character (\n, 0x0A)
    const dataCheckString = dataCheckArray.join('\n');
    
    console.log('📝 Data check string:', {
      string: dataCheckString,
      length: dataCheckString.length,
      lines: dataCheckString.split('\n'),
      rawBytes: Buffer.from(dataCheckString, 'utf8').toString('hex'),
    });
    
    // Compute secret key: SHA256 of bot token
    const secretKey = crypto
      .createHash('sha256')
      .update(botToken, 'utf8')
      .digest();
    
    console.log('🔑 Secret key computed:', {
      keyLength: secretKey.length,
      keyHex: secretKey.toString('hex').substring(0, 32) + '...',
    });
    
    // Compute HMAC-SHA-256 of data-check-string using secret key
    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString, 'utf8')
      .digest('hex');
    
    console.log('🔐 Hash comparison:', {
      computed: computedHash,
      received: hash,
      computedLower: computedHash.toLowerCase(),
      receivedLower: hash.toLowerCase(),
      match: computedHash.toLowerCase() === hash.toLowerCase(),
    });
    
    // Verify hash matches (case-insensitive comparison as per Telegram docs)
    if (computedHash.toLowerCase() !== hash.toLowerCase()) {
      console.error('❌ Hash mismatch!', {
        computed: computedHash,
        received: hash,
        dataCheckString,
        dataCheckStringBytes: Buffer.from(dataCheckString, 'utf8').toString('hex'),
        receivedHashLower: hash.toLowerCase(),
        computedHashLower: computedHash.toLowerCase(),
        botTokenPrefix: botToken.substring(0, 10) + '...',
        botTokenLength: botToken.length,
      });
      return false;
    }
    
    console.log('✅ Hash verification passed');
    
    // Check if auth is not too old (24 hours)
    // auth_date is a Unix timestamp (seconds since epoch)
    const authDate = new Date(authData.auth_date * 1000);
    const now = new Date();
    const hoursDiff = (now.getTime() - authDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      console.error('❌ Auth too old:', {
        hoursDiff: hoursDiff.toFixed(2),
        authDate: authDate.toISOString(),
        now: now.toISOString(),
      });
      return false;
    }
    
    console.log('✅ Auth date check passed:', {
      hoursDiff: hoursDiff.toFixed(2),
    });
    
    return true;
  } catch (error) {
    console.error('❌ Telegram auth verification error:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }
    return false;
  }
}

/**
 * Extract Telegram ID from auth data
 */
export function getTelegramId(authData: TelegramAuthData): number {
  return authData.id;
}
