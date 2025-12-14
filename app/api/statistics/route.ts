import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = createServerClient();

    // Get total elections
    const { count: totalElections } = await supabase
      .from('elections')
      .select('*', { count: 'exact', head: true });

    // Get active elections
    const now = new Date().toISOString();
    const { count: activeElections } = await supabase
      .from('elections')
      .select('*', { count: 'exact', head: true })
      .lte('start_date', now)
      .gte('end_date', now)
      .eq('status', 'active');

    // Get total votes
    const { count: totalVotes } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true });

    // Get total users
    const { count: totalUsers } = await supabase
      .from('voters')
      .select('*', { count: 'exact', head: true });

    // Get popular elections (by vote count)
    const { data: elections } = await supabase
      .from('elections')
      .select('id, title_bg, status')
      .limit(5);

    const popularElections = await Promise.all(
      (elections || []).map(async (election) => {
        const { count } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('election_id', election.id);

        return {
          ...election,
          vote_count: count || 0,
        };
      })
    );

    popularElections.sort((a, b) => b.vote_count - a.vote_count);

    return NextResponse.json({
      totalElections: totalElections || 0,
      activeElections: activeElections || 0,
      totalVotes: totalVotes || 0,
      totalUsers: totalUsers || 0,
      popularElections: popularElections.slice(0, 5),
      recentElections: [],
    });
  } catch (error: any) {
    console.error('Statistics error:', error);
    return NextResponse.json(
      {
        totalElections: 0,
        activeElections: 0,
        totalVotes: 0,
        totalUsers: 0,
        popularElections: [],
        recentElections: [],
      },
      { status: 200 } // Return empty stats instead of error
    );
  }
}
