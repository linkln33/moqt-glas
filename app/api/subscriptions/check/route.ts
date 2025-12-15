import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/**
 * Check if user has active subscription to a creator
 * GET /api/subscriptions/check?creatorId=123&subscriberId=456
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const creatorId = searchParams.get('creatorId');
    const subscriberId = searchParams.get('subscriberId');

    if (!creatorId || !subscriberId) {
      return NextResponse.json(
        { error: 'Creator ID and Subscriber ID are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get active subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_tiers (
          id,
          name,
          name_bg,
          tier_level,
          price,
          currency
        )
      `)
      .eq('subscriber_telegram_id', parseInt(subscriberId))
      .eq('creator_telegram_id', parseInt(creatorId))
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      console.error('Error checking subscription:', error);
      return NextResponse.json(
        { error: 'Грешка при проверка на абонамента' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      hasSubscription: !!subscription,
      subscription: subscription || null,
      tierLevel: subscription?.subscription_tiers?.tier_level || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/subscriptions/check:', error);
    return NextResponse.json(
      { error: 'Вътрешна грешка' },
      { status: 500 }
    );
  }
}
