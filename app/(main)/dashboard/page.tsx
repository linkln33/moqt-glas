import { createServerClient } from '@/lib/supabase/client';
import { FeedItem } from '@/components/feed-item';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { isSchemaCacheError, shouldTreatErrorAsNonFatal } from '@/lib/utils';
import Link from 'next/link';

interface PollWithStats {
  id: string;
  title: string;
  title_bg: string;
  description: string;
  description_bg: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  created_by: string;
  questions: Array<{
    id: string;
    question_text: string;
    question_text_bg: string;
    question_type: string;
    options: Array<{
      id: string;
      option_text: string;
      option_text_bg: string;
    }>;
  }>;
  totalVotes: number;
  isActive: boolean;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  isLiked?: boolean;
  hasFundraising?: boolean;
  fundraisingGoal?: number;
  fundraisingCurrent?: number;
  fundraisingCurrency?: string;
}

async function getFeedPolls(): Promise<PollWithStats[]> {
  // Check if Supabase is configured (not placeholder)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl === 'https://placeholder.supabase.co') {
    return [];
  }

  try {
    const supabase = createServerClient();
    const now = new Date().toISOString();

    // Get recent elections ordered by creation date (most recent first)
    const { data: elections, error } = await supabase
      .from('elections')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      // Handle schema cache errors gracefully during build
      if (isSchemaCacheError(error)) {
        console.warn('⚠️ Schema cache not refreshed yet (PGRST205). Returning empty array. This is normal during build.');
        return [];
      }
      
      console.error('Error fetching elections:', error);
      
      // During build, treat errors as non-fatal
      if (shouldTreatErrorAsNonFatal(error)) {
        return [];
      }
      
      return [];
    }

    if (!elections || elections.length === 0) {
      return [];
    }

    // Get questions, options, and vote counts for each election
    const pollsWithStats = await Promise.all(
      elections.map(async (election) => {
        // Get questions with options
        const { data: questions } = await supabase
          .from('questions')
          .select('*, options(*)')
          .eq('election_id', election.id)
          .order('order_index', { ascending: true });

        // Get total vote count for this election
        const { count: totalVotes } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('election_id', election.id);

        // Get social stats
        const { count: likesCount } = await supabase
          .from('election_likes')
          .select('*', { count: 'exact', head: true })
          .eq('election_id', election.id);

        const { count: commentsCount } = await supabase
          .from('election_comments')
          .select('*', { count: 'exact', head: true })
          .eq('election_id', election.id);

        const { count: sharesCount } = await supabase
          .from('election_shares')
          .select('*', { count: 'exact', head: true })
          .eq('election_id', election.id);

        // Get fundraising stats if enabled
        let fundraisingCurrent = 0;
        if (election.has_fundraising) {
          const { data: fundraisingStats } = await supabase
            .from('election_fundraising_stats')
            .select('total_raised')
            .eq('election_id', election.id)
            .single();
          
          fundraisingCurrent = parseFloat(fundraisingStats?.total_raised || 0);
        }

        // Check if election is currently active
        const isActive = new Date(election.start_date) <= new Date(now) && 
                        new Date(election.end_date) >= new Date(now);

        return {
          ...election,
          questions: questions || [],
          totalVotes: totalVotes || 0,
          isActive,
          likesCount: likesCount || 0,
          commentsCount: commentsCount || 0,
          sharesCount: sharesCount || 0,
          isLiked: false, // Will be set client-side based on user
          hasFundraising: election.has_fundraising || false,
          fundraisingGoal: election.fundraising_goal ? parseFloat(election.fundraising_goal) : undefined,
          fundraisingCurrent,
          fundraisingCurrency: election.fundraising_currency || 'BGN',
        };
      })
    );

    return pollsWithStats;
    } catch (error) {
    console.error('Error fetching feed polls:', error);
    return [];
    }
}

export default async function DashboardPage() {
  const polls = await getFeedPolls();

  return (
    <div className="py-4 lg:py-6">
      {/* Feed Header */}
      <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Лента</h1>
          <p className="text-muted-foreground">
            Най-новите анкети и избори
          </p>
        </div>
        <Link href="/dashboard/create" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto gradient-primary text-white shadow-lg hover:shadow-xl transition-shadow">
            ➕ Създай анкета
          </Button>
        </Link>
      </div>

      {/* Feed Items */}
      {polls.length > 0 ? (
        <div className="space-y-4 lg:space-y-6">
          {polls.map((poll) => (
            <FeedItem key={poll.id} poll={poll} />
          ))}
        </div>
      ) : (
        <GlassCard>
          <GlassCardContent className="py-16 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Няма анкети</h2>
            <p className="text-muted-foreground mb-6">
              Все още няма публикувани анкети. Бъдете първият, който създава!
            </p>
            <Link href="/dashboard/create">
              <Button className="gradient-primary text-white shadow-lg hover:shadow-xl transition-shadow">
                ➕ Създай първата анкета
              </Button>
            </Link>
                </GlassCardContent>
              </GlassCard>
      )}
    </div>
  );
}
