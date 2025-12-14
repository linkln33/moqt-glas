export interface RiskFactors {
  accountAge: number; // days
  previousVotes: number;
  userAgentSuspicious: boolean;
  deviceFingerprintMatches: number;
  ipAddressMatches: number;
}

export interface RiskScore {
  score: number; // 0-100
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  recommendation: 'allow' | 'review' | 'block';
}

/**
 * Calculate risk score for a vote
 */
export function calculateRiskScore(
  telegramId: number,
  deviceFingerprint: string,
  ipAddress: string,
  userAgent: string,
  accountCreatedAt: Date,
  previousVotes: number,
  deviceMatches: number = 0,
  ipMatches: number = 0
): RiskScore {
  let score = 0;
  const factors: string[] = [];
  
  // Factor 1: Account age (new accounts = higher risk)
  const accountAge = (Date.now() - accountCreatedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (accountAge < 1) {
    score += 30;
    factors.push('Много нова сметка (< 1 ден)');
  } else if (accountAge < 7) {
    score += 15;
    factors.push('Нова сметка (< 7 дни)');
  } else if (accountAge < 30) {
    score += 5;
    factors.push('Скорошна сметка (< 30 дни)');
  }
  
  // Factor 2: Previous voting activity (too many = suspicious)
  if (previousVotes > 20) {
    score += 25;
    factors.push(`Висока активност при гласуване (${previousVotes} гласа)`);
  } else if (previousVotes > 10) {
    score += 10;
    factors.push(`Умерена активност (${previousVotes} гласа)`);
  }
  
  // Factor 3: User agent suspicious patterns
  const suspiciousPatterns = [
    /headless/i,
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /automation/i,
  ];
  
  const isSuspiciousUA = suspiciousPatterns.some(pattern => 
    pattern.test(userAgent)
  );
  
  if (isSuspiciousUA) {
    score += 40;
    factors.push('Подозрителен user agent');
  }
  
  // Factor 4: Device fingerprint matches
  if (deviceMatches > 1) {
    score += 50;
    factors.push(`Множество гласове от същото устройство (${deviceMatches})`);
  }
  
  // Factor 5: IP address matches
  if (ipMatches > 3) {
    score += 30;
    factors.push(`Множество гласове от същия IP (${ipMatches})`);
  } else if (ipMatches > 1) {
    score += 10;
    factors.push(`Няколко гласа от същия IP (${ipMatches})`);
  }
  
  // Determine risk level
  let level: 'low' | 'medium' | 'high' | 'critical';
  let recommendation: 'allow' | 'review' | 'block';
  
  if (score >= 80) {
    level = 'critical';
    recommendation = 'block';
  } else if (score >= 50) {
    level = 'high';
    recommendation = 'review';
  } else if (score >= 25) {
    level = 'medium';
    recommendation = 'allow'; // But flag for review
  } else {
    level = 'low';
    recommendation = 'allow';
  }
  
  return {
    score,
    level,
    factors,
    recommendation,
  };
}

/**
 * Check for duplicate patterns
 */
export async function checkDuplicatePatterns(
  deviceFingerprint: string,
  ipAddress: string,
  electionId: string,
  supabase: any
): Promise<{ deviceMatches: number; ipMatches: number }> {
  try {
    // Check device fingerprint matches
    const { count: deviceCount } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('election_id', electionId)
      .eq('device_fingerprint', deviceFingerprint);
    
    // Check IP address matches
    const { count: ipCount } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('election_id', electionId)
      .eq('ip_address', ipAddress);
    
    return {
      deviceMatches: deviceCount || 0,
      ipMatches: ipCount || 0,
    };
  } catch (error) {
    console.error('Duplicate pattern check error:', error);
    return { deviceMatches: 0, ipMatches: 0 };
  }
}
