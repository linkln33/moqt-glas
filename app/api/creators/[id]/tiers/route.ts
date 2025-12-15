import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/**
 * Get subscription tiers for a creator
 * GET /api/creators/[id]/tiers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const creatorId = params.id;
    const supabase = createServerClient();

    const { data: tiers, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('creator_telegram_id', parseInt(creatorId))
      .eq('is_active', true)
      .order('tier_level', { ascending: true });

    if (error) {
      console.error('Error fetching tiers:', error);
      return NextResponse.json(
        { error: 'Грешка при зареждане на нивата' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tiers: tiers || [],
    });
  } catch (error) {
    console.error('Error in GET /api/creators/[id]/tiers:', error);
    return NextResponse.json(
      { error: 'Вътрешна грешка' },
      { status: 500 }
    );
  }
}
