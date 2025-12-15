import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const electionId = params.id;
    const supabase = createServerClient();

    const body = await request.json();
    const { 
      telegramId, 
      amount, 
      currency = 'BGN',
      donorName,
      donorMessage,
      isAnonymous = false,
      paymentMethod = 'card',
    } = body;

    if (!telegramId) {
      return NextResponse.json(
        { error: 'Необходима е автентификация' },
        { status: 401 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Невалидна сума за дарение' },
        { status: 400 }
      );
    }

    // Verify election exists and has fundraising enabled
    const { data: election, error: electionError } = await supabase
      .from('elections')
      .select('id, has_fundraising, fundraising_goal')
      .eq('id', electionId)
      .single();

    if (electionError || !election) {
      return NextResponse.json(
        { error: 'Анкетата не е намерена' },
        { status: 404 }
      );
    }

    if (!election.has_fundraising) {
      return NextResponse.json(
        { error: 'Тази анкета няма активирано събиране на средства' },
        { status: 400 }
      );
    }

    // Create donation record (status: pending - will be updated when payment is processed)
    const { data: donation, error: donationError } = await supabase
      .from('election_donations')
      .insert({
        election_id: electionId,
        telegram_id: parseInt(telegramId),
        amount: parseFloat(amount),
        currency,
        donor_name: isAnonymous ? null : (donorName || null),
        donor_message: donorMessage || null,
        is_anonymous: isAnonymous,
        payment_status: paymentMethod === 'card' ? 'pending' : 'pending',
        payment_method: paymentMethod,
      })
      .select()
      .single();

    if (donationError) {
      console.error('Error creating donation:', donationError);
      return NextResponse.json(
        { error: 'Грешка при създаване на дарението' },
        { status: 500 }
      );
    }

    // TODO: Integrate with payment providers.
    // For card payments, simulate success until Stripe is wired.
    if (paymentMethod === 'card') {
      const { error: updateError } = await supabase
        .from('election_donations')
        .update({ 
          payment_status: 'completed',
          payment_provider: 'local',
          payment_provider_transaction_id: `sim_${donation.id}`,
        })
        .eq('id', donation.id);

      if (updateError) {
        console.error('Error updating donation status:', updateError);
      }
    }

    // Get updated fundraising stats
    const { data: stats } = await supabase
      .from('election_fundraising_stats')
      .select('total_raised')
      .eq('election_id', electionId)
      .single();

    return NextResponse.json({
      success: true,
      donation: {
        id: donation.id,
        amount: donation.amount,
        currency: donation.currency,
        paymentMethod,
        paymentStatus: paymentMethod === 'card' ? 'completed' : 'pending',
      },
      totalRaised: stats?.total_raised || 0,
      message: paymentMethod === 'card'
        ? 'Дарението е успешно обработено!'
        : 'Заявката за USDC е записана. Ще получите инструкции за плащане.',
    });
  } catch (error) {
    console.error('Error in POST /api/elections/[id]/donate:', error);
    return NextResponse.json(
      { error: 'Вътрешна грешка' },
      { status: 500 }
    );
  }
}
