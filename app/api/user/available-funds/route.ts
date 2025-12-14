import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const telegramId = searchParams.get('telegramId');

    if (!telegramId) {
      return NextResponse.json(
        { error: 'Необходима е автентификация' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Get total available funds using the function
    const { data: fundsData, error } = await supabase
      .rpc('get_user_available_funds', {
        user_telegram_id: parseInt(telegramId),
      });

    if (error) {
      console.error('Error fetching available funds:', error);
      // Fallback: calculate manually
      const { data: elections } = await supabase
        .from('elections')
        .select('id, fundraising_currency')
        .eq('created_by', telegramId)
        .eq('has_fundraising', true);

      if (!elections || elections.length === 0) {
        return NextResponse.json({
          total: 0,
          currency: 'BGN',
          electionCount: 0,
        });
      }

      const electionIds = elections.map(e => e.id);
      const { data: donations } = await supabase
        .from('election_donations')
        .select('amount, currency')
        .in('election_id', electionIds)
        .eq('payment_status', 'completed');

      const total = donations?.reduce((sum, d) => sum + parseFloat(d.amount), 0) || 0;
      const currency = elections[0]?.fundraising_currency || 'BGN';

      return NextResponse.json({
        total,
        currency,
        electionCount: elections.length,
      });
    }

    return NextResponse.json({
      total: parseFloat(fundsData[0]?.total_available || 0),
      currency: fundsData[0]?.currency || 'BGN',
      electionCount: fundsData[0]?.election_count || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/user/available-funds:', error);
    return NextResponse.json(
      { error: 'Вътрешна грешка' },
      { status: 500 }
    );
  }
}
