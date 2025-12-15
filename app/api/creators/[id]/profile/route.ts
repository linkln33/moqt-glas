import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const telegramIdInt = parseInt(id);
    
    if (isNaN(telegramIdInt)) {
      return NextResponse.json(
        { error: 'Невалиден потребителски идентификатор' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    
    const { data: profile, error } = await supabase
      .from('creator_profiles')
      .select('*')
      .eq('telegram_id', telegramIdInt)
      .maybeSingle();

    if (error) {
      console.error('Error fetching creator profile:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        telegramId: telegramIdInt,
      });
      
      // PGRST116 means no rows found, which is fine - return null
      if (error.code === 'PGRST116') {
        return NextResponse.json({ profile: null });
      }
      
      return NextResponse.json(
        { 
          error: 'Грешка при зареждане на профила',
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: profile || null });
  } catch (error: any) {
    console.error('Error in GET /api/creators/[id]/profile:', error);
    return NextResponse.json(
      { 
        error: 'Вътрешна грешка',
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
