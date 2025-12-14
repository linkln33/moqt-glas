import { NextRequest, NextResponse } from 'next/server';
import { verifyTelegramAuth, getTelegramId } from '@/lib/telegram-auth';
import { createServerClient } from '@/lib/supabase/client';

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
    } = await request.json();

    // Verify Telegram authentication
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

    const telegramId = getTelegramId(telegramAuth);
    const supabase = createServerClient();

    // Create election
    const { data: election, error: electionError } = await supabase
      .from('elections')
      .insert({
        title: title || title_bg,
        title_bg,
        description: description || description_bg,
        description_bg,
        status: 'upcoming',
        start_date,
        end_date,
        created_by: telegramId.toString(),
        has_fundraising: has_fundraising || false,
        fundraising_goal: has_fundraising && fundraising_goal ? parseFloat(fundraising_goal) : null,
        fundraising_currency: has_fundraising ? (fundraising_currency || 'BGN') : null,
        fundraising_description_bg: has_fundraising ? (fundraising_description_bg || null) : null,
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
