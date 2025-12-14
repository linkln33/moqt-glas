'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardFooter, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/status-badge';
import { formatDateBG, formatTimeBG, isElectionActive, hasElectionEnded } from '@/lib/utils';

interface ElectionsClientPageProps {
  elections: any[];
}

export function ElectionsClientPage({ elections: initialElections }: ElectionsClientPageProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'ended'>('all');

  const filteredElections = initialElections.filter(election => {
    const startDate = new Date(election.start_date);
    const endDate = new Date(election.end_date);
    
    if (filter === 'active') return isElectionActive(startDate, endDate);
    if (filter === 'ended') return hasElectionEnded(endDate);
    if (filter === 'upcoming') return !isElectionActive(startDate, endDate) && !hasElectionEnded(endDate);
    return true;
  });

  const activeCount = initialElections.filter(e => 
    isElectionActive(new Date(e.start_date), new Date(e.end_date))
  ).length;
  const upcomingCount = initialElections.filter(e => 
    !hasElectionEnded(new Date(e.end_date)) && !isElectionActive(new Date(e.start_date), new Date(e.end_date))
  ).length;
  const endedCount = initialElections.filter(e => 
    hasElectionEnded(new Date(e.end_date))
  ).length;

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

        {/* Quick Filters */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            className="whitespace-nowrap"
          >
            Всички ({initialElections.length})
          </Button>
          <Button
            onClick={() => setFilter('active')}
            variant={filter === 'active' ? 'default' : 'outline'}
            size="sm"
            className="whitespace-nowrap"
          >
            🟢 Активни ({activeCount})
          </Button>
          <Button
            onClick={() => setFilter('upcoming')}
            variant={filter === 'upcoming' ? 'default' : 'outline'}
            size="sm"
            className="whitespace-nowrap"
          >
            🟡 Предстоящи ({upcomingCount})
          </Button>
          <Button
            onClick={() => setFilter('ended')}
            variant={filter === 'ended' ? 'default' : 'outline'}
            size="sm"
            className="whitespace-nowrap"
          >
            🔴 Приключили ({endedCount})
          </Button>
        </div>

        {/* Elections Grid */}
        {filteredElections.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredElections.map((election) => (
              <ElectionCard key={election.id} election={election} />
            ))}
          </div>
        ) : (
          <GlassCard>
            <GlassCardContent className="py-16 text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-xl text-muted-foreground mb-4">
                {filter === 'all' 
                  ? 'Няма налични избори' 
                  : `Няма ${filter === 'active' ? 'активни' : filter === 'upcoming' ? 'предстоящи' : 'приключили'} избори`}
              </p>
              {filter !== 'all' && (
                <Button onClick={() => setFilter('all')} variant="outline" className="mr-2">
                  Виж всички
                </Button>
              )}
              <Link href="/dashboard/create">
                <Button className="gradient-primary">Създай нова анкета</Button>
              </Link>
            </GlassCardContent>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

function ElectionCard({ election }: { election: any }) {
  const startDate = new Date(election.start_date);
  const endDate = new Date(election.end_date);
  const active = isElectionActive(startDate, endDate);
  const ended = hasElectionEnded(endDate);
  const status = active ? 'active' : ended ? 'ended' : 'upcoming';

  return (
    <GlassCard hover className="flex flex-col cursor-pointer group">
      <GlassCardHeader>
        <div className="flex items-start justify-between gap-4">
          <GlassCardTitle className="text-xl group-hover:text-primary transition-colors flex-1">
            {election.title_bg || election.title}
          </GlassCardTitle>
          <StatusBadge startDate={startDate} endDate={endDate} className="flex-shrink-0" />
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
