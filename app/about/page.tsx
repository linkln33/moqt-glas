import { Metadata } from 'next';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';

export const metadata: Metadata = {
  title: 'За нас - Моят Глас',
  description: 'Информация за платформата Моят Глас',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="text-3xl">За нас</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Моят Глас</h2>
              <p className="text-muted-foreground mb-4">
                Платформа за демократично гласуване в българските избори. 
                Прозрачно, сигурно и достъпно за всички.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Нашата мисия</h3>
                <p className="text-muted-foreground">
                  Да направим гласуването по-достъпно, прозрачно и сигурно чрез модерни технологии.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Технологии</h3>
                <p className="text-muted-foreground">
                  Използваме Next.js, Supabase и Telegram за да осигурим сигурна и удобна платформа за гласуване.
                </p>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
