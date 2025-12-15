'use client';

import { useState, useEffect } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { PieChartComponent } from '@/components/pie-chart';
import { BarChartComponent } from '@/components/bar-chart';
import { LineChartComponent } from '@/components/line-chart';

interface Stats {
  totalElections: number;
  activeElections: number;
  totalVotes: number;
  totalUsers: number;
  recentElections: any[];
  popularElections: any[];
  statusDistribution?: {
    active: number;
    upcoming: number;
    ended: number;
  };
  fundraisingDistribution?: {
    withFundraising: number;
    withoutFundraising: number;
  };
  voteDistribution?: Array<{
    name: string;
    value: number;
    id?: string;
  }>;
  fundraisingStats?: {
    totalRaised: number;
    successfulCampaigns: number;
    pendingCampaigns: number;
  };
  votesOverTime?: Array<{
    name: string;
    value: number;
  }>;
  electionsOverTime?: Array<{
    name: string;
    value: number;
  }>;
  votesOverTimePie?: Array<{
    name: string;
    value: number;
  }>;
  electionsOverTimePie?: Array<{
    name: string;
    value: number;
  }>;
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
    <div className="py-6 lg:py-8">
      <div className="w-full">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Статистики
          </h1>
          <p className="text-muted-foreground">
            Преглед на активността и резултатите
          </p>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
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
        <div className="grid gap-4 lg:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6 lg:mb-8">
          {/* Election Status Distribution */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Статус на изборите</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              {stats.statusDistribution ? (
                <PieChartComponent
                  data={[
                    {
                      name: 'Активни',
                      value: stats.statusDistribution.active,
                    },
                    {
                      name: 'Предстоящи',
                      value: stats.statusDistribution.upcoming,
                    },
                    {
                      name: 'Приключили',
                      value: stats.statusDistribution.ended,
                    },
                  ]}
                  colors={['#10b981', '#3b82f6', '#6b7280']}
                  height={280}
                />
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  Зареждане...
              </div>
              )}
            </GlassCardContent>
          </GlassCard>

          {/* Vote Distribution */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Разпределение на гласовете</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              {stats.voteDistribution && stats.voteDistribution.length > 0 ? (
                <PieChartComponent
                  data={stats.voteDistribution}
                  colors={['#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#84cc16', '#ef4444']}
                  height={280}
                />
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  Няма данни
                </div>
              )}
            </GlassCardContent>
          </GlassCard>

          {/* Fundraising Distribution */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Събиране на средства</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              {stats.fundraisingDistribution ? (
                <PieChartComponent
                  data={[
                    {
                      name: 'Със средства',
                      value: stats.fundraisingDistribution.withFundraising,
                    },
                    {
                      name: 'Без средства',
                      value: stats.fundraisingDistribution.withoutFundraising,
                    },
                  ]}
                  colors={['#10b981', '#6b7280']}
                  height={280}
                />
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  Зареждане...
              </div>
              )}
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Time Series Charts - Line/Bar */}
        {(stats.votesOverTime || stats.electionsOverTime) && (
          <div className="grid gap-4 lg:gap-6 md:grid-cols-2 mb-6 lg:mb-8">
            {stats.votesOverTime && stats.votesOverTime.length > 0 && (
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle>Гласове във времето (Графика)</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <LineChartComponent
                    data={stats.votesOverTime}
                    xAxisLabel="Дата"
                    yAxisLabel="Брой гласове"
                    height={300}
                    color="#3b82f6"
                    smooth={true}
                    area={true}
                  />
                </GlassCardContent>
              </GlassCard>
            )}
            {stats.electionsOverTime && stats.electionsOverTime.length > 0 && (
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle>Избори във времето (Графика)</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <BarChartComponent
                    data={stats.electionsOverTime}
                    xAxisLabel="Дата"
                    yAxisLabel="Брой избори"
                    height={300}
                  />
                </GlassCardContent>
              </GlassCard>
            )}
          </div>
        )}

        {/* Time Series Pie Charts */}
        {(stats.votesOverTimePie || stats.electionsOverTimePie) && (
          <div className="grid gap-4 lg:gap-6 md:grid-cols-2 mb-6 lg:mb-8">
            {stats.votesOverTimePie && stats.votesOverTimePie.length > 0 && (
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle>Гласове във времето</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <PieChartComponent
                    data={stats.votesOverTimePie}
                    colors={['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']}
                    height={300}
                  />
                </GlassCardContent>
              </GlassCard>
            )}
            {stats.electionsOverTimePie && stats.electionsOverTimePie.length > 0 && (
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle>Избори във времето</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <PieChartComponent
                    data={stats.electionsOverTimePie}
                    colors={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']}
                    height={300}
                  />
                </GlassCardContent>
              </GlassCard>
            )}
          </div>
        )}

        {/* Additional Charts Row */}
        {stats.fundraisingStats && stats.fundraisingStats.totalRaised > 0 && (
          <div className="grid gap-4 lg:gap-6 md:grid-cols-2 mb-6 lg:mb-8">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Кампании за средства</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <PieChartComponent
                  data={[
                    {
                      name: 'Успешни',
                      value: stats.fundraisingStats.successfulCampaigns,
                    },
                    {
                      name: 'В очакване',
                      value: stats.fundraisingStats.pendingCampaigns,
                    },
                  ]}
                  colors={['#10b981', '#f59e0b']}
                  height={280}
                />
                <div className="mt-4 text-center">
                  <p className="text-2xl font-bold text-primary">
                    {stats.fundraisingStats.totalRaised.toFixed(2)} BGN
                  </p>
                  <p className="text-sm text-muted-foreground">Общо събрани средства</p>
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* User Participation Chart */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Участие на потребители</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                {stats.totalUsers > 0 && stats.totalVotes > 0 ? (
                  <>
                    <PieChartComponent
                      data={[
                        {
                          name: 'Гласували',
                          value: Math.min(stats.totalUsers, stats.totalVotes),
                        },
                        {
                          name: 'Неактивни',
                          value: Math.max(0, stats.totalUsers - stats.totalVotes),
                        },
                      ]}
                      colors={['#3b82f6', '#6b7280']}
                      height={280}
                    />
                    <div className="mt-4 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {stats.totalVotes > 0 
                          ? ((Math.min(stats.totalUsers, stats.totalVotes) / stats.totalUsers) * 100).toFixed(1)
                          : 0}%
                      </p>
                      <p className="text-sm text-muted-foreground">Процент активност</p>
                    </div>
                  </>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                    Няма данни
                  </div>
                )}
              </GlassCardContent>
            </GlassCard>
          </div>
        )}

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
