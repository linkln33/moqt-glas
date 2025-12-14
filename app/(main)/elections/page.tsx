import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardFooter, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createServerClient } from '@/lib/supabase/client';
import { formatDateBG, formatTimeBG, isElectionActive, hasElectionEnded } from '@/lib/utils';

async function getElections() {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('elections')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching elections:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error initializing Supabase:', error);
    // Return empty array if Supabase is not configured
    return [];
  }
}

export default async function ElectionsPage() {
  const elections = await getElections();

  const activeElections = elections.filter(e => 
    isElectionActive(e.start_date, e.end_date)
  );
  
  const upcomingElections = elections.filter(e => 
    !hasElectionEnded(e.end_date) && !isElectionActive(e.start_date, e.end_date)
  );
  
  const endedElections = elections.filter(e => 
    hasElectionEnded(e.end_date)
  );

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Избори и анкети
          </h1>
          <p className="text-lg text-muted-foreground">
            Изберете избори, в които да участвате
          </p>
        </div>

        {/* Active Elections */}
        {activeElections.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">Активни избори</h2>
                <p className="text-muted-foreground">Гласувайте сега</p>
              </div>
              <Badge variant="success" className="text-lg px-4 py-2">
                {activeElections.length} активни
              </Badge>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeElections.map((election) => (
                <ElectionCard key={election.id} election={election} status="active" />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Elections */}
        {upcomingElections.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Предстоящи избори</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingElections.map((election) => (
                <ElectionCard key={election.id} election={election} status="upcoming" />
              ))}
            </div>
          </section>
        )}

        {/* Ended Elections */}
        {endedElections.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Приключили избори</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {endedElections.map((election) => (
                <ElectionCard key={election.id} election={election} status="ended" />
              ))}
            </div>
          </section>
        )}

        {elections.length === 0 && (
          <GlassCard>
            <GlassCardContent className="py-16 text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-xl text-muted-foreground mb-4">Няма налични избори</p>
              <Link href="/dashboard/create">
                <Button className="gradient-primary">Създай първата анкета</Button>
              </Link>
            </GlassCardContent>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

function ElectionCard({ 
  election, 
  status 
}: { 
  election: any; 
  status: 'active' | 'upcoming' | 'ended' 
}) {
  const startDate = new Date(election.start_date);
  const endDate = new Date(election.end_date);

  return (
    <GlassCard hover className="flex flex-col cursor-pointer group">
      <GlassCardHeader>
        <div className="flex items-start justify-between gap-4">
          <GlassCardTitle className="text-xl group-hover:text-primary transition-colors">
            {election.title_bg || election.title}
          </GlassCardTitle>
          <Badge 
            variant={
              status === 'active' ? 'success' : 
              status === 'upcoming' ? 'info' : 
              'secondary'
            }
          >
            {status === 'active' ? 'Активни' : status === 'upcoming' ? 'Предстоящи' : 'Приключили'}
          </Badge>
        </div>
        <GlassCardDescription className="line-clamp-2">
          {election.description_bg || election.description}
        </GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent className="flex-grow">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">📅 Начало:</span>
            <span>{formatDateBG(startDate)} {formatTimeBG(startDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">🏁 Край:</span>
            <span>{formatDateBG(endDate)} {formatTimeBG(endDate)}</span>
          </div>
        </div>
      </GlassCardContent>
      <GlassCardFooter className="gap-2">
        {status === 'active' && (
          <Link href={`/vote/${election.id}`} className="flex-1">
            <Button className="w-full gradient-primary text-white shadow-lg">
              Гласувай сега →
            </Button>
          </Link>
        )}
        {status === 'ended' && (
          <Link href={`/results/${election.id}`} className="flex-1">
            <Button variant="outline" className="w-full glass">
              Виж резултатите
            </Button>
          </Link>
        )}
        {status === 'upcoming' && (
          <Button variant="outline" className="w-full" disabled>
            Очаква се
          </Button>
        )}
      </GlassCardFooter>
    </GlassCard>
  );
}
