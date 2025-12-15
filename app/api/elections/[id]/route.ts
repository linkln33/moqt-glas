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
