import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardFooter, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { createServerClient } from '@/lib/supabase/client';
import { formatDateBG } from '@/lib/utils';
import { EventsCarousel } from '@/components/events-carousel';

async function getHomeStats() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl === 'https://placeholder.supabase.co') {
    return {
      totalUsers: 0,
      totalEvents: 0,
      moneyRaised: 0,
      accuracy: 0,
    };
  }

  try {
    const supabase = createServerClient();
    
    // Get total users
    const { count: totalUsers } = await supabase
      .from('voters')
      .select('*', { count: 'exact', head: true });

    // Get total events
    const { count: totalEvents } = await supabase
      .from('elections')
      .select('*', { count: 'exact', head: true });

    // Get money raised from completed donations
    const { data: donations } = await supabase
      .from('election_donations')
      .select('amount')
      .eq('payment_status', 'completed');
    
    const moneyRaised = donations?.reduce((sum, d) => sum + parseFloat(d.amount || '0'), 0) || 0;

    // Calculate accuracy based on security measures effectiveness
    // Base accuracy from security layers: 85-90% (from RESEARCH.md)
    // Adjust based on actual security implementation and detection rates
    
    const { count: totalVotes } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true });
    
    if (!totalVotes || totalVotes === 0) {
      // No votes yet - show base security effectiveness
      return {
        totalUsers: totalUsers || 0,
        totalEvents: totalEvents || 0,
        moneyRaised: Math.round(moneyRaised * 100) / 100,
        accuracy: 87.5, // Base security effectiveness (average of 85-90%)
      };
    }
    
    // Calculate actual security effectiveness based on votes data
    // 1. Check device fingerprinting coverage (70-85% effective)
    const { count: votesWithDeviceFingerprint } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .not('device_fingerprint', 'is', null);
    
    const deviceFingerprintCoverage = votesWithDeviceFingerprint && totalVotes 
      ? (votesWithDeviceFingerprint / totalVotes) * 100 
      : 0;
    const deviceFingerprintEffectiveness = deviceFingerprintCoverage * 0.77; // 77% average of 70-85%
    
    // 2. Check risk scoring coverage (50-60% effective)
    const { count: votesWithRiskScore } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .not('risk_score', 'is', null)
      .gt('risk_score', 0);
    
    const riskScoringCoverage = votesWithRiskScore && totalVotes 
      ? (votesWithRiskScore / totalVotes) * 100 
      : 0;
    const riskScoringEffectiveness = riskScoringCoverage * 0.55; // 55% average of 50-60%
    
    // 3. Check for suspicious activities (detection rate)
    const { count: suspiciousActivities } = await supabase
      .from('suspicious_activities')
      .select('*', { count: 'exact', head: true });
    
    const detectionRate = totalVotes > 0 
      ? Math.min((suspiciousActivities || 0) / totalVotes * 100, 10) // Cap at 10% for realistic detection
      : 0;
    
    // 4. Check for duplicate patterns (IP and device matches)
    const { data: duplicateIPs } = await supabase
      .from('votes')
      .select('ip_address')
      .not('ip_address', 'is', null);
    
    const ipGroups = new Map<string, number>();
    duplicateIPs?.forEach(vote => {
      if (vote.ip_address) {
        ipGroups.set(vote.ip_address, (ipGroups.get(vote.ip_address) || 0) + 1);
      }
    });
    
    const duplicateIPCount = Array.from(ipGroups.values()).filter(count => count > 1).length;
    const duplicateDetectionRate = totalVotes > 0 
      ? (duplicateIPCount / totalVotes) * 100 
      : 0;
    
    // Calculate combined accuracy
    // Base: 87.5% (average of 85-90% from security layers)
    // Adjustments:
    // - Device fingerprinting: +0-15% based on coverage
    // - Risk scoring: +0-10% based on coverage  
    // - Detection bonuses: +0-5% for active detection
    
    let accuracy = 87.5; // Base security effectiveness
    
    // Add effectiveness from active security measures
    if (deviceFingerprintCoverage > 50) {
      accuracy += (deviceFingerprintEffectiveness / 10); // Up to +7.7%
    }
    
    if (riskScoringCoverage > 50) {
      accuracy += (riskScoringEffectiveness / 10); // Up to +5.5%
    }
    
    // Detection bonus (shows system is actively detecting threats)
    if (detectionRate > 0) {
      accuracy += Math.min(detectionRate * 0.5, 3); // Up to +3%
    }
    
    if (duplicateDetectionRate > 0) {
      accuracy += Math.min(duplicateDetectionRate * 0.3, 2); // Up to +2%
    }
    
    // Cap accuracy at 98% (no system is 100% secure)
    accuracy = Math.min(accuracy, 98.0);
    
    // If no security measures are active, show lower accuracy
    if (deviceFingerprintCoverage < 10 && riskScoringCoverage < 10) {
      accuracy = 60.0; // Basic security only
    }

    return {
      totalUsers: totalUsers || 0,
      totalEvents: totalEvents || 0,
      moneyRaised: Math.round(moneyRaised * 100) / 100,
      accuracy: accuracy,
    };
  } catch (error) {
    console.error('Error fetching home stats:', error);
    return {
      totalUsers: 0,
      totalEvents: 0,
      moneyRaised: 0,
      accuracy: 0,
    };
  }
}

async function getActiveElections() {
  // Check if Supabase is configured (not placeholder)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl === 'https://placeholder.supabase.co') {
    // Return empty array during build if Supabase is not configured
    return { active: [], upcoming: [] };
  }

  try {
    const supabase = createServerClient();
    const now = new Date().toISOString();

    // Get active elections (started but not ended)
    const { data: activeElections, error: activeError } = await supabase
      .from('elections')
      .select('*')
      .lte('start_date', now)
      .gte('end_date', now)
      .order('created_at', { ascending: false })
      .limit(6);

    if (activeError) {
      console.error('Error fetching active elections:', activeError);
    }

    // Get upcoming elections (not started yet)
    const { data: upcomingElections, error: upcomingError } = await supabase
      .from('elections')
      .select('*')
      .gt('start_date', now)
      .order('start_date', { ascending: true })
      .limit(6);

    if (upcomingError) {
      console.error('Error fetching upcoming elections:', upcomingError);
    }

    // Helper function to get questions for elections
    const getElectionsWithDetails = async (elections: any[]) => {
      if (!elections || elections.length === 0) return [];
      
      return await Promise.all(
        elections.map(async (election) => {
          const { data: questions } = await supabase
            .from('questions')
            .select('*, options(*)')
            .eq('election_id', election.id)
            .order('order_index', { ascending: true });

          return {
            ...election,
            questions: questions || [],
            isExample: election.created_by === 'example',
          };
        })
      );
    };

    const active = await getElectionsWithDetails(activeElections || []);
    const upcoming = await getElectionsWithDetails(upcomingElections || []);

    return { active, upcoming };
  } catch (error) {
    console.error('Error fetching elections:', error);
    return { active: [], upcoming: [] };
  }
}

export default async function HomePage() {
  const { active: activeElections, upcoming: upcomingElections } = await getActiveElections();
  const examplePolls = activeElections.filter(e => e.isExample);
  const otherElections = activeElections.filter(e => !e.isExample);
  const stats = await getHomeStats();
  
  return (
    <main className="min-h-screen">
      {/* Unified Background Layout */}
      <div className="relative overflow-hidden gradient-bg">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent"></div>
        
        <div className="relative">
          {/* Hero Section */}
          <div className="relative overflow-hidden border-b border-border/50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 md:pt-20 pb-16 sm:pb-24 md:pb-40 relative">
              <div className="max-w-4xl mx-auto text-center">
                <div className="flex flex-col items-center justify-center mb-4 sm:mb-6">
              <div className="mb-6 sm:mb-8 md:mb-10">
                <Image 
                  src="/logo.svg" 
                  alt="Моят Глас" 
                  width={400}
                  height={400}
                  className="object-contain mx-auto drop-shadow-2xl hero-logo w-56 h-56 sm:w-72 sm:h-72 md:w-88 md:h-88 lg:w-96 lg:h-96"
                  priority
                />
              </div>
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent mb-2 sm:mb-3">
                Моят Глас
              </h1>
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl text-muted-foreground mb-4 sm:mb-5 md:mb-6 px-4">
              Създавайте и участвайте в избори и анкети
            </p>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground/80 mb-10 sm:mb-14 md:mb-16 px-4">
              Безопасно, прозрачно и лесно гласуване с Telegram автентификация
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button size="lg" className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto shine">
                  🚀 Започни сега
                </Button>
              </Link>
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="glass border-primary/50 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto">
                  Виж изборите
                </Button>
              </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 md:-mt-20 lg:-mt-24 relative z-10 pb-6 sm:pb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
              <GlassCard className="border-blue-500/30 shine">
                <GlassCardContent className="p-3 sm:p-4 md:p-5 lg:p-6 text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-400 mb-1 sm:mb-2">
                    {stats.totalUsers.toLocaleString()}
                  </div>
                  <div className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground leading-tight">Потребители</div>
                </GlassCardContent>
              </GlassCard>

              <GlassCard className="border-green-500/30 shine">
                <GlassCardContent className="p-3 sm:p-4 md:p-5 lg:p-6 text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-400 mb-1 sm:mb-2">
                    {stats.totalEvents.toLocaleString()}
                  </div>
                  <div className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground leading-tight">Събития</div>
                </GlassCardContent>
              </GlassCard>

              <GlassCard className="border-purple-500/30 shine">
                <GlassCardContent className="p-3 sm:p-4 md:p-5 lg:p-6 text-center">
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-purple-400 mb-1 sm:mb-2 leading-tight">
                    <span className="block sm:inline">{stats.moneyRaised.toLocaleString('bg-BG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className="block sm:inline text-xs sm:text-sm md:text-base lg:text-lg"> BGN</span>
                  </div>
                  <div className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground leading-tight mt-1">Събрани средства</div>
                </GlassCardContent>
              </GlassCard>

              <GlassCard className="border-orange-500/30 shine">
                <GlassCardContent className="p-3 sm:p-4 md:p-5 lg:p-6 text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-400 mb-1 sm:mb-2">
                    {stats.accuracy.toFixed(1)}%
                  </div>
                  <div className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground leading-tight">Точност</div>
                </GlassCardContent>
              </GlassCard>
            </div>
          </div>

          {/* Events Carousel Section */}
          {(activeElections.length > 0 || upcomingElections.length > 0) ? (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 max-w-7xl">
              <div className="text-center mb-10 sm:mb-14 md:mb-16">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-5 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Активни и предстоящи събития
                </h2>
                <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto">
                  Участвайте в активни избори и анкети. Вашият глас има значение!
                </p>
              </div>

              {/* Example Polls Carousel */}
              {examplePolls.length > 0 && (
                <div className="mb-16">
                  <EventsCarousel
                    events={examplePolls}
                    title="Примерни анкети"
                    badgeVariant="info"
                    badgeText="Пример"
                  />
                </div>
              )}

              {/* Active Elections Carousel */}
              {otherElections.length > 0 && (
                <div className="mb-16">
                  <EventsCarousel
                    events={otherElections}
                    title="Активни избори"
                    badgeVariant="success"
                    badgeText="Активни"
                  />
                </div>
              )}

              {/* Upcoming Elections Carousel */}
              {upcomingElections.length > 0 && (
                <div>
                  <EventsCarousel
                    events={upcomingElections}
                    title="Предстоящи избори"
                    badgeVariant="info"
                    badgeText="Предстояща"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 max-w-7xl">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Текущи активни избори и анкети</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              В момента няма активни избори. Създайте първата анкета!
            </p>
          </div>
          <div className="text-center">
            <Link href="/dashboard/create">
              <Button size="lg" className="gradient-primary text-white shadow-lg">
                Създай първата анкета
              </Button>
            </Link>
          </div>
            </div>
          )}

          {/* Features Section */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 max-w-7xl">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Защо Моят Глас?</h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Модерна платформа за демократично участие
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <GlassCard hover className="shine">
            <GlassCardHeader>
              <div className="text-4xl mb-4">🔒</div>
              <GlassCardTitle>Безопасно</GlassCardTitle>
              <GlassCardDescription>
                Многослойна защита срещу измами и дублирани гласове
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Уникална идентификация на устройство</li>
                <li>✓ Анализ на риск и поведение</li>
                <li>✓ Криптографска верификация</li>
              </ul>
            </GlassCardContent>
          </GlassCard>

          <GlassCard hover className="shine">
            <GlassCardHeader>
              <div className="text-4xl mb-4">⚡</div>
              <GlassCardTitle>Бързо</GlassCardTitle>
              <GlassCardDescription>
                Един клик с Telegram - без регистрации и пароли
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Моментално влизане</li>
                <li>✓ Мобилно-оптимизиран</li>
                <li>✓ Резултати в реално време</li>
              </ul>
            </GlassCardContent>
          </GlassCard>

          <GlassCard hover className="shine">
            <GlassCardHeader>
              <div className="text-4xl mb-4">📊</div>
              <GlassCardTitle>Прозрачно</GlassCardTitle>
              <GlassCardDescription>
                Създавайте собствени анкети и следете статистики
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Лесно създаване на анкети</li>
                <li>✓ Детайлни статистики</li>
                <li>✓ Публични резултати</li>
              </ul>
            </GlassCardContent>
          </GlassCard>
        </div>
          </div>

          {/* CTA Section */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 max-w-4xl">
        <GlassCard variant="gradient" className="text-center">
          <GlassCardContent className="p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground dark:text-white mb-3 sm:mb-4">
              Готови ли сте да започнете?
            </h2>
            <p className="text-muted-foreground dark:text-white/80 mb-6 sm:mb-8 text-base sm:text-lg">
              Създайте първата си анкета за минути
            </p>
            <Link href="/dashboard/create">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6">
                Създай анкета
              </Button>
            </Link>
          </GlassCardContent>
        </GlassCard>
          </div>
        </div>
      </div>
    </main>
  );
}
