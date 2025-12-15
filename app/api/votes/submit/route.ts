import { NextRequest, NextResponse } from 'next/server';
import { verifyTelegramAuth, getTelegramId } from '@/lib/telegram-auth';
import { createServerClient } from '@/lib/supabase/client';
import { getClientIP } from '@/lib/utils';
import { checkIPRateLimit, checkDeviceRateLimit, checkTelegramIdRateLimit } from '@/lib/rate-limiting';
import { calculateRiskScore, checkDuplicatePatterns } from '@/lib/risk-scoring';
import { analyzeVotingBehavior, type BehaviorScore } from '@/lib/behavioral-analysis';

export async function POST(request: NextRequest) {
  try {
    const {
      telegramAuth,
      electionId,
      questionId,
      selectedOptions,
      deviceFingerprint,
      userBehavior,
    } = await request.json();

    // Handle authentication - support both callback and redirect methods
    if (!telegramAuth || !telegramAuth.id) {
      return NextResponse.json(
        { error: 'Необходима е автентификация. Моля, влезте в системата.' },
        { status: 401 }
      );
    }

    let telegramId: number | null = null;

    // Check if this is redirect-based auth (hash is placeholder or 'redirect-auth')
    if (telegramAuth.hash === 'redirect-auth' || !telegramAuth.hash || telegramAuth.hash === '') {
      // User logged in via redirect - trust the session
      // Just verify the telegramId is valid
      telegramId = typeof telegramAuth.id === 'number' 
        ? telegramAuth.id 
        : parseInt(String(telegramAuth.id), 10);
      
      if (!telegramId || isNaN(telegramId)) {
        return NextResponse.json(
          { error: 'Невалиден потребителски идентификатор' },
          { status: 401 }
        );
      }
    } else {
      // Full Telegram auth verification (callback method)
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { error: 'Bot token не е конфигуриран' },
        { status: 500 }
      );
    }

    const isValid = verifyTelegramAuth(telegramAuth, botToken);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Невалидна автентификация' },
        { status: 401 }
      );
    }

      telegramId = getTelegramId(telegramAuth);
    }

    if (!telegramId) {
      return NextResponse.json(
        { error: 'Не може да се определи потребителят. Моля, влезте отново.' },
        { status: 401 }
      );
    }
    
    // Check if Supabase is configured before creating client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl === 'https://placeholder.supabase.co') {
      return NextResponse.json(
        { error: 'Базата данни не е конфигурирана' },
        { status: 500 }
      );
    }
    
    const supabase = createServerClient();
    const ipAddress = getClientIP(request);

    // 2. Get voter info
    const { data: voter } = await supabase
      .from('voters')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    if (!voter) {
      return NextResponse.json(
        { error: 'Потребителят не е намерен' },
        { status: 404 }
      );
    }

    // 3. Check Telegram ID rate limit
    const tgLimit = await checkTelegramIdRateLimit(telegramId, electionId);
    if (!tgLimit.allowed) {
      return NextResponse.json(
        { error: tgLimit.reason },
        { status: 403 }
      );
    }

    // 4. Check device fingerprint rate limit
    if (deviceFingerprint) {
      const deviceLimit = await checkDeviceRateLimit(deviceFingerprint, electionId);
      if (!deviceLimit.allowed) {
        return NextResponse.json(
          { error: deviceLimit.reason },
          { status: 403 }
        );
      }
    }

    // 5. Check IP rate limit
    const ipLimit = await checkIPRateLimit(ipAddress, electionId, 3, 86400);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: ipLimit.reason },
        { status: 429 }
      );
    }

    // 6. Check duplicate patterns
    const patterns = await checkDuplicatePatterns(
      deviceFingerprint,
      ipAddress,
      electionId,
      supabase
    );

    // 7. Calculate risk score
    const riskScore = calculateRiskScore(
      telegramId,
      deviceFingerprint,
      ipAddress,
      request.headers.get('user-agent') || '',
      new Date(voter.created_at),
      await getPreviousVotesCount(supabase, telegramId),
      patterns.deviceMatches,
      patterns.ipMatches
    );

    // 8. Analyze behavior (optional - skip if not provided to avoid errors)
    let behaviorScore: BehaviorScore = { score: 0, suspicious: false, reasons: [] };
    try {
      if (userBehavior && typeof userBehavior === 'object') {
        behaviorScore = analyzeVotingBehavior(userBehavior);
      }
    } catch (e) {
      console.warn('Error analyzing behavior, continuing without behavior score:', e);
      // Continue without behavior score - it's optional
    }

    // 9. Combined risk assessment
    const totalRisk = riskScore.score + behaviorScore.score;

    // Block if critical risk
    if (totalRisk >= 100 || riskScore.recommendation === 'block') {
      // Log for manual review
      await supabase.from('suspicious_activities').insert({
        telegram_id: telegramId,
        device_fingerprint: deviceFingerprint,
        ip_address: ipAddress,
        risk_score: totalRisk,
        risk_factors: [
          ...riskScore.factors,
          ...behaviorScore.reasons,
        ].join('; '),
        election_id: electionId,
      });

      return NextResponse.json(
        {
          error: 'Гласът е блокиран поради висок резултат на риск',
          riskScore: totalRisk,
        },
        { status: 403 }
      );
    }

    // 10. Check for existing vote (database constraint)
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('election_id', electionId)
      .eq('telegram_id', telegramId)
      .eq('question_id', questionId)
      .single();

    if (existingVote) {
      return NextResponse.json(
        { error: 'Вече сте гласували за този въпрос' },
        { status: 409 }
      );
    }

    // 11. Submit vote
    console.log('Submitting vote:', {
      electionId,
      telegramId,
      questionId,
      selectedOptions,
      totalRisk,
      behaviorScore: behaviorScore.score,
    });

    // Ensure selectedOptions is an array
    const optionsArray = Array.isArray(selectedOptions) ? selectedOptions : [selectedOptions].filter(Boolean);
    
    if (!optionsArray || optionsArray.length === 0) {
      return NextResponse.json(
        { error: 'Необходимо е да изберете поне една опция' },
        { status: 400 }
      );
    }

    console.log('Submitting vote with data:', {
      election_id: electionId,
      telegram_id: telegramId,
      question_id: questionId,
      selected_options: optionsArray,
      selected_options_type: typeof optionsArray,
      selected_options_is_array: Array.isArray(optionsArray),
    });

    const { data: vote, error: voteError } = await supabase
      .from('votes')
      .insert({
        election_id: electionId,
        telegram_id: telegramId,
        question_id: questionId,
        selected_options: optionsArray, // Ensure it's an array
        device_fingerprint: deviceFingerprint || null,
        ip_address: ipAddress,
        risk_score: totalRisk,
        behavior_score: behaviorScore.score,
      })
      .select()
      .single();

    if (voteError) {
      console.error('Vote insertion error:', {
        code: voteError.code,
        message: voteError.message,
        details: voteError.details,
        hint: voteError.hint,
        election_id: electionId,
        telegram_id: telegramId,
        question_id: questionId,
        selected_options: optionsArray,
      });
      
      // Check if it's a unique constraint violation
      if (voteError.code === '23505') {
        return NextResponse.json(
          { error: 'Вече сте гласували за този въпрос' },
          { status: 409 }
        );
      }
      
      // Check for foreign key violations
      if (voteError.code === '23503') {
        return NextResponse.json(
          { error: 'Невалиден въпрос или избори', details: voteError.message },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Грешка при запазване на гласа',
          details: voteError.message,
          code: voteError.code,
        },
        { status: 500 }
      );
    }

    if (!vote) {
      console.error('Vote insertion returned no data');
      return NextResponse.json(
        { error: 'Гласът не беше запазен' },
        { status: 500 }
      );
    }

    console.log('Vote submitted successfully:', {
      voteId: vote.id,
      electionId: vote.election_id,
      questionId: vote.question_id,
      selectedOptions: vote.selected_options,
    });

    // 12. Flag for review if medium/high risk
    if (totalRisk >= 50 || riskScore.recommendation === 'review') {
      await supabase.from('suspicious_activities').insert({
        telegram_id: telegramId,
        device_fingerprint: deviceFingerprint,
        ip_address: ipAddress,
        risk_score: totalRisk,
        risk_factors: [
          ...riskScore.factors,
          ...behaviorScore.reasons,
        ].join('; '),
        election_id: electionId,
        vote_id: vote.id,
        status: 'flagged',
      });
    }

    return NextResponse.json({
      success: true,
      voteId: vote.id,
      riskScore: totalRisk,
      message: 'Гласът е записан успешно',
    });
  } catch (error: any) {
    console.error('Vote submission error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack,
    });
    return NextResponse.json(
      { 
        error: error.message || 'Грешка при подаване на глас',
        details: process.env.NODE_ENV === 'development' ? error.details : undefined,
      },
      { status: 500 }
    );
  }
}

async function getPreviousVotesCount(supabase: any, telegramId: number): Promise<number> {
  try {
    const { count } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('telegram_id', telegramId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    return count || 0;
  } catch (error) {
    return 0;
  }
}
