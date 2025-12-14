import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

async function getTelegramId(request: NextRequest): Promise<number | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const authData = JSON.parse(Buffer.from(token, 'base64').toString());
      return authData.telegramId ? parseInt(authData.telegramId) : null;
    }
    
    // Fallback: try to get from cookie or body
    const body = await request.json().catch(() => ({}));
    return body.telegramId ? parseInt(body.telegramId) : null;
  } catch {
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const electionId = params.id;
    const supabase = createServerClient();

    // Get telegram ID from request (in production, use proper auth)
    // For now, we'll get it from the request body
    const body = await request.json().catch(() => ({}));
    const telegramId = body.telegramId;

    if (!telegramId) {
      return NextResponse.json(
        { error: 'Необходима е автентификация' },
        { status: 401 }
      );
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('election_likes')
      .select('id')
      .eq('election_id', electionId)
      .eq('telegram_id', telegramId)
      .maybeSingle();

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
        telegram_id: telegramId,
      });

    if (likeError) {
      console.error('Error creating like:', likeError);
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
  { params }: { params: { id: string } }
) {
  try {
    const electionId = params.id;
    const supabase = createServerClient();

    // Get telegram ID from request
    const body = await request.json().catch(() => ({}));
    const telegramId = body.telegramId;

    if (!telegramId) {
      return NextResponse.json(
        { error: 'Необходима е автентификация' },
        { status: 401 }
      );
    }

    // Delete like
    const { error: deleteError } = await supabase
      .from('election_likes')
      .delete()
      .eq('election_id', electionId)
      .eq('telegram_id', telegramId);

    if (deleteError) {
      console.error('Error deleting like:', deleteError);
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
