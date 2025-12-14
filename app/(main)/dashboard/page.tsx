'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateBG } from '@/lib/utils';

interface Election {
  id: string;
  title_bg: string;
  description_bg: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [elections, setElections] = useState<Election[]>([]);
  const [myElections, setMyElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalElections: 0,
    activeElections: 0,
    myElections: 0,
    totalVotes: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Check if user is logged in
      const telegramAuth = localStorage.getItem('telegram_auth');
      if (!telegramAuth) {
        router.push('/login');
        return;
      }

      // Fetch all elections
      const response = await fetch('/api/elections');
      const data = await response.json();
      setElections(data.elections || []);

      // Calculate stats
      const active = (data.elections || []).filter((e: Election) => {
        const now = new Date();
        const start = new Date(e.start_date);
        const end = new Date(e.end_date);
        return now >= start && now <= end;
      }).length;

      setStats({
        totalElections: data.elections?.length || 0,
        activeElections: active,
        myElections: 0, // TODO: Filter by creator
        totalVotes: 0, // TODO: Get from API
      });

      // Filter featured elections (active ones)
      setMyElections((data.elections || []).slice(0, 3));
    } catch (error) {
      console.error('Error fetching data:', error);
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
    <div className="min-h-screen pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden gradient-bg border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 py-12 md:py-20 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              Моят Глас
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Създавайте и участвайте в избори и анкети
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard/create">
                <Button size="lg" className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all">
                  ✨ Създай нова анкета
                </Button>
              </Link>
              <Link href="/elections">
                <Button size="lg" variant="outline" className="glass border-primary/50">
                  Виж всички избори
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Statistics Cards */}
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
              <div className="text-sm text-muted-foreground">Активни</div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard className="border-blue-500/30">
            <GlassCardContent className="p-6">
              <div className="text-3xl font-bold text-blue-400 mb-1">
                {stats.myElections}
              </div>
              <div className="text-sm text-muted-foreground">Мои избори</div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard className="border-purple-500/30">
            <GlassCardContent className="p-6">
              <div className="text-3xl font-bold text-purple-400 mb-1">
                {stats.totalVotes}
              </div>
              <div className="text-sm text-muted-foreground">Общо гласове</div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Featured Polls */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Препоръчани избори</h2>
              <p className="text-muted-foreground">Най-популярните и активни избори</p>
            </div>
            <Link href="/elections">
              <Button variant="outline">Виж всички</Button>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {myElections.map((election) => (
              <GlassCard key={election.id} hover className="cursor-pointer" onClick={() => router.push(`/vote/${election.id}`)}>
                <GlassCardHeader>
                  <div className="flex items-start justify-between">
                    <GlassCardTitle className="text-xl">{election.title_bg}</GlassCardTitle>
                    <Badge variant={election.status === 'active' ? 'success' : 'secondary'}>
                      {election.status === 'active' ? 'Активни' : election.status}
                    </Badge>
                  </div>
                  <GlassCardDescription className="line-clamp-2">
                    {election.description_bg}
                  </GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Начало: {formatDateBG(election.start_date)}</p>
                    <p>Край: {formatDateBG(election.end_date)}</p>
                  </div>
                </GlassCardContent>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Бързи действия</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/dashboard/create">
              <GlassCard hover className="cursor-pointer h-full">
                <GlassCardContent className="p-8 text-center">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-xl font-semibold mb-2">Създай анкета</h3>
                  <p className="text-sm text-muted-foreground">
                    Създайте нова анкета или избори за вашата общност
                  </p>
                </GlassCardContent>
              </GlassCard>
            </Link>

            <Link href="/dashboard/statistics">
              <GlassCard hover className="cursor-pointer h-full">
                <GlassCardContent className="p-8 text-center">
                  <div className="text-4xl mb-4">📈</div>
                  <h3 className="text-xl font-semibold mb-2">Статистики</h3>
                  <p className="text-sm text-muted-foreground">
                    Вижте детайлни статистики и анализи
                  </p>
                </GlassCardContent>
              </GlassCard>
            </Link>

            <Link href="/elections">
              <GlassCard hover className="cursor-pointer h-full">
                <GlassCardContent className="p-8 text-center">
                  <div className="text-4xl mb-4">🗳️</div>
                  <h3 className="text-xl font-semibold mb-2">Гласувай</h3>
                  <p className="text-sm text-muted-foreground">
                    Участвайте в активни избори и анкети
                  </p>
                </GlassCardContent>
              </GlassCard>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
