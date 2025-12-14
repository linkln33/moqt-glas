import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const electionId = params.id;
    const supabase = createServerClient();

    // Get election fundraising info
    const { data: election, error: electionError } = await supabase
      .from('elections')
      .select('has_fundraising, fundraising_goal, fundraising_currency')
      .eq('id', electionId)
      .single();

    if (electionError || !election) {
      return NextResponse.json(
        { error: 'Анкетата не е намерена' },
        { status: 404 }
      );
    }

    if (!election.has_fundraising) {
      return NextResponse.json({
        hasFundraising: false,
        totalRaised: 0,
        goal: 0,
      });
    }

    // Get fundraising stats
    const { data: stats } = await supabase
      .from('election_fundraising_stats')
      .select('total_raised, total_donations')
      .eq('election_id', electionId)
      .single();

    return NextResponse.json({
      hasFundraising: true,
      totalRaised: parseFloat(stats?.total_raised || 0),
      goal: parseFloat(election.fundraising_goal || 0),
      currency: election.fundraising_currency || 'BGN',
      totalDonations: stats?.total_donations || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/elections/[id]/fundraising:', error);
    return NextResponse.json(
      { error: 'Вътрешна грешка' },
      { status: 500 }
    );
  }
}
