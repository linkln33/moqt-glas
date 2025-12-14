import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
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
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent animate-pulse">
              МОКТ Глас
            </h1>
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

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Защо МОКТ Глас?</h2>
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
