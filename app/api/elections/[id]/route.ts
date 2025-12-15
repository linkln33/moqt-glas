import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { isSchemaCacheError, shouldTreatErrorAsNonFatal, isElectionActive, hasElectionEnded } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const electionId = params.id;
    const supabase = createServerClient();

    // Fetch election
    const { data: election, error: electionError } = await supabase
      .from('elections')
      .select('*')
      .eq('id', electionId)
      .single();

    if (electionError) {
      // Handle schema cache errors gracefully during build
      if (isSchemaCacheError(electionError)) {
        console.warn('⚠️ Schema cache not refreshed yet (PGRST205). Returning 404. This is normal during build.');
        return NextResponse.json(
          { error: 'Изборите не са намерени' },
          { status: 404 }
        );
      }
      
      // During build, treat errors as non-fatal
      if (shouldTreatErrorAsNonFatal(electionError)) {
        return NextResponse.json(
          { error: 'Изборите не са намерени' },
          { status: 404 }
        );
      }
    }

    if (!election) {
      return NextResponse.json(
        { error: 'Изборите не са намерени' },
        { status: 404 }
      );
    }

    // Fetch questions
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('election_id', electionId)
      .order('order_index', { ascending: true });

    if (questionsError) {
      return NextResponse.json(
        { error: 'Грешка при зареждане на въпросите' },
        { status: 500 }
      );
    }

    // Fetch options for each question
    const questionsWithOptions = await Promise.all(
      (questions || []).map(async (question) => {
        const { data: options } = await supabase
          .from('options')
          .select('*')
          .eq('question_id', question.id)
          .order('order_index', { ascending: true });

        return {
          ...question,
          options: options || [],
        };
      })
    );

    return NextResponse.json({
      election,
      questions: questionsWithOptions,
    });
  } catch (error: any) {
    console.error('Election fetch error:', error);
    return NextResponse.json(
      { error: 'Грешка при зареждане на изборите' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const electionId = params.id;
    const supabase = createServerClient();
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

    // Verify authentication
    let telegramId: number | null = null;
    
    if (!telegramAuth || !telegramAuth.id) {
      return NextResponse.json(
        { error: 'Необходима е автентификация. Моля, влезте в системата.' },
        { status: 401 }
      );
    }

    // Handle redirect-based auth
    if (telegramAuth.hash === 'redirect-auth') {
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
      // Full Telegram auth verification
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        return NextResponse.json(
          { error: 'Bot token не е конфигуриран' },
          { status: 500 }
        );
      }

      const { verifyTelegramAuth, getTelegramId } = await import('@/lib/telegram-auth');
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

    // Verify ownership
    const { data: existingElection, error: fetchError } = await supabase
      .from('elections')
      .select('created_by')
      .eq('id', electionId)
      .single();

    if (fetchError || !existingElection) {
      return NextResponse.json(
        { error: 'Анкетата не е намерена' },
        { status: 404 }
      );
    }

    if (existingElection.created_by !== telegramId.toString()) {
      return NextResponse.json(
        { error: 'Нямате право да редактирате тази анкета' },
        { status: 403 }
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
          
          // Get current Bulgaria time for debugging
          const now = new Date();
          const nowBG = now.toLocaleString('en-US', {
            timeZone: 'Europe/Sofia',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });
          
          const startBG = start.toLocaleString('en-US', {
            timeZone: 'Europe/Sofia',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });
          
          const endBG = end.toLocaleString('en-US', {
            timeZone: 'Europe/Sofia',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });
          
          // Debug logging
          console.log('Election status calculation (update):', {
            // UTC times
            start_date_UTC: start.toISOString(),
            end_date_UTC: end.toISOString(),
            now_UTC: now.toISOString(),
            // Bulgaria times
            start_date_BG: startBG,
            end_date_BG: endBG,
            now_BG: nowBG,
            // Status
            calculatedStatus: electionStatus,
            isActive: isElectionActive(start, end),
            hasEnded: hasElectionEnded(end),
            // Raw input
            rawStartDate: start_date,
            rawEndDate: end_date,
          });
        }
      } catch (error) {
        console.error('Error calculating election status:', error);
        electionStatus = 'upcoming';
      }
    } else {
      console.warn('Missing dates during update, defaulting to upcoming:', { hasStartDate, hasEndDate, start_date, end_date });
    }

    // Update election
    const { error: electionError } = await supabase
      .from('elections')
      .update({
        title: title || title_bg,
        title_bg,
        description: description || description_bg,
        description_bg,
        status: electionStatus,
        start_date: hasStartDate ? start_date : null,
        end_date: hasEndDate ? end_date : null,
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
      .eq('id', electionId);

    if (electionError) {
      throw electionError;
    }

    // Delete existing questions and options
    const { data: existingQuestions, error: fetchQuestionsError } = await supabase
      .from('questions')
      .select('id')
      .eq('election_id', electionId);

    if (fetchQuestionsError) {
      console.error('Error fetching existing questions:', fetchQuestionsError);
      throw fetchQuestionsError;
    }

    if (existingQuestions && existingQuestions.length > 0) {
      const questionIds = existingQuestions.map(q => q.id);
      
      // Delete options first (due to foreign key constraint)
      const { error: deleteOptionsError } = await supabase
        .from('options')
        .delete()
        .in('question_id', questionIds);
      
      if (deleteOptionsError) {
        console.error('Error deleting options:', deleteOptionsError);
        throw deleteOptionsError;
      }
      
      // Then delete questions
      const { error: deleteQuestionsError } = await supabase
        .from('questions')
        .delete()
        .eq('election_id', electionId);
      
      if (deleteQuestionsError) {
        console.error('Error deleting questions:', deleteQuestionsError);
        throw deleteQuestionsError;
      }
    }

    // Validate questions array
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      console.warn('No questions provided for update, skipping question creation');
    } else {
      // Create new questions and options
      for (let qIndex = 0; qIndex < questions.length; qIndex++) {
        const question = questions[qIndex];

        if (!question.question_text_bg || question.question_text_bg.trim() === '') {
          console.warn(`Skipping question ${qIndex} - no text provided`);
          continue;
        }

        const { data: createdQuestion, error: questionError } = await supabase
          .from('questions')
          .insert({
            election_id: electionId,
            question_text: question.question_text || question.question_text_bg,
            question_text_bg: question.question_text_bg,
            question_type: question.question_type || 'single-choice',
            order_index: qIndex,
          })
          .select()
          .single();

        if (questionError) {
          console.error(`Error creating question ${qIndex}:`, questionError);
          throw questionError;
        }

        // Create options if they exist
        if (question.options && Array.isArray(question.options) && question.options.length > 0) {
          const optionsToInsert = question.options
            .filter((option: any) => option.option_text_bg && option.option_text_bg.trim() !== '')
            .map((option: any, oIndex: number) => ({
              question_id: createdQuestion.id,
              option_text: option.option_text || option.option_text_bg,
              option_text_bg: option.option_text_bg,
              order_index: oIndex,
            }));

          if (optionsToInsert.length > 0) {
            const { error: optionsError } = await supabase
              .from('options')
              .insert(optionsToInsert);

            if (optionsError) {
              console.error(`Error creating options for question ${qIndex}:`, optionsError);
              throw optionsError;
            }
          }
        }
      }
    }

    console.log('Election updated successfully:', {
      electionId,
      status: electionStatus,
      questionsCount: questions?.length || 0,
    });

    return NextResponse.json({
      success: true,
      electionId,
      message: 'Изборите са обновени успешно',
    });
  } catch (error: any) {
    console.error('Election update error:', {
      electionId: params.id,
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack,
    });
    return NextResponse.json(
      { 
        error: error.message || 'Грешка при обновяване на изборите',
        details: process.env.NODE_ENV === 'development' ? error.details : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const electionId = params.id;
    const { telegramId } = await request.json();

    if (!telegramId) {
      return NextResponse.json(
        { error: 'Необходима е автентификация' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // First, verify the user owns this election
    const { data: election, error: electionError } = await supabase
      .from('elections')
      .select('created_by')
      .eq('id', electionId)
      .single();

    if (electionError || !election) {
      return NextResponse.json(
        { error: 'Анкетата не е намерена' },
        { status: 404 }
      );
    }

    // Check ownership
    if (election.created_by !== telegramId.toString()) {
      return NextResponse.json(
        { error: 'Нямате право да изтриете тази анкета' },
        { status: 403 }
      );
    }

    // Delete votes first (cascade)
    await supabase.from('votes').delete().eq('election_id', electionId);
    
    // Delete options
    const { data: questions } = await supabase
      .from('questions')
      .select('id')
      .eq('election_id', electionId);
    
    if (questions && questions.length > 0) {
      const questionIds = questions.map(q => q.id);
      await supabase.from('options').delete().in('question_id', questionIds);
    }
    
    // Delete questions
    await supabase.from('questions').delete().eq('election_id', electionId);
    
    // Delete election likes, comments, shares
    await supabase.from('election_likes').delete().eq('election_id', electionId);
    await supabase.from('election_comments').delete().eq('election_id', electionId);
    await supabase.from('election_shares').delete().eq('election_id', electionId);
    
    // Delete fundraising donations if any
    await supabase.from('election_donations').delete().eq('election_id', electionId);
    
    // Finally, delete the election
    const { error: deleteError } = await supabase
      .from('elections')
      .delete()
      .eq('id', electionId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: 'Анкетата е изтрита успешно',
    });
  } catch (error: any) {
    console.error('Election deletion error:', error);
    return NextResponse.json(
      { error: error.message || 'Грешка при изтриване на анкетата' },
      { status: 500 }
    );
  }
}
