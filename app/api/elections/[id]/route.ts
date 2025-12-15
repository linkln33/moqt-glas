import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { isSchemaCacheError, shouldTreatErrorAsNonFatal } from '@/lib/utils';

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
