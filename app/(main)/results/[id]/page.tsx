import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createServerClient } from '@/lib/supabase/client';
import { formatDateBG, formatTimeBG } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

async function getElectionResults(electionId: string) {
  try {
    const supabase = createServerClient();

    // Get election
    const { data: election } = await supabase
      .from('elections')
      .select('*')
      .eq('id', electionId)
      .single();

    if (!election) {
      return null;
    }

  // Get questions with options
  const { data: questions } = await supabase
    .from('questions')
    .select('*, options(*)')
    .eq('election_id', electionId)
    .order('order_index', { ascending: true });

  // Get vote counts for each option
  const questionsWithResults = await Promise.all(
    (questions || []).map(async (question) => {
      const { data: votes } = await supabase
        .from('votes')
        .select('selected_options')
        .eq('election_id', electionId)
        .eq('question_id', question.id);

      // Count votes per option
      const optionCounts: Record<string, number> = {};
      const totalVotes = votes?.length || 0;

      (question.options || []).forEach((option: any) => {
        optionCounts[option.id] = 0;
      });

      votes?.forEach((vote) => {
        const selected = Array.isArray(vote.selected_options)
          ? vote.selected_options
          : [];
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

      return {
        ...question,
        options: optionsWithResults,
        totalVotes,
      };
    })
  );

    return {
      election,
      questions: questionsWithResults,
    };
  } catch (error) {
    console.error('Error fetching election results:', error);
    return null;
  }
}

export default async function ResultsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { voted?: string };
}) {
  const results = await getElectionResults(params.id);

  if (!results) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <GlassCard>
            <GlassCardContent className="py-16 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-xl text-muted-foreground mb-6">Изборите не са намерени</p>
              <Link href="/elections">
                <Button className="gradient-primary">Назад към изборите</Button>
              </Link>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    );
  }

  const { election, questions } = results;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {searchParams.voted === 'true' && (
          <GlassCard className="mb-6 border-green-500/50 bg-green-500/10">
            <GlassCardContent className="p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <span className="text-green-400 font-semibold">Гласът ви е приет успешно!</span>
              </div>
            </GlassCardContent>
          </GlassCard>
        )}

        <GlassCard variant="gradient" className="mb-6 shine">
          <GlassCardHeader>
            <GlassCardTitle className="text-3xl text-white">
              {election.title_bg || election.title}
            </GlassCardTitle>
            <GlassCardDescription className="text-white/80">
              {election.description_bg || election.description}
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="flex flex-wrap gap-4 text-sm text-white/90">
              <div className="flex items-center gap-2">
                <span>📅 Начало:</span>
                <span className="font-medium">{formatDateBG(election.start_date)} {formatTimeBG(election.start_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🏁 Край:</span>
                <span className="font-medium">{formatDateBG(election.end_date)} {formatTimeBG(election.end_date)}</span>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        <div className="space-y-6">
          {questions.map((question, qIndex) => (
            <GlassCard key={question.id} hover>
              <GlassCardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <GlassCardTitle className="text-xl mb-2">
                      {questions.length > 1 && (
                        <Badge variant="info" className="mr-2">
                          Въпрос {qIndex + 1}
                        </Badge>
                      )}
                      {question.question_text_bg}
                    </GlassCardTitle>
                    <GlassCardDescription>
                      <Badge variant="secondary" className="mt-2">
                        Общо гласове: {question.totalVotes}
                      </Badge>
                    </GlassCardDescription>
                  </div>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-4">
                  {question.options
                    .sort((a, b) => b.votes - a.votes)
                    .map((option, index) => (
                      <div key={option.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            {index === 0 && question.totalVotes > 0 && (
                              <span className="text-2xl">🏆</span>
                            )}
                            <span className="font-semibold text-lg">{option.option_text_bg}</span>
                          </div>
                          <Badge variant={index === 0 && question.totalVotes > 0 ? 'success' : 'secondary'} className="text-base px-3 py-1">
                            {option.votes} гласа ({option.percentage.toFixed(1)}%)
                          </Badge>
                        </div>
                        <div className="w-full bg-background/50 rounded-full h-4 overflow-hidden">
                          <div
                            className="gradient-primary h-4 rounded-full transition-all duration-500 shadow-lg"
                            style={{ width: `${option.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </GlassCardContent>
            </GlassCard>
          ))}
        </div>

        <div className="mt-8 flex gap-4">
          <Link href="/elections" className="flex-1">
            <Button variant="outline" className="w-full glass">
              ← Назад към изборите
            </Button>
          </Link>
          <Link href="/dashboard" className="flex-1">
            <Button className="w-full gradient-primary text-white shadow-lg">
              📊 Към таблото
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
