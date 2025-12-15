import { NextRequest, NextResponse } from 'next/server';
import { verifyTelegramAuth, getTelegramId } from '@/lib/telegram-auth';
import { createServerClient } from '@/lib/supabase/client';
import { isElectionActive, hasElectionEnded } from '@/lib/utils';

export async function POST(request: NextRequest) {
  // Check if Supabase is configured (not placeholder)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl === 'https://placeholder.supabase.co') {
    return NextResponse.json(
      { error: 'Базата данни не е конфигурирана' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const {
      telegramAuth,
      title,
      title_bg,
      description,
      description_bg,
      start_date,
      end_date,
      questions,
      has_fundraising,
      fundraising_goal,
      fundraising_currency,
      fundraising_description_bg,
      fundraising_end_date,
      fundraising_purpose,
      fundraising_min_amount,
      fundraising_suggested_amounts,
      fundraising_payment_methods,
      fundraising_show_donors,
    } = body;

    const supabase = createServerClient();
    let telegramId: number | null = null;

    // Handle authentication - support both callback and redirect methods
    if (!telegramAuth || !telegramAuth.id) {
      return NextResponse.json(
        { error: 'Необходима е автентификация. Моля, влезте в системата.' },
        { status: 401 }
      );
    }

    // Check if this is redirect-based auth (hash is placeholder)
    if (telegramAuth.hash === 'redirect-auth') {
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

      // Verify user exists in database
      const { data: voter } = await supabase
        .from('voters')
        .select('telegram_id')
        .eq('telegram_id', telegramId)
        .maybeSingle();

      if (!voter) {
        return NextResponse.json(
          { error: 'Потребителят не е намерен. Моля, влезте отново.' },
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

    // Calculate election status based on dates
    // Handle empty strings and null values
    const hasStartDate = start_date && start_date.trim() !== '';
    const hasEndDate = end_date && end_date.trim() !== '';
    
    let electionStatus = 'upcoming';
    if (hasStartDate && hasEndDate) {
      try {
        const start = new Date(start_date);
        const end = new Date(end_date);
        const now = new Date();
        
        // Validate dates
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          console.warn('Invalid dates provided, defaulting to upcoming:', { start_date, end_date });
          electionStatus = 'upcoming';
        } else {
          // Check if ended first
          if (hasElectionEnded(end)) {
            electionStatus = 'ended';
          } else if (isElectionActive(start, end)) {
            electionStatus = 'active';
          } else {
            electionStatus = 'upcoming';
          }
          
          // Debug logging
          console.log('Election status calculation:', {
            start_date: start.toISOString(),
            end_date: end.toISOString(),
            now: now.toISOString(),
            calculatedStatus: electionStatus,
            isActive: isElectionActive(start, end),
            hasEnded: hasElectionEnded(end),
            rawStartDate: start_date,
            rawEndDate: end_date,
          });
        }
      } catch (error) {
        console.error('Error calculating election status:', error);
        electionStatus = 'upcoming';
      }
    } else {
      console.warn('Missing dates, defaulting to upcoming:', { hasStartDate, hasEndDate, start_date, end_date });
    }

    // Create election - convert empty strings to null for timestamp fields
    const { data: election, error: electionError } = await supabase
      .from('elections')
      .insert({
        title: title || title_bg,
        title_bg,
        description: description || description_bg,
        description_bg,
        status: electionStatus,
        start_date: hasStartDate ? start_date : null,
        end_date: hasEndDate ? end_date : null,
        created_by: telegramId.toString(),
        has_fundraising: has_fundraising || false,
        fundraising_goal: has_fundraising && fundraising_goal ? parseFloat(fundraising_goal) : null,
        fundraising_currency: has_fundraising ? (fundraising_currency || 'BGN') : null,
        fundraising_description_bg: has_fundraising ? (fundraising_description_bg || null) : null,
        fundraising_end_date: has_fundraising && fundraising_end_date && fundraising_end_date.trim() !== '' 
          ? fundraising_end_date 
          : null,
        fundraising_purpose: has_fundraising && fundraising_purpose ? fundraising_purpose : null,
        fundraising_min_amount: has_fundraising && fundraising_min_amount ? parseFloat(fundraising_min_amount) : null,
        fundraising_suggested_amounts: has_fundraising && fundraising_suggested_amounts ? fundraising_suggested_amounts : null,
        fundraising_payment_methods: has_fundraising && fundraising_payment_methods && fundraising_payment_methods.length > 0 
          ? fundraising_payment_methods 
          : null,
        fundraising_show_donors: has_fundraising ? (fundraising_show_donors !== undefined ? fundraising_show_donors : true) : null,
      })
      .select()
      .single();

    if (electionError) {
      throw electionError;
    }

    // Create questions and options
    for (let qIndex = 0; qIndex < questions.length; qIndex++) {
      const question = questions[qIndex];

      const { data: createdQuestion, error: questionError } = await supabase
        .from('questions')
        .insert({
          election_id: election.id,
          question_text: question.question_text || question.question_text_bg,
          question_text_bg: question.question_text_bg,
          question_type: question.question_type,
          order_index: qIndex,
        })
        .select()
        .single();

      if (questionError) {
        throw questionError;
      }

      // Create options
      const optionsToInsert = question.options.map((option: any, oIndex: number) => ({
        question_id: createdQuestion.id,
        option_text: option.option_text || option.option_text_bg,
        option_text_bg: option.option_text_bg,
        order_index: oIndex,
      }));

      const { error: optionsError } = await supabase
        .from('options')
        .insert(optionsToInsert);

      if (optionsError) {
        throw optionsError;
      }
    }

    // Create notifications for all users (except creator) about the new poll
    // This is done via API call, but the database trigger will also handle it
    try {
      const { data: allUsers } = await supabase
        .from('voters')
        .select('telegram_id')
        .neq('telegram_id', telegramId);

      if (allUsers && allUsers.length > 0) {
        const notifications = allUsers.map((user) => ({
          user_id: user.telegram_id,
          type: 'new_poll',
          title: 'New Poll Created',
          message: `A new poll "${title || title_bg || 'Untitled'}" has been created`,
          message_bg: `Нова анкета "${title_bg || title || 'Без заглавие'}" беше създадена`,
          related_id: election.id,
          related_type: 'election',
          is_read: false,
        }));

        await supabase.from('notifications').insert(notifications);
      }
    } catch (notifError) {
      // Don't fail poll creation if notifications fail
      console.warn('Failed to create notifications:', notifError);
    }

    return NextResponse.json({
      success: true,
      electionId: election.id,
      message: 'Изборите са създадени успешно',
    });
  } catch (error: any) {
    console.error('Election creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Грешка при създаване на изборите' },
      { status: 500 }
    );
  }
}
