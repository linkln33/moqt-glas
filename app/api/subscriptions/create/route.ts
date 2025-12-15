import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/**
 * Create a new subscription
 * POST /api/subscriptions/create
 * Body: { subscriberId, creatorId, tierId }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriberId, creatorId, tierId } = body;

    if (!subscriberId || !creatorId || !tierId) {
      return NextResponse.json(
        { error: 'Subscriber ID, Creator ID, and Tier ID are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get tier details
    const { data: tier, error: tierError } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('id', tierId)
      .single();

    if (tierError || !tier) {
      return NextResponse.json(
        { error: 'Tier not found' },
        { status: 404 }
      );
    }

    // Check if user already has active subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('subscriber_telegram_id', parseInt(subscriberId))
      .eq('creator_telegram_id', parseInt(creatorId))
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'Вече имате активен абонамент за този създател' },
        { status: 400 }
      );
    }

    // Calculate period dates
    const now = new Date();
    const periodEnd = new Date(now);
    if (tier.billing_period === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    // TODO: Integrate with Stripe here
    // For now, create subscription record (will be updated when Stripe payment succeeds)
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        subscriber_telegram_id: parseInt(subscriberId),
        creator_telegram_id: parseInt(creatorId),
        tier_id: tierId,
        status: 'active', // Will be updated by Stripe webhook
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        // stripe_subscription_id: stripeSubscription.id, // Add when Stripe is integrated
      })
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
      .single();

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError);
      return NextResponse.json(
        { error: 'Грешка при създаване на абонамент' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription,
      message: 'Абонаментът е създаден успешно',
    });
  } catch (error) {
    console.error('Error in POST /api/subscriptions/create:', error);
    return NextResponse.json(
      { error: 'Вътрешна грешка' },
      { status: 500 }
    );
  }
}
