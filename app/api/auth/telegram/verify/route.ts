import { NextRequest, NextResponse } from 'next/server';
import { verifyTelegramAuth, getTelegramId } from '@/lib/telegram-auth';
import { createServerClient } from '@/lib/supabase/client';
import { getOrCreateUserFromTelegram, updateUserLastLogin } from '@/lib/user-management';

export async function POST(request: NextRequest) {
  try {
    const authData = await request.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Log bot token status (without exposing full token)
    console.log('🔑 Bot token check:', {
      hasToken: !!botToken,
      tokenLength: botToken?.length || 0,
      tokenPrefix: botToken ? botToken.substring(0, 10) + '...' : 'N/A',
      expectedLength: 46, // Telegram bot tokens are typically 46 characters
      tokenFormat: botToken ? (botToken.includes(':') ? 'correct' : 'missing colon') : 'missing',
    });

    if (!botToken) {
      console.error('❌ TELEGRAM_BOT_TOKEN not configured');
      return NextResponse.json(
        { error: 'Bot token не е конфигуриран' },
        { status: 500 }
      );
    }

    // Validate bot token format (should be: number:alphanumeric)
    if (!botToken.includes(':')) {
      console.error('❌ TELEGRAM_BOT_TOKEN format invalid (should contain colon)');
      return NextResponse.json(
        { error: 'Невалиден формат на bot token' },
        { status: 500 }
      );
    }

    if (!serviceRoleKey || serviceRoleKey === 'your_service_role_key_here' || serviceRoleKey.includes('placeholder')) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured properly', {
        hasKey: !!serviceRoleKey,
        keyPreview: serviceRoleKey?.substring(0, 20),
      });
      return NextResponse.json(
        { error: 'Базата данни не е конфигурирана правилно. Моля, проверете SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 500 }
      );
    }
    
    console.log('Service role key configured:', {
      keyLength: serviceRoleKey.length,
      keyPreview: serviceRoleKey.substring(0, 20) + '...',
    });

    // Log received auth data (without sensitive info)
    console.log('📥 Received Telegram auth data:', {
      id: authData.id,
      first_name: authData.first_name,
      last_name: authData.last_name,
      username: authData.username,
      photo_url: authData.photo_url ? 'present' : 'missing',
      auth_date: authData.auth_date,
      hash: authData.hash ? authData.hash.substring(0, 16) + '...' : 'missing',
      hashLength: authData.hash?.length || 0,
      allKeys: Object.keys(authData),
      dataTypes: Object.entries(authData).reduce((acc, [key, value]) => {
        acc[key] = typeof value;
        return acc;
      }, {} as Record<string, string>),
    });

    // Validate required fields
    if (!authData.id || !authData.first_name || !authData.auth_date || !authData.hash) {
      console.error('❌ Missing required fields:', {
        hasId: !!authData.id,
        hasFirstName: !!authData.first_name,
        hasAuthDate: !!authData.auth_date,
        hasHash: !!authData.hash,
      });
      return NextResponse.json(
        { error: 'Липсват задължителни данни от Telegram. Моля, опитайте отново.' },
        { status: 400 }
      );
    }

    // Verify Telegram authentication
    console.log('🔍 Starting authentication verification...');
    const isValid = verifyTelegramAuth(authData, botToken);

    if (!isValid) {
      console.error('❌ Telegram auth verification failed', {
        telegramId: authData.id,
        hasToken: !!botToken,
        tokenLength: botToken?.length || 0,
      });
      return NextResponse.json(
        { error: 'Невалидна автентификация. Моля, проверете конфигурацията на бота и опитайте отново.' },
        { status: 401 }
      );
    }

    console.log('✅ Telegram authentication verified successfully');

    const telegramId = getTelegramId(authData);
    const supabase = createServerClient();

    // Get or create user profile in voting_user_profiles
    console.log('Creating/getting user profile for Telegram ID:', telegramId);
    const userProfile = await getOrCreateUserFromTelegram({
      telegram_id: telegramId,
      first_name: authData.first_name,
      last_name: authData.last_name,
      username: authData.username,
      photo_url: authData.photo_url,
    });

    if (!userProfile) {
      console.error('Failed to create/get user profile', {
        telegramId,
        firstName: authData.first_name,
      });
      
      // Try fallback: create voter directly
      const { data: fallbackVoter, error: fallbackError } = await supabase
        .from('voters')
        .upsert({
          telegram_id: telegramId,
          first_name: authData.first_name,
          last_name: authData.last_name || null,
          username: authData.username || null,
          photo_url: authData.photo_url || null,
        }, {
          onConflict: 'telegram_id',
        })
        .select()
        .single();
      
      if (fallbackError || !fallbackVoter) {
        console.error('Fallback voter creation also failed:', fallbackError);
        return NextResponse.json(
          { error: 'Грешка при създаване на профил. Моля, опитайте отново.' },
          { status: 500 }
        );
      }
      
      // Return with voter data if user profile creation failed
      return NextResponse.json({
        success: true,
        user: {
          id: fallbackVoter.telegram_id.toString(),
          telegramId,
          firstName: authData.first_name,
          lastName: authData.last_name,
          username: authData.username,
          photoUrl: authData.photo_url,
          role: 'voter',
          isVerified: true,
        },
      });
    }
    
    console.log('User profile created/retrieved:', {
      userId: userProfile.id,
      telegramId: userProfile.telegram_id,
    });

    // Update last login
    await updateUserLastLogin(userProfile.id);

    // Also create/update voter record (for backward compatibility)
    const { data: voter, error: voterError } = await supabase
      .from('voters')
      .upsert({
        telegram_id: telegramId,
        first_name: authData.first_name,
        last_name: authData.last_name || null,
        username: authData.username || null,
        photo_url: authData.photo_url || null,
        voting_user_id: userProfile.id,
      }, {
        onConflict: 'telegram_id',
      })
      .select()
      .single();

    if (voterError) {
      console.error('Voter creation error:', voterError);
      // Don't fail the request if voter creation fails, user profile is already created
    }

    const responseData = {
      success: true,
      user: {
        id: userProfile.id,
        telegramId,
        firstName: authData.first_name,
        lastName: authData.last_name,
        username: authData.username,
        photoUrl: authData.photo_url,
        role: userProfile.role || 'voter',
        isVerified: userProfile.is_verified ?? true,
      },
    };

    console.log('Returning successful auth response:', {
      userId: responseData.user.id,
      telegramId: responseData.user.telegramId,
    });

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Telegram auth error:', error);
    return NextResponse.json(
      { error: 'Грешка при автентификация' },
      { status: 500 }
    );
  }
}
