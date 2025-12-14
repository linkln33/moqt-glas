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
    
    // Create data check string (sorted alphabetically, only include defined values)
    // According to Telegram docs: only include fields that are present
    const dataCheckString = Object.keys(data)
      .filter(key => {
        const value = data[key as keyof typeof data];
        // Only include fields that are not undefined/null
        return value !== undefined && value !== null;
      })
      .sort()
      .map(key => {
        const value = data[key as keyof typeof data];
        // Convert to string (Telegram sends all values as strings)
        return `${key}=${String(value)}`;
      })
      .join('\n');
    
    // Compute secret key (SHA256 of bot token)
    const secretKey = crypto
      .createHash('sha256')
      .update(botToken)
      .digest();
    
    // Compute HMAC-SHA-256
    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    // Verify hash matches (case-insensitive comparison as per Telegram docs)
    if (computedHash.toLowerCase() !== hash.toLowerCase()) {
      console.error('Hash mismatch:', {
        computed: computedHash,
        received: hash,
        dataCheckString,
      });
      return false;
    }
    
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
