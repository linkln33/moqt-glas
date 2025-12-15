import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: electionId } = await params;
    const supabase = createServerClient();

    // Get telegram ID from request body
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Невалиден формат на заявката' },
        { status: 400 }
      );
    }
    
    const telegramId = body.telegramId;

    if (!telegramId) {
      return NextResponse.json(
        { error: 'Необходима е автентификация' },
        { status: 401 }
      );
    }

    // Parse telegramId to ensure it's a number
    const telegramIdInt = typeof telegramId === 'string' ? parseInt(telegramId) : telegramId;
    if (isNaN(telegramIdInt)) {
      return NextResponse.json(
        { error: 'Невалиден потребителски идентификатор' },
        { status: 400 }
      );
    }

    // Check if already liked
    const { data: existingLike, error: checkError } = await supabase
      .from('election_likes')
      .select('id')
      .eq('election_id', electionId)
      .eq('telegram_id', telegramIdInt)
      .maybeSingle();

    if (checkError) {
      // If table doesn't exist, return error gracefully
      if (checkError.code === '42P01' || checkError.code === '42883') {
        console.warn('Election likes table may not exist');
        return NextResponse.json(
          { error: 'Функционалността за харесване не е налична', details: 'Таблицата не съществува' },
          { status: 503 }
        );
      }
      console.error('Error checking like:', checkError);
      return NextResponse.json(
        { error: 'Грешка при проверка на харесване' },
        { status: 500 }
      );
    }

    if (existingLike) {
      return NextResponse.json(
        { error: 'Вече сте харесали тази анкета' },
        { status: 409 }
      );
    }

    // Create like
    const { error: likeError } = await supabase
      .from('election_likes')
      .insert({
        election_id: electionId,
        telegram_id: telegramIdInt,
      });

    if (likeError) {
      console.error('Error creating like:', likeError);
      // If table doesn't exist, return error gracefully
      if (likeError.code === '42P01' || likeError.code === '42883') {
        return NextResponse.json(
          { error: 'Функционалността за харесване не е налична', details: 'Таблицата не съществува' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: 'Грешка при харесване' },
        { status: 500 }
      );
    }

    // Get updated count
    const { count: likesCount } = await supabase
      .from('election_likes')
      .select('*', { count: 'exact', head: true })
      .eq('election_id', electionId);

    return NextResponse.json({
      success: true,
      likesCount: likesCount || 0,
    });
  } catch (error) {
    console.error('Error in POST /api/elections/[id]/like:', error);
    return NextResponse.json(
      { error: 'Вътрешна грешка' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: electionId } = await params;
    const supabase = createServerClient();

    // Get telegram ID from request body
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Невалиден формат на заявката' },
        { status: 400 }
      );
    }
    
    const telegramId = body.telegramId;

    if (!telegramId) {
      return NextResponse.json(
        { error: 'Необходима е автентификация' },
        { status: 401 }
      );
    }

    // Parse telegramId to ensure it's a number
    const telegramIdInt = typeof telegramId === 'string' ? parseInt(telegramId) : telegramId;
    if (isNaN(telegramIdInt)) {
      return NextResponse.json(
        { error: 'Невалиден потребителски идентификатор' },
        { status: 400 }
      );
    }

    // Delete like
    const { error: deleteError } = await supabase
      .from('election_likes')
      .delete()
      .eq('election_id', electionId)
      .eq('telegram_id', telegramIdInt);

    if (deleteError) {
      console.error('Error deleting like:', deleteError);
      // If table doesn't exist, return error gracefully
      if (deleteError.code === '42P01' || deleteError.code === '42883') {
        return NextResponse.json(
          { error: 'Функционалността за харесване не е налична', details: 'Таблицата не съществува' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: 'Грешка при премахване на харесване' },
        { status: 500 }
      );
    }

    // Get updated count
    const { count: likesCount } = await supabase
      .from('election_likes')
      .select('*', { count: 'exact', head: true })
      .eq('election_id', electionId);

    return NextResponse.json({
      success: true,
      likesCount: likesCount || 0,
    });
  } catch (error) {
    console.error('Error in DELETE /api/elections/[id]/like:', error);
    return NextResponse.json(
      { error: 'Вътрешна грешка' },
      { status: 500 }
    );
  }
}
