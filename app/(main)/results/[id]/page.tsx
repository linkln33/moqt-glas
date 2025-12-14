import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createServerClient } from '@/lib/supabase/client';
import { formatDateBG, formatTimeBG } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Изборите не са намерени</p>
            <Link href="/elections">
              <Button className="mt-4">Назад към изборите</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { election, questions } = results;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {searchParams.voted === 'true' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">
          ✅ Гласът ви е приет успешно!
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">{election.title_bg || election.title}</CardTitle>
          <CardDescription>
            {election.description_bg || election.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Начало: {formatDateBG(election.start_date)} {formatTimeBG(election.start_date)}</p>
            <p>Край: {formatDateBG(election.end_date)} {formatTimeBG(election.end_date)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {questions.map((question) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="text-lg">{question.question_text_bg}</CardTitle>
              <CardDescription>
                Общо гласове: {question.totalVotes}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {question.options
                  .sort((a, b) => b.votes - a.votes)
                  .map((option) => (
                    <div key={option.id} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">{option.option_text_bg}</span>
                        <span className="text-gray-600">
                          {option.votes} гласа ({option.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-primary h-3 rounded-full transition-all"
                          style={{ width: `${option.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Link href="/elections">
          <Button variant="outline" className="w-full sm:w-auto">
            Назад към изборите
          </Button>
        </Link>
      </div>
    </div>
  );
}
