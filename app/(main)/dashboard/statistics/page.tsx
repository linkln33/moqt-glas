'use client';

import { useState, useEffect } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';

interface Stats {
  totalElections: number;
  activeElections: number;
  totalVotes: number;
  totalUsers: number;
  recentElections: any[];
  popularElections: any[];
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<Stats>({
    totalElections: 0,
    activeElections: 0,
    totalVotes: 0,
    totalUsers: 0,
    recentElections: [],
    popularElections: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/statistics');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Зареждане...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Статистики
          </h1>
          <p className="text-muted-foreground">
            Преглед на активността и резултатите
          </p>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <GlassCard variant="gradient" className="shine">
            <GlassCardContent className="p-6">
              <div className="text-3xl font-bold text-white mb-1">
                {stats.totalElections}
              </div>
              <div className="text-sm text-white/80">Общо избори</div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard className="border-green-500/30">
            <GlassCardContent className="p-6">
              <div className="text-3xl font-bold text-green-400 mb-1">
                {stats.activeElections}
              </div>
              <div className="text-sm text-muted-foreground">Активни избори</div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard className="border-blue-500/30">
            <GlassCardContent className="p-6">
              <div className="text-3xl font-bold text-blue-400 mb-1">
                {stats.totalVotes}
              </div>
              <div className="text-sm text-muted-foreground">Общо гласове</div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard className="border-purple-500/30">
            <GlassCardContent className="p-6">
              <div className="text-3xl font-bold text-purple-400 mb-1">
                {stats.totalUsers}
              </div>
              <div className="text-sm text-muted-foreground">Потребители</div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Активност по дни</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Графика на активността (в разработка)
              </div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Разпределение на гласовете</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Кръгова диаграма (в разработка)
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Popular Elections */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Най-популярни избори</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-4">
              {stats.popularElections.length > 0 ? (
                stats.popularElections.map((election, index) => (
                  <div
                    key={election.id}
                    className="flex items-center justify-between p-4 rounded-lg glass-light"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-primary w-8">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-semibold">{election.title_bg}</div>
                        <div className="text-sm text-muted-foreground">
                          {election.vote_count || 0} гласа
                        </div>
                      </div>
                    </div>
                    <Badge variant="success">Активни</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Няма данни за популярни избори
                </div>
              )}
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
