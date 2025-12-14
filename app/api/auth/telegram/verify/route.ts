import { NextRequest, NextResponse } from 'next/server';
import { verifyTelegramAuth, getTelegramId } from '@/lib/telegram-auth';
import { createServerClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const authData = await request.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return NextResponse.json(
        { error: 'Bot token не е конфигуриран' },
        { status: 500 }
      );
    }

    // Verify Telegram authentication
    const isValid = verifyTelegramAuth(authData, botToken);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Невалидна автентификация' },
        { status: 401 }
      );
    }

    const telegramId = getTelegramId(authData);
    const supabase = createServerClient();

    // Create or update voter
    const { data: voter, error: voterError } = await supabase
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

    if (voterError) {
      console.error('Voter creation error:', voterError);
      return NextResponse.json(
        { error: 'Грешка при създаване на профил' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        telegramId,
        firstName: authData.first_name,
        lastName: authData.last_name,
        username: authData.username,
        photoUrl: authData.photo_url,
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
