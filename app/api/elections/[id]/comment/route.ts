import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const electionId = params.id;
    const supabase = createServerClient();

    const body = await request.json();
    const { commentText, telegramId } = body;

    if (!commentText || !commentText.trim()) {
      return NextResponse.json(
        { error: 'Коментарът не може да бъде празен' },
        { status: 400 }
      );
    }

    if (!telegramId) {
      return NextResponse.json(
        { error: 'Необходима е автентификация' },
        { status: 401 }
      );
    }

    // Create comment
    const { data: comment, error: commentError } = await supabase
      .from('election_comments')
      .insert({
        election_id: electionId,
        telegram_id: telegramId,
        comment_text: commentText.trim(),
      })
      .select()
      .single();

    if (commentError) {
      console.error('Error creating comment:', commentError);
      return NextResponse.json(
        { error: 'Грешка при публикуване на коментар' },
        { status: 500 }
      );
    }

    // Get updated count
    const { count: commentsCount } = await supabase
      .from('election_comments')
      .select('*', { count: 'exact', head: true })
      .eq('election_id', electionId);

    return NextResponse.json({
      success: true,
      comment,
      commentsCount: commentsCount || 0,
    });
  } catch (error) {
    console.error('Error in POST /api/elections/[id]/comment:', error);
    return NextResponse.json(
      { error: 'Вътрешна грешка' },
      { status: 500 }
    );
  }
}
