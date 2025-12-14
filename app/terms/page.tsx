import { Metadata } from 'next';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';

export const metadata: Metadata = {
  title: 'Условия за използване - Моят Глас',
  description: 'Условия за използване на платформата',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="text-3xl">Условия за използване</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Общи условия</h2>
              <p className="text-muted-foreground mb-4">
                Използвайки тази платформа, вие се съгласявате със следните условия.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">1. Използване на платформата</h3>
                <p className="text-muted-foreground">
                  Платформата е предназначена за демократично гласуване. Всеки потребител има право на един глас на анкета.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">2. Отговорност</h3>
                <p className="text-muted-foreground">
                  Потребителите са отговорни за съдържанието на създадените от тях анкети.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">3. Забрана за злоупотреба</h3>
                <p className="text-muted-foreground">
                  Забранено е използването на платформата за нелегални или неетични цели.
                </p>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
