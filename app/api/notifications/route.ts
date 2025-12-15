import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const telegramId = searchParams.get('telegramId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!telegramId) {
      return NextResponse.json(
        { error: 'Необходима е автентификация' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Parse telegramId as bigint (user_id is bigint in database)
    const userId = parseInt(telegramId);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Невалиден потребителски идентификатор' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json(
        { error: 'Грешка при зареждане на известията' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: notifications?.filter(n => !n.is_read).length || 0,
    });
  } catch (error: any) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json(
      { error: 'Грешка при зареждане на известията' },
      { status: 500 }
    );
  }
}
