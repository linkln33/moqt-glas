import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/**
 * Cancel a subscription
 * POST /api/subscriptions/cancel
 * Body: { subscriptionId, subscriberId }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, subscriberId } = body;

    if (!subscriptionId || !subscriberId) {
      return NextResponse.json(
        { error: 'Subscription ID and Subscriber ID are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('subscriber_telegram_id', parseInt(subscriberId))
      .single();

    if (subscriptionError || !subscription) {
      return NextResponse.json(
        { error: 'Абонаментът не е намерен' },
        { status: 404 }
      );
    }

    if (subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'Абонаментът вече не е активен' },
        { status: 400 }
      );
    }

    // TODO: Cancel Stripe subscription
    // For now, mark as cancelled at period end
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('Error cancelling subscription:', updateError);
      return NextResponse.json(
        { error: 'Грешка при отмяна на абонамент' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Абонаментът ще бъде отменен в края на текущия период',
      subscription: {
        ...subscription,
        cancel_at_period_end: true,
        cancelled_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in POST /api/subscriptions/cancel:', error);
    return NextResponse.json(
      { error: 'Вътрешна грешка' },
      { status: 500 }
    );
  }
}
