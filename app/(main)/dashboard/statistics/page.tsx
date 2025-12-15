'use client';

import { useState, useEffect } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChartComponent } from '@/components/pie-chart';
import { BarChartComponent } from '@/components/bar-chart';
import { LineChartComponent } from '@/components/line-chart';
import { EventStatisticsCard } from '@/components/event-statistics-card';
import { 
  TrendingUp, 
  Users, 
  Vote, 
  Calendar, 
  DollarSign, 
  Activity,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';

interface OptionStat {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

interface QuestionStat {
  id: string;
  text: string;
  type: string;
  totalVotes: number;
  options: OptionStat[];
}

interface EventStat {
  id: string;
  title: string;
  description?: string;
  status: string;
  startDate: string;
  endDate: string;
  totalVotes: number;
  questions: QuestionStat[];
  fundraising?: {
    totalRaised: number;
    goal: number;
    currency: string;
    totalDonations: number;
  };
}

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
  eventsStats?: EventStat[];
  engagementStats?: {
    recentVotes: number;
    recentUsers: number;
    activityOverTime: Array<{ name: string; value: number }>;
  };
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
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
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

  const handleTabChange = (value: string) => {
    // Prevent scroll jump when switching tabs
    const currentScrollY = window.scrollY;
    const scrollContainer = document.documentElement || document.body;
    
    setActiveTab(value);
    
    // Use multiple attempts to preserve scroll position
    // This handles React's async rendering
    requestAnimationFrame(() => {
      scrollContainer.scrollTop = currentScrollY;
      setTimeout(() => {
        scrollContainer.scrollTop = currentScrollY;
      }, 10);
    });
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
    <div className="py-2 lg:py-3">
      <div className="w-full">
        <div className="mb-3 lg:mb-4">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Статистики
          </h1>
          <p className="text-muted-foreground">
            Преглед на активността и резултатите
          </p>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 lg:gap-3 mb-3 lg:mb-4">
          <GlassCard variant="gradient" className="shine group">
            <GlassCardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-6 h-6 text-white/80" />
                <TrendingUp className="w-5 h-5 text-white/60 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {stats.totalElections}
              </div>
              <div className="text-sm text-white/80">Общо избори</div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard className="border-green-500/30 group hover:border-green-500/50 transition-colors">
            <GlassCardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-6 h-6 text-green-400" />
                <Badge variant="success" className="animate-pulse">Активни</Badge>
              </div>
              <div className="text-3xl font-bold text-green-400 mb-1">
                {stats.activeElections}
              </div>
              <div className="text-sm text-muted-foreground">Активни избори</div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard className="border-blue-500/30 group hover:border-blue-500/50 transition-colors">
            <GlassCardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Vote className="w-6 h-6 text-blue-400" />
                <BarChart3 className="w-5 h-5 text-blue-400/60 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-3xl font-bold text-blue-400 mb-1">
                {stats.totalVotes}
              </div>
              <div className="text-sm text-muted-foreground">Общо гласове</div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard className="border-purple-500/30 group hover:border-purple-500/50 transition-colors">
            <GlassCardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-6 h-6 text-purple-400" />
                <TrendingUp className="w-5 h-5 text-purple-400/60 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-3xl font-bold text-purple-400 mb-1">
                {stats.totalUsers}
              </div>
              <div className="text-sm text-muted-foreground">Потребители</div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-3 lg:mb-4 glass-light">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Общ преглед</span>
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Събития</span>
              </TabsTrigger>
              <TabsTrigger value="engagement" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Активност</span>
              </TabsTrigger>
              <TabsTrigger value="fundraising" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Средства</span>
              </TabsTrigger>
            </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-3 lg:space-y-4 min-h-[400px]">
            <div className="grid gap-2 lg:gap-3 md:grid-cols-2 lg:grid-cols-3">
              {/* Election Status Distribution */}
              {stats.statusDistribution && (
                <GlassCard>
                  <GlassCardHeader>
                    <GlassCardTitle className="flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-primary" />
                      Статус на изборите
                    </GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent>
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
                  </GlassCardContent>
                </GlassCard>
              )}

              {/* Vote Distribution */}
              {stats.voteDistribution && stats.voteDistribution.length > 0 && (
                <GlassCard>
                  <GlassCardHeader>
                    <GlassCardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Разпределение на гласовете
                    </GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <PieChartComponent
                      data={stats.voteDistribution}
                      colors={['#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#84cc16', '#ef4444']}
                      height={280}
                    />
                  </GlassCardContent>
                </GlassCard>
              )}

              {/* Fundraising Distribution */}
              {stats.fundraisingDistribution && (
                <GlassCard>
                  <GlassCardHeader>
                    <GlassCardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-primary" />
                      Събиране на средства
                    </GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent>
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
                  </GlassCardContent>
                </GlassCard>
              )}
            </div>

            {/* Time Series Charts */}
            {(stats.votesOverTime || stats.electionsOverTime) && (
              <div className="grid gap-2 lg:gap-3 md:grid-cols-2">
                {stats.votesOverTime && stats.votesOverTime.length > 0 && (
                  <GlassCard>
                    <GlassCardHeader>
                      <GlassCardTitle className="flex items-center gap-2">
                        <LineChart className="w-5 h-5 text-primary" />
                        Гласове във времето
                      </GlassCardTitle>
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
                      <GlassCardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Избори във времето
                      </GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent>
                      <BarChartComponent
                        data={stats.electionsOverTime}
                        xAxisLabel="Дата"
                        yAxisLabel="Брой избори"
                        height={300}
                        colors={['#10b981', '#3b82f6', '#8b5cf6']}
                      />
                    </GlassCardContent>
                  </GlassCard>
                )}
              </div>
            )}

            {/* Popular Elections */}
            {stats.popularElections && stats.popularElections.length > 0 && (
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Най-популярни избори
                  </GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="space-y-4">
                    {stats.popularElections.map((election, index) => (
                      <div
                        key={election.id}
                        className="flex items-center justify-between p-4 rounded-lg glass-light hover:scale-[1.02] transition-transform"
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
                    ))}
                  </div>
                </GlassCardContent>
              </GlassCard>
            )}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-3 lg:space-y-4 min-h-[400px]">
            {stats.eventsStats && stats.eventsStats.length > 0 ? (
              <div className="space-y-3 lg:space-y-4">
                {stats.eventsStats.map((event) => (
                  <EventStatisticsCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <GlassCard>
                <GlassCardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Няма данни за събития</p>
                </GlassCardContent>
              </GlassCard>
            )}
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="space-y-3 lg:space-y-4 min-h-[400px]">
            <div className="grid gap-2 lg:gap-3 md:grid-cols-2">
              {/* User Participation */}
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Участие на потребители
                  </GlassCardTitle>
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

              {/* Recent Activity */}
              {stats.engagementStats && (
                <GlassCard>
                  <GlassCardHeader>
                    <GlassCardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      Активност (30 дни)
                    </GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <div className="space-y-4 mb-4">
                      <div className="flex items-center justify-between p-3 rounded-lg glass-light">
                        <span className="text-sm">Нови гласове</span>
                        <Badge variant="info" className="text-lg">
                          {stats.engagementStats.recentVotes}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg glass-light">
                        <span className="text-sm">Нови потребители</span>
                        <Badge variant="success" className="text-lg">
                          {stats.engagementStats.recentUsers}
                        </Badge>
                      </div>
                    </div>
                    {stats.engagementStats.activityOverTime.length > 0 && (
                      <LineChartComponent
                        data={stats.engagementStats.activityOverTime}
                        xAxisLabel="Дата"
                        yAxisLabel="Активност"
                        height={200}
                        color="#10b981"
                        smooth={true}
                        area={true}
                      />
                    )}
                  </GlassCardContent>
                </GlassCard>
              )}
            </div>
          </TabsContent>

          {/* Fundraising Tab */}
          <TabsContent value="fundraising" className="space-y-3 lg:space-y-4 min-h-[400px]">
            {stats.fundraisingStats && stats.fundraisingStats.totalRaised > 0 ? (
              <div className="grid gap-2 lg:gap-3 md:grid-cols-2">
                <GlassCard>
                  <GlassCardHeader>
                    <GlassCardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-primary" />
                      Кампании за средства
                    </GlassCardTitle>
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

                {/* Fundraising Summary */}
                <GlassCard>
                  <GlassCardHeader>
                    <GlassCardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Обобщение
                    </GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg glass-light">
                        <div className="text-sm text-muted-foreground mb-1">Общо събрани</div>
                        <div className="text-3xl font-bold text-green-400">
                          {stats.fundraisingStats.totalRaised.toFixed(2)} BGN
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg glass-light">
                          <div className="text-sm text-muted-foreground mb-1">Успешни</div>
                          <div className="text-2xl font-bold text-primary">
                            {stats.fundraisingStats.successfulCampaigns}
                          </div>
                        </div>
                        <div className="p-4 rounded-lg glass-light">
                          <div className="text-sm text-muted-foreground mb-1">В очакване</div>
                          <div className="text-2xl font-bold text-amber-400">
                            {stats.fundraisingStats.pendingCampaigns}
                          </div>
                        </div>
                      </div>
                    </div>
                  </GlassCardContent>
                </GlassCard>
              </div>
            ) : (
              <GlassCard>
                <GlassCardContent className="py-12 text-center">
                  <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Няма данни за събиране на средства</p>
                </GlassCardContent>
              </GlassCard>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
