'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FeedItem } from '@/components/feed-item';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { isElectionActive, hasElectionEnded } from '@/lib/utils';

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

interface DashboardClientPageProps {
  initialPolls: PollWithStats[];
}

export function DashboardClientPage({ initialPolls }: DashboardClientPageProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'ended'>('all');
  const [polls, setPolls] = useState<PollWithStats[]>(initialPolls || []);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  // Sync initialPolls with state when it changes
  useEffect(() => {
    mountedRef.current = true;
    if (initialPolls && JSON.stringify(initialPolls) !== JSON.stringify(polls)) {
      setPolls(initialPolls);
    }
    return () => {
      mountedRef.current = false;
    };
  }, [initialPolls]);

  // Refetch polls when component mounts
  useEffect(() => {
    mountedRef.current = true;
    
    const fetchPolls = async () => {
      if (!mountedRef.current) return;
      
      setLoading(true);
      try {
        // Use the same endpoint that the server uses
        const response = await fetch('/api/elections');
        if (!mountedRef.current) return;
        
        if (response.ok) {
          const data = await response.json();
          const elections = data.elections || [];
          
          // Convert elections to polls format (simplified - stats will be calculated from initialPolls)
          // For now, just update the list, stats are already in initialPolls
          if (mountedRef.current && elections.length > 0) {
            // Merge with initial polls to preserve stats
            const updatedPolls = elections.map((election: any) => {
              const existingPoll = polls.find(p => p.id === election.id);
              if (existingPoll) {
                return {
                  ...existingPoll,
                  ...election,
                };
              }
              
              const startDate = new Date(election.start_date);
              const endDate = new Date(election.end_date);
              const now = new Date();
              const isActive = startDate <= now && endDate >= now;
              
              return {
                ...election,
                questions: [],
                totalVotes: 0,
                isActive,
                likesCount: 0,
                commentsCount: 0,
                sharesCount: 0,
                hasFundraising: election.has_fundraising || false,
                fundraisingGoal: election.fundraising_goal ? parseFloat(election.fundraising_goal) : undefined,
                fundraisingCurrent: 0,
                fundraisingCurrency: election.fundraising_currency || 'BGN',
              };
            });
            
            setPolls(updatedPolls);
          }
        }
      } catch (error) {
        if (mountedRef.current) {
          console.error('Error fetching polls:', error);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    // Only refetch if we don't have polls or want to refresh
    if (!polls || polls.length === 0) {
      fetchPolls();
    }

    // Listen for focus events to refetch when user returns to tab
    const handleFocus = () => {
      if (mountedRef.current) {
        fetchPolls();
      }
    };
    window.addEventListener('focus', handleFocus);
    
    return () => {
      mountedRef.current = false;
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const filteredPolls = polls.filter(poll => {
    const startDate = new Date(poll.start_date);
    const endDate = new Date(poll.end_date);
    
    if (filter === 'active') return isElectionActive(startDate, endDate);
    if (filter === 'ended') return hasElectionEnded(endDate);
    if (filter === 'upcoming') return !isElectionActive(startDate, endDate) && !hasElectionEnded(endDate);
    return true;
  });

  const activeCount = polls.filter(p => 
    isElectionActive(new Date(p.start_date), new Date(p.end_date))
  ).length;
  const upcomingCount = polls.filter(p => 
    !hasElectionEnded(new Date(p.end_date)) && !isElectionActive(new Date(p.start_date), new Date(p.end_date))
  ).length;
  const endedCount = polls.filter(p => 
    hasElectionEnded(new Date(p.end_date))
  ).length;

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

      {/* Quick Filters */}
      <div className="mb-6 lg:mb-8 flex gap-2 overflow-x-auto pb-2">
        <Button
          onClick={() => setFilter('all')}
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          className="whitespace-nowrap"
        >
          Всички ({polls.length})
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

      {/* Feed Items */}
      {loading ? (
        <GlassCard>
          <GlassCardContent className="py-16 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Зареждане...</p>
          </GlassCardContent>
        </GlassCard>
      ) : filteredPolls.length > 0 ? (
        <div className="space-y-4 lg:space-y-6">
          {filteredPolls.map((poll) => (
            <FeedItem key={poll.id} poll={poll} />
          ))}
        </div>
      ) : (
        <GlassCard>
          <GlassCardContent className="py-16 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {filter === 'all' 
                ? 'Няма анкети' 
                : `Няма ${filter === 'active' ? 'активни' : filter === 'upcoming' ? 'предстоящи' : 'приключили'} анкети`}
            </h2>
            <p className="text-muted-foreground mb-6">
              {filter === 'all'
                ? 'Все още няма публикувани анкети. Бъдете първият, който създава!'
                : 'Опитайте друг филтър или създайте нова анкета.'}
            </p>
            {filter !== 'all' && (
              <Button onClick={() => setFilter('all')} variant="outline" className="mr-2">
                Виж всички
              </Button>
            )}
            <Link href="/dashboard/create">
              <Button className="gradient-primary text-white shadow-lg hover:shadow-xl transition-shadow">
                ➕ Създай анкета
              </Button>
            </Link>
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  );
}
