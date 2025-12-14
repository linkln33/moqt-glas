import { Metadata } from 'next';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';

export const metadata: Metadata = {
  title: 'Поверителност - Моят Глас',
  description: 'Политика за поверителност',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="text-3xl">Политика за поверителност</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Защита на данните</h2>
              <p className="text-muted-foreground mb-4">
                Ние се ангажираме да защитаваме вашата поверителност и лични данни.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Какви данни събираме</h3>
                <p className="text-muted-foreground">
                  Събираме само необходимите данни от Telegram за автентификация и гласуване.
                  Вашите гласове са анонимни и не могат да бъдат свързани с вашата личност.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Използване на данните</h3>
                <p className="text-muted-foreground">
                  Данните се използват единствено за целите на платформата за гласуване.
                  Не споделяме вашите данни с трети страни.
                </p>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
