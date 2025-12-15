import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function PUT(request: NextRequest) {
  try {
    const { telegramId } = await request.json();

    if (!telegramId) {
      return NextResponse.json(
        { error: 'Необходима е автентификация' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', telegramId)
      .eq('is_read', false);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Грешка при обновяване на известията' },
      { status: 500 }
    );
  }
}
