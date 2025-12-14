import { Metadata } from 'next';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';

export const metadata: Metadata = {
  title: 'Помощ - Моят Глас',
  description: 'Помощ и инструкции',
};

export default function HelpPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="text-3xl">Помощ</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Как да използвате платформата</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">1. Вход в системата</h3>
                  <p className="text-muted-foreground">
                    Използвайте Telegram за вход. Натиснете бутона "Влез" и следвайте инструкциите.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">2. Гласуване</h3>
                  <p className="text-muted-foreground">
                    Изберете активна анкета от началната страница и следвайте инструкциите за гласуване.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">3. Създаване на анкета</h3>
                  <p className="text-muted-foreground">
                    Влезте в системата и използвайте бутона "Създай" за да създадете нова анкета.
                  </p>
                </div>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
