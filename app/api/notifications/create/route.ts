import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

// Create a notification (called when new poll is created)
export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      type,
      title,
      message,
      messageBg,
      relatedId,
      relatedType,
    } = await request.json();

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Липсват задължителни полета' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        message_bg: messageBg || message,
        related_id: relatedId || null,
        related_type: relatedType || null,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error: any) {
    console.error('Notification creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Грешка при създаване на известие' },
      { status: 500 }
    );
  }
}
