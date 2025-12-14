import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const electionId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const telegramId = searchParams.get('telegramId');

    if (!telegramId) {
      return NextResponse.json(
        { error: 'Необходима е автентификация' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Check if user has liked this election
    const { data: like } = await supabase
      .from('election_likes')
      .select('id')
      .eq('election_id', electionId)
      .eq('telegram_id', parseInt(telegramId))
      .maybeSingle();

    return NextResponse.json({
      isLiked: !!like,
    });
  } catch (error) {
    console.error('Error in GET /api/elections/[id]/like/check:', error);
    return NextResponse.json(
      { error: 'Вътрешна грешка' },
      { status: 500 }
    );
  }
}
