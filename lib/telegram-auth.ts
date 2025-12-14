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
 * @param authData - Data received from Telegram Login Widget
 * @param botToken - Telegram bot token
 * @returns true if authentication is valid
 */
export function verifyTelegramAuth(
  authData: TelegramAuthData,
  botToken: string
): boolean {
  try {
    const { hash, ...data } = authData;
    
    console.log('🔐 Starting hash verification:', {
      hasHash: !!hash,
      dataKeys: Object.keys(data),
      botTokenLength: botToken.length,
    });
    
    // Create data check string (sorted alphabetically, only include defined values)
    // According to Telegram docs: only include fields that are present
    // Telegram sends all values as strings in the URL, so we need to match that format
    const dataCheckString = Object.keys(data)
      .filter(key => {
        const value = data[key as keyof typeof data];
        // Only include fields that are not undefined/null
        return value !== undefined && value !== null;
      })
      .sort()
      .map(key => {
        const value = data[key as keyof typeof data];
        // Convert to string - Telegram sends all values as strings in URL params
        // Numbers should be converted to their string representation
        const stringValue = typeof value === 'number' ? String(value) : String(value);
        return `${key}=${stringValue}`;
      })
      .join('\n');
    
    console.log('📝 Data check string:', {
      string: dataCheckString,
      length: dataCheckString.length,
      lines: dataCheckString.split('\n'),
    });
    
    // Compute secret key (SHA256 of bot token)
    const secretKey = crypto
      .createHash('sha256')
      .update(botToken)
      .digest();
    
    console.log('🔑 Secret key computed:', {
      keyLength: secretKey.length,
    });
    
    // Compute HMAC-SHA-256
    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    console.log('🔐 Hash comparison:', {
      computed: computedHash,
      received: hash,
      match: computedHash.toLowerCase() === hash.toLowerCase(),
    });
    
    // Verify hash matches (case-insensitive comparison as per Telegram docs)
    if (computedHash.toLowerCase() !== hash.toLowerCase()) {
      console.error('❌ Hash mismatch:', {
        computed: computedHash,
        received: hash,
        dataCheckString,
        dataCheckStringBytes: Buffer.from(dataCheckString).toString('hex'),
        receivedHashLower: hash.toLowerCase(),
        computedHashLower: computedHash.toLowerCase(),
      });
      return false;
    }
    
    console.log('✅ Hash verification passed');
    
    // Check if auth is not too old (24 hours)
    const authDate = new Date(authData.auth_date * 1000);
    const now = new Date();
    const hoursDiff = (now.getTime() - authDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      console.error('Auth too old:', hoursDiff, 'hours');
      return false; // Auth too old
    }
    
    return true;
  } catch (error) {
    console.error('Telegram auth verification error:', error);
    return false;
  }
}

/**
 * Extract Telegram ID from auth data
 */
export function getTelegramId(authData: TelegramAuthData): number {
  return authData.id;
}
