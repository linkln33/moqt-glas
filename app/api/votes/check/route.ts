import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const electionId = searchParams.get('electionId');
    const questionId = searchParams.get('questionId');
    const telegramId = searchParams.get('telegramId');

    if (!electionId || !telegramId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if user has voted for this election/question
    const query = supabase
      .from('votes')
      .select('id')
      .eq('election_id', electionId)
      .eq('telegram_id', parseInt(telegramId));

    if (questionId) {
      query.eq('question_id', questionId);
    }

    const { data, error } = await query.maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking vote:', error);
      return NextResponse.json(
        { error: 'Грешка при проверка на гласа' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      hasVoted: !!data,
    });
  } catch (error: any) {
    console.error('Error in GET /api/votes/check:', error);
    return NextResponse.json(
      { error: 'Вътрешна грешка' },
      { status: 500 }
    );
  }
}
