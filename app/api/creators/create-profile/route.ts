import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/**
 * GET handler - returns error since this endpoint only supports POST
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'This endpoint only supports POST requests. Use POST to create a creator profile.' },
    { status: 405 }
  );
}

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
    const telegramIdInt = parseInt(telegramId);
    if (isNaN(telegramIdInt)) {
      return NextResponse.json(
        { error: 'Невалиден потребителски идентификатор' },
        { status: 400 }
      );
    }

    const { data: voter, error: voterError } = await supabase
      .from('voters')
      .select('telegram_id')
      .eq('telegram_id', telegramIdInt)
      .maybeSingle();

    if (voterError) {
      console.error('Error checking voter:', voterError);
      // If voters table doesn't exist, return error
      if (voterError.code === '42P01' || voterError.code === '42883') {
        return NextResponse.json(
          { error: 'Таблицата за потребители не съществува', details: voterError.message },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: 'Грешка при проверка на потребителя', details: voterError.message },
        { status: 500 }
      );
    }

    // If voter doesn't exist, try to create one
    if (!voter) {
      console.log('Voter does not exist, creating voter:', telegramIdInt);
      const { data: newVoter, error: createVoterError } = await supabase
        .from('voters')
        .insert({
          telegram_id: telegramIdInt,
          first_name: displayName.split(' ')[0] || displayName,
          last_name: displayName.split(' ').slice(1).join(' ') || null,
        })
        .select()
        .single();

      if (createVoterError) {
        console.error('Error creating voter:', {
          code: createVoterError.code,
          message: createVoterError.message,
          details: createVoterError.details,
          hint: createVoterError.hint,
        });
        
        // If it's a unique constraint violation, voter might have been created concurrently
        if (createVoterError.code === '23505') {
          console.log('Voter already exists (concurrent creation), continuing...');
          // Continue - voter exists now
        } else {
          return NextResponse.json(
            { 
              error: 'Грешка при създаване на потребител', 
              details: createVoterError.message,
              code: createVoterError.code,
            },
            { status: 500 }
          );
        }
      } else {
        console.log('Voter created successfully:', newVoter?.telegram_id);
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
        telegram_id: telegramIdInt,
        display_name: displayName,
        username: username || null,
        bio: bio || null,
        bio_bg: bioBg || null,
        is_active: true,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating creator profile:', {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
      });
      
      // If table doesn't exist, return helpful error
      if (profileError.code === '42P01' || profileError.code === '42883') {
        return NextResponse.json(
          { 
            error: 'Таблицата за профили не съществува',
            details: 'Моля, създайте таблицата creator_profiles в базата данни',
            code: profileError.code,
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Грешка при създаване на профила',
          details: profileError.message,
          code: profileError.code,
        },
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
