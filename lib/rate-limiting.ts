import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  reason?: string;
}

/**
 * Check IP rate limit (max 3 votes per IP per election per day)
 */
export async function checkIPRateLimit(
  ipAddress: string,
  electionId: string,
  maxVotes: number = 3,
  windowSeconds: number = 86400 // 24 hours
): Promise<RateLimitResult> {
  const key = `ratelimit:ip:${electionId}:${ipAddress}`;
  
  try {
    const current = (await redis.get<number>(key)) || 0;
    
    if (current >= maxVotes) {
      const ttl = await redis.ttl(key);
      return {
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + (ttl * 1000),
        reason: `Достигнат е лимитът от ${maxVotes} гласа на IP адрес на ден`,
      };
    }
    
    const newCount = await redis.incr(key);
    if (newCount === 1) {
      await redis.expire(key, windowSeconds);
    }
    
    const ttl = await redis.ttl(key);
    
    return {
      allowed: true,
      remaining: maxVotes - newCount,
      resetAt: Date.now() + (ttl * 1000),
    };
  } catch (error) {
    console.error('IP rate limit error:', error);
    // Fail open - allow vote if Redis is down
    return {
      allowed: true,
      remaining: maxVotes,
      resetAt: Date.now() + windowSeconds * 1000,
    };
  }
}

/**
 * Check device fingerprint rate limit (1 vote per device per election)
 */
export async function checkDeviceRateLimit(
  deviceFingerprint: string,
  electionId: string
): Promise<RateLimitResult> {
  const key = `ratelimit:device:${electionId}:${deviceFingerprint}`;
  
  try {
    const current = await redis.get<number>(key);
    
    if (current && current > 0) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 86400000, // 24 hours
        reason: 'Това устройство вече е гласувало',
      };
    }
    
    // Mark device as used (expires in 30 days)
    await redis.set(key, 1, { ex: 2592000 });
    
    return {
      allowed: true,
      remaining: 0,
      resetAt: Date.now() + 2592000000,
    };
  } catch (error) {
    console.error('Device rate limit error:', error);
    return {
      allowed: true,
      remaining: 0,
      resetAt: Date.now() + 2592000000,
    };
  }
}

/**
 * Check Telegram ID rate limit (1 vote per Telegram account per election)
 */
export async function checkTelegramIdRateLimit(
  telegramId: number,
  electionId: string
): Promise<RateLimitResult> {
  const key = `ratelimit:tg:${electionId}:${telegramId}`;
  
  try {
    const current = await redis.get<number>(key);
    
    if (current && current > 0) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 86400000,
        reason: 'Вече сте гласували в тези избори',
      };
    }
    
    // Mark as voted (permanent for this election)
    await redis.set(key, 1);
    
    return {
      allowed: true,
      remaining: 0,
      resetAt: Date.now() + 31536000000, // 1 year
    };
  } catch (error) {
    console.error('Telegram ID rate limit error:', error);
    return {
      allowed: true,
      remaining: 0,
      resetAt: Date.now() + 31536000000,
    };
  }
}
