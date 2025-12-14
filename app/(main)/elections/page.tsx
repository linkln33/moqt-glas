import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Избори
        </h1>
        <p className="text-gray-600">
          Изберете избори, в които да участвате
        </p>
      </div>

      {/* Active Elections */}
      {activeElections.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Активни избори
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeElections.map((election) => (
              <ElectionCard key={election.id} election={election} status="active" />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Elections */}
      {upcomingElections.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Предстоящи избори
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingElections.map((election) => (
              <ElectionCard key={election.id} election={election} status="upcoming" />
            ))}
          </div>
        </section>
      )}

      {/* Ended Elections */}
      {endedElections.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Приключили избори
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {endedElections.map((election) => (
              <ElectionCard key={election.id} election={election} status="ended" />
            ))}
          </div>
        </section>
      )}

      {elections.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Няма налични избори</p>
          </CardContent>
        </Card>
      )}
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
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">{election.title_bg || election.title}</CardTitle>
        <CardDescription>
          {election.description_bg || election.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Начало: </span>
            <span>{formatDateBG(startDate)} {formatTimeBG(startDate)}</span>
          </div>
          <div>
            <span className="font-medium">Край: </span>
            <span>{formatDateBG(endDate)} {formatTimeBG(endDate)}</span>
          </div>
          <div>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
              status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : status === 'upcoming'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {status === 'active' ? 'Активни' : status === 'upcoming' ? 'Предстоящи' : 'Приключили'}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        {status === 'active' && (
          <Link href={`/vote/${election.id}`} className="flex-1">
            <Button className="w-full">Гласувай сега</Button>
          </Link>
        )}
        {status === 'ended' && (
          <Link href={`/results/${election.id}`} className="flex-1">
            <Button variant="outline" className="w-full">Виж резултатите</Button>
          </Link>
        )}
        {status === 'upcoming' && (
          <Button variant="outline" className="w-full" disabled>
            Очаква се
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
