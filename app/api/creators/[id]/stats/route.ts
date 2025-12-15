import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const telegramId = parseInt(params.id);

    // Get video count
    const { count: videoCount } = await supabase
      .from('creator_videos')
      .select('*', { count: 'exact', head: true })
      .eq('creator_telegram_id', telegramId);

    // Get subscriber count
    const { count: subscriberCount } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('creator_telegram_id', telegramId)
      .eq('status', 'active');

    // Get total revenue (from subscription payments)
    const { data: subscriptionIds } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('creator_telegram_id', telegramId)
      .eq('status', 'active');

    const subscriptionIdList = subscriptionIds?.map((s) => s.id) || [];

    let paymentsData: { amount: number }[] = [];

    if (subscriptionIdList.length > 0) {
      const { data: payments } = await supabase
        .from('subscription_payments')
        .select('amount')
        .in('subscription_id', subscriptionIdList)
        .eq('status', 'succeeded');

      paymentsData = payments || [];
    }

    const totalRevenue =
      paymentsData.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

    return NextResponse.json({
      videoCount: videoCount || 0,
      subscriberCount: subscriberCount || 0,
      totalRevenue,
    });
  } catch (error) {
    console.error('Error in GET /api/creators/[id]/stats:', error);
    return NextResponse.json(
      { error: 'Вътрешна грешка' },
      { status: 500 }
    );
  }
}
