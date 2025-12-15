import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/**
 * Create a creator profile
 * POST /api/creators/create-profile
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { telegramId, displayName, username, bio, bioBg } = body;

    if (!telegramId || !displayName) {
      return NextResponse.json(
        { error: 'Telegram ID and Display Name are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // First, ensure user exists in voters table (required foreign key)
    const { data: voter, error: voterError } = await supabase
      .from('voters')
      .select('telegram_id')
      .eq('telegram_id', parseInt(telegramId))
      .single();

    if (voterError && voterError.code !== 'PGRST116') {
      console.error('Error checking voter:', voterError);
      // Try to create voter if doesn't exist
      const { error: createVoterError } = await supabase
        .from('voters')
        .insert({
          telegram_id: parseInt(telegramId),
          first_name: displayName.split(' ')[0] || displayName,
          last_name: displayName.split(' ').slice(1).join(' ') || null,
        });

      if (createVoterError) {
        console.error('Error creating voter:', createVoterError);
        return NextResponse.json(
          { error: 'Грешка при създаване на потребител' },
          { status: 500 }
        );
      }
    }

    // Check if profile already exists
    const { data: existing } = await supabase
      .from('creator_profiles')
      .select('id')
      .eq('telegram_id', parseInt(telegramId))
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Профилът вече съществува' },
        { status: 400 }
      );
    }

    // Create creator profile
    const { data: profile, error: profileError } = await supabase
      .from('creator_profiles')
      .insert({
        telegram_id: parseInt(telegramId),
        display_name: displayName,
        username: username || null,
        bio: bio || null,
        bio_bg: bioBg || null,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating creator profile:', profileError);
      return NextResponse.json(
        { error: 'Грешка при създаване на профила' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile,
      message: 'Профилът е създаден успешно',
    });
  } catch (error) {
    console.error('Error in POST /api/creators/create-profile:', error);
    return NextResponse.json(
      { error: 'Вътрешна грешка' },
      { status: 500 }
    );
  }
}
