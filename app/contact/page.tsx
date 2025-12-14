import { Metadata } from 'next';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';

export const metadata: Metadata = {
  title: 'Контакти - Моят Глас',
  description: 'Свържете се с нас',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="text-3xl">Контакти</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Свържете се с нас</h2>
              <p className="text-muted-foreground mb-4">
                Ако имате въпроси, предложения или нужда от помощ, моля свържете се с нас.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Телеграм</h3>
                <p className="text-muted-foreground">
                  Свържете се с нас чрез Telegram: <a href="https://t.me/moqtglas_bot" className="text-primary hover:underline">@moqtglas_bot</a>
                </p>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
