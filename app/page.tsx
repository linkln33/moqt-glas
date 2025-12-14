import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardFooter, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { createServerClient } from '@/lib/supabase/client';
import { formatDateBG } from '@/lib/utils';

async function getActiveElections() {
  try {
    const supabase = createServerClient();
    const now = new Date().toISOString();

    // Get all active elections (based on dates, not just status)
    const { data: elections, error } = await supabase
      .from('elections')
      .select('*')
      .lte('start_date', now)
      .gte('end_date', now)
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      console.error('Error fetching elections:', error);
      return [];
    }

    if (!elections || elections.length === 0) {
      return [];
    }

    // Get questions and options for each election
    const electionsWithDetails = await Promise.all(
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

    return electionsWithDetails;
  } catch (error) {
    console.error('Error fetching elections:', error);
    return [];
  }
}

export default async function HomePage() {
  const activeElections = await getActiveElections();
  const examplePolls = activeElections.filter(e => e.isExample);
  const otherElections = activeElections.filter(e => !e.isExample);
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden gradient-bg border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6">
              <Badge variant="info" className="mb-4">Нова платформа</Badge>
            </div>
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="mb-6 bg-transparent">
                <Image 
                  src="/logo.png" 
                  alt="Моят Глас" 
                  width={200}
                  height={200}
                  className="object-contain mx-auto drop-shadow-2xl bg-transparent"
                  priority
                  style={{ backgroundColor: 'transparent' }}
                />
              </div>
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                Моят Глас
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground mb-4">
              Създавайте и участвайте в избори и анкети
            </p>
            <p className="text-lg text-muted-foreground/80 mb-12">
              Безопасно, прозрачно и лесно гласуване с Telegram автентификация
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all text-lg px-8 py-6 shine">
                  🚀 Започни сега
                </Button>
              </Link>
              <Link href="/elections">
                <Button size="lg" variant="outline" className="glass border-primary/50 text-lg px-8 py-6">
                  Виж изборите
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Templates Section */}
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Бързи шаблони</h2>
          <p className="text-muted-foreground text-lg">
            Създайте анкета за секунди с готови шаблони
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-16">
          <Link href="/dashboard/create?template=yesno">
            <GlassCard hover className="cursor-pointer h-full text-center shine">
              <GlassCardHeader>
                <div className="text-6xl mb-4">✅</div>
                <GlassCardTitle className="text-2xl">Да/Не</GlassCardTitle>
                <GlassCardDescription>
                  Бърза анкета с две опции - идеална за бързи решения
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <Button variant="outline" className="w-full">
                  Използвай шаблон →
                </Button>
              </GlassCardContent>
            </GlassCard>
          </Link>

          <Link href="/dashboard/create?template=rating">
            <GlassCard hover className="cursor-pointer h-full text-center shine">
              <GlassCardHeader>
                <div className="text-6xl mb-4">⭐</div>
                <GlassCardTitle className="text-2xl">Рейтинг</GlassCardTitle>
                <GlassCardDescription>
                  Оценка от 1 до 5 - перфектна за обратна връзка
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <Button variant="outline" className="w-full">
                  Използвай шаблон →
                </Button>
              </GlassCardContent>
            </GlassCard>
          </Link>

          <Link href="/dashboard/create?template=candidate">
            <GlassCard hover className="cursor-pointer h-full text-center shine">
              <GlassCardHeader>
                <div className="text-6xl mb-4">👤</div>
                <GlassCardTitle className="text-2xl">Избор на кандидат</GlassCardTitle>
                <GlassCardDescription>
                  Избор между няколко кандидата - за избори и гласувания
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <Button variant="outline" className="w-full">
                  Използвай шаблон →
                </Button>
              </GlassCardContent>
            </GlassCard>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Защо Моят Глас?</h2>
          <p className="text-muted-foreground text-lg">
            Модерна платформа за демократично участие
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
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

      {/* Active Elections Section */}
      {activeElections.length > 0 ? (
        <div className="container mx-auto px-4 py-16 max-w-7xl">
          {examplePolls.length > 0 && (
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Примерни анкети</h2>
              <p className="text-muted-foreground text-lg">
                Опитайте нашата платформа с тези примерни анкети
              </p>
            </div>
          )}

          {examplePolls.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16">
              {examplePolls.map((poll) => (
                <Link key={poll.id} href={`/vote/${poll.id}`}>
                  <GlassCard hover className="flex flex-col cursor-pointer group h-full">
                    <GlassCardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <GlassCardTitle className="text-xl group-hover:text-primary transition-colors">
                          {poll.title_bg || poll.title}
                        </GlassCardTitle>
                        <Badge variant="info">Пример</Badge>
                      </div>
                      <GlassCardDescription className="line-clamp-2">
                        {poll.description_bg || poll.description}
                      </GlassCardDescription>
                    </GlassCardHeader>
                    <GlassCardContent className="flex-grow">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">📊 Въпроси:</span>
                          <span className="font-medium">{poll.questions?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">📅 Край:</span>
                          <span>{formatDateBG(poll.end_date)}</span>
                        </div>
                      </div>
                    </GlassCardContent>
                    <GlassCardFooter>
                      <Button className="w-full gradient-primary text-white shadow-lg">
                        Гласувай сега →
                      </Button>
                    </GlassCardFooter>
                  </GlassCard>
                </Link>
              ))}
            </div>
          )}

          {otherElections.length > 0 && (
            <>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Активни избори</h2>
                <p className="text-muted-foreground text-lg">
                  Участвайте в активни избори и анкети
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {otherElections.map((poll) => (
                  <Link key={poll.id} href={`/vote/${poll.id}`}>
                    <GlassCard hover className="flex flex-col cursor-pointer group h-full">
                      <GlassCardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <GlassCardTitle className="text-xl group-hover:text-primary transition-colors">
                            {poll.title_bg || poll.title}
                          </GlassCardTitle>
                          <Badge variant="success">Активни</Badge>
                        </div>
                        <GlassCardDescription className="line-clamp-2">
                          {poll.description_bg || poll.description}
                        </GlassCardDescription>
                      </GlassCardHeader>
                      <GlassCardContent className="flex-grow">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">📊 Въпроси:</span>
                            <span className="font-medium">{poll.questions?.length || 0}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">📅 Край:</span>
                            <span>{formatDateBG(poll.end_date)}</span>
                          </div>
                        </div>
                      </GlassCardContent>
                      <GlassCardFooter>
                        <Button className="w-full gradient-primary text-white shadow-lg">
                          Гласувай сега →
                        </Button>
                      </GlassCardFooter>
                    </GlassCard>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <GlassCard className="text-center">
            <GlassCardContent className="py-12">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Няма активни избори</h2>
              <p className="text-muted-foreground mb-6">
                Създайте първата си анкета или изчакайте да започнат изборите
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard/create">
                  <Button className="gradient-primary">
                    Създай първата анкета
                  </Button>
                </Link>
                <Link href="/elections">
                  <Button variant="outline" className="glass">
                    Виж всички избори
                  </Button>
                </Link>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      )}

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <GlassCard variant="gradient" className="text-center">
          <GlassCardContent className="p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Готови ли сте да започнете?
            </h2>
            <p className="text-white/80 mb-8 text-lg">
              Създайте първата си анкета за минути
            </p>
            <Link href="/dashboard/create">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6">
                Създай анкета
              </Button>
            </Link>
          </GlassCardContent>
        </GlassCard>
      </div>
    </main>
  );
}
