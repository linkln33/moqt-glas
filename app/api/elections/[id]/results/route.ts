import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();

    // Get election
    const { data: election } = await supabase
      .from('elections')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!election) {
      return NextResponse.json(
        { error: 'Изборите не са намерени' },
        { status: 404 }
      );
    }

    // Get questions with options
    const { data: questions } = await supabase
      .from('questions')
      .select('*, options(*)')
      .eq('election_id', params.id)
      .order('order_index', { ascending: true });

    // Get vote counts for each option
    const questionsWithResults = await Promise.all(
      (questions || []).map(async (question) => {
        const { data: votes, error: votesError } = await supabase
          .from('votes')
          .select('selected_options')
          .eq('election_id', params.id)
          .eq('question_id', question.id);

        if (votesError) {
          console.error('Error fetching votes for question:', question.id, votesError);
        }

        // Count votes per option
        const optionCounts: Record<string, number> = {};
        const totalVotes = votes?.length || 0;

        // Initialize all options with 0 votes
        (question.options || []).forEach((option: any) => {
          optionCounts[option.id] = 0;
        });

        // Count votes for each option
        votes?.forEach((vote) => {
          let selected: string[] = [];
          
          // Handle different formats of selected_options
          if (Array.isArray(vote.selected_options)) {
            selected = vote.selected_options;
          } else if (typeof vote.selected_options === 'string') {
            try {
              selected = JSON.parse(vote.selected_options);
            } catch {
              selected = [vote.selected_options];
            }
          }
          
          selected.forEach((optionId: string) => {
            if (optionCounts[optionId] !== undefined) {
              optionCounts[optionId]++;
            }
          });
        });

        // Calculate percentages
        const optionsWithResults = (question.options || []).map((option: any) => ({
          ...option,
          votes: optionCounts[option.id] || 0,
          percentage: totalVotes > 0 
            ? ((optionCounts[option.id] || 0) / totalVotes) * 100 
            : 0,
        }));

        console.log('Question results:', {
          questionId: question.id,
          totalVotes,
          optionCounts,
          optionsWithResults: optionsWithResults.map(o => ({ id: o.id, votes: o.votes, percentage: o.percentage })),
        });

        return {
          ...question,
          options: optionsWithResults,
          totalVotes,
        };
      })
    );

    return NextResponse.json({
      election,
      questions: questionsWithResults,
    });
  } catch (error: any) {
    console.error('Error fetching election results:', error);
    return NextResponse.json(
      { error: 'Грешка при зареждане на резултатите' },
      { status: 500 }
    );
  }
}
