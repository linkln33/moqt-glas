import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    
    const { data: profile, error } = await supabase
      .from('creator_profiles')
      .select('*')
      .eq('telegram_id', parseInt(params.id))
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found
        return NextResponse.json({ profile: null });
      }
      console.error('Error fetching creator profile:', error);
      return NextResponse.json(
        { error: 'Грешка при зареждане на профила' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error in GET /api/creators/[id]/profile:', error);
    return NextResponse.json(
      { error: 'Вътрешна грешка' },
      { status: 500 }
    );
  }
}
