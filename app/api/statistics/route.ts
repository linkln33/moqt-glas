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

    // Get election status distribution
    const { data: allElections } = await supabase
      .from('elections')
      .select('status, start_date, end_date');

    const statusDistribution = {
      active: 0,
      upcoming: 0,
      ended: 0,
    };

    (allElections || []).forEach((election) => {
      const start = new Date(election.start_date);
      const end = new Date(election.end_date);
      const currentDate = new Date(now);

      if (currentDate >= start && currentDate <= end) {
        statusDistribution.active++;
      } else if (currentDate < start) {
        statusDistribution.upcoming++;
      } else {
        statusDistribution.ended++;
      }
    });

    // Get total votes
    const { count: totalVotes } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true });

    // Get total users
    const { count: totalUsers } = await supabase
      .from('voters')
      .select('*', { count: 'exact', head: true });

    // Get elections with fundraising
    const { data: fundraisingElections } = await supabase
      .from('elections')
      .select('id, has_fundraising')
      .eq('has_fundraising', true);

    const fundraisingCount = fundraisingElections?.length || 0;
    const nonFundraisingCount = (totalElections || 0) - fundraisingCount;

    // Get fundraising stats if available
    let fundraisingStats = null;
    if (fundraisingCount > 0 && fundraisingElections) {
      try {
        const fundraisingIds = fundraisingElections.map(e => e.id);
        const { data: fundraisingData, error: fundraisingError } = await supabase
          .from('election_fundraising_stats')
          .select('total_raised, election_id')
          .in('election_id', fundraisingIds);

        // If view doesn't exist yet, calculate manually
        if (fundraisingError && fundraisingError.code === '42P01') {
          // View doesn't exist, calculate from donations table
          const { data: donationsData } = await supabase
            .from('election_donations')
            .select('amount, election_id')
            .in('election_id', fundraisingIds)
            .eq('payment_status', 'completed');

          const totalRaised = donationsData?.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0) || 0;
          const electionRaisedMap = new Map<string, number>();
          
          donationsData?.forEach((donation) => {
            const current = electionRaisedMap.get(donation.election_id) || 0;
            electionRaisedMap.set(donation.election_id, current + parseFloat(donation.amount || 0));
          });

          const successfulCampaigns = Array.from(electionRaisedMap.values()).filter(amount => amount > 0).length;
          const pendingCampaigns = fundraisingCount - successfulCampaigns;

          fundraisingStats = {
            totalRaised,
            successfulCampaigns,
            pendingCampaigns,
          };
        } else if (fundraisingData) {
          const totalRaised = fundraisingData.reduce((sum, item) => sum + parseFloat(item.total_raised || 0), 0);
          const successfulCampaigns = fundraisingData.filter(item => parseFloat(item.total_raised || 0) > 0).length;
          const pendingCampaigns = fundraisingCount - successfulCampaigns;

          fundraisingStats = {
            totalRaised,
            successfulCampaigns,
            pendingCampaigns,
          };
        }
      } catch (error) {
        console.error('Error fetching fundraising stats:', error);
        // Continue without fundraising stats
      }
    }

    // Get vote distribution by election (top 5)
    const { data: allElectionsForVotes } = await supabase
      .from('elections')
      .select('id, title_bg')
      .limit(10);

    const voteDistribution = await Promise.all(
      (allElectionsForVotes || []).map(async (election) => {
        const { count } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('election_id', election.id);

        return {
          name: election.title_bg || 'Без заглавие',
          value: count || 0,
          id: election.id,
        };
      })
    );

    voteDistribution.sort((a, b) => b.value - a.value);
    const top5Votes = voteDistribution.slice(0, 5);
    const otherVotes = voteDistribution.slice(5).reduce((sum, item) => sum + item.value, 0);
    
    if (otherVotes > 0) {
      top5Votes.push({
        name: 'Други',
        value: otherVotes,
        id: 'other',
      });
    }

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

    // Get votes over time (last 7 days) - for pie chart
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: votesOverTimeData } = await supabase
      .from('votes')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    const votesOverTimeLine: Array<{ name: string; value: number }> = [];
    const votesOverTimePie: Array<{ name: string; value: number }> = [];
    const votesByDate: Record<string, number> = {};
    
    (votesOverTimeData || []).forEach((vote) => {
      const date = new Date(vote.created_at).toLocaleDateString('bg-BG', { 
        day: '2-digit', 
        month: '2-digit' 
      });
      votesByDate[date] = (votesByDate[date] || 0) + 1;
    });

    Object.entries(votesByDate).forEach(([date, count]) => {
      votesOverTimeLine.push({ name: date, value: count });
      votesOverTimePie.push({ name: date, value: count });
    });

    // Get elections over time (last 7 days) - for pie chart
    const { data: electionsOverTimeData } = await supabase
      .from('elections')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    const electionsOverTimeLine: Array<{ name: string; value: number }> = [];
    const electionsOverTimePie: Array<{ name: string; value: number }> = [];
    const electionsByDate: Record<string, number> = {};
    
    (electionsOverTimeData || []).forEach((election) => {
      const date = new Date(election.created_at).toLocaleDateString('bg-BG', { 
        day: '2-digit', 
        month: '2-digit' 
      });
      electionsByDate[date] = (electionsByDate[date] || 0) + 1;
    });

    Object.entries(electionsByDate).forEach(([date, count]) => {
      electionsOverTimeLine.push({ name: date, value: count });
      electionsOverTimePie.push({ name: date, value: count });
    });

    return NextResponse.json({
      totalElections: totalElections || 0,
      activeElections: activeElections || 0,
      totalVotes: totalVotes || 0,
      totalUsers: totalUsers || 0,
      popularElections: popularElections.slice(0, 5),
      recentElections: [],
      statusDistribution,
      fundraisingDistribution: {
        withFundraising: fundraisingCount,
        withoutFundraising: nonFundraisingCount,
      },
      voteDistribution: top5Votes,
      fundraisingStats,
      votesOverTime: votesOverTimeLine.length > 0 ? votesOverTimeLine : undefined,
      electionsOverTime: electionsOverTimeLine.length > 0 ? electionsOverTimeLine : undefined,
      votesOverTimePie: votesOverTimePie.length > 0 ? votesOverTimePie : undefined,
      electionsOverTimePie: electionsOverTimePie.length > 0 ? electionsOverTimePie : undefined,
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
