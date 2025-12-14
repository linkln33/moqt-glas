import { NextRequest, NextResponse } from 'next/server';
import { verifyTelegramAuth, getTelegramId } from '@/lib/telegram-auth';
import { createServerClient } from '@/lib/supabase/client';
import { getOrCreateUserFromTelegram, updateUserLastLogin } from '@/lib/user-management';

export async function POST(request: NextRequest) {
  try {
    const authData = await request.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return NextResponse.json(
        { error: 'Bot token не е конфигуриран' },
        { status: 500 }
      );
    }

    // Log received auth data (without sensitive info)
    console.log('Received Telegram auth data:', {
      id: authData.id,
      first_name: authData.first_name,
      username: authData.username,
      auth_date: authData.auth_date,
      hasHash: !!authData.hash,
    });

    // Verify Telegram authentication
    const isValid = verifyTelegramAuth(authData, botToken);

    if (!isValid) {
      console.error('Telegram auth verification failed', {
        telegramId: authData.id,
        hasToken: !!botToken,
      });
      return NextResponse.json(
        { error: 'Невалидна автентификация. Моля, опитайте отново.' },
        { status: 401 }
      );
    }

    const telegramId = getTelegramId(authData);
    const supabase = createServerClient();

    // Get or create user profile in voting_user_profiles
    const userProfile = await getOrCreateUserFromTelegram({
      telegram_id: telegramId,
      first_name: authData.first_name,
      last_name: authData.last_name,
      username: authData.username,
      photo_url: authData.photo_url,
    });

    if (!userProfile) {
      console.error('Failed to create/get user profile');
      return NextResponse.json(
        { error: 'Грешка при създаване на профил' },
        { status: 500 }
      );
    }

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

    return NextResponse.json({
      success: true,
      user: {
        id: userProfile.id,
        telegramId,
        firstName: authData.first_name,
        lastName: authData.last_name,
        username: authData.username,
        photoUrl: authData.photo_url,
        role: userProfile.role,
        isVerified: userProfile.is_verified,
      },
    });
  } catch (error: any) {
    console.error('Telegram auth error:', error);
    return NextResponse.json(
      { error: 'Грешка при автентификация' },
      { status: 500 }
    );
  }
}
