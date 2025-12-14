import { Metadata } from 'next';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';

export const metadata: Metadata = {
  title: 'Често задавани въпроси - Моят Глас',
  description: 'Често задавани въпроси',
};

export default function FAQPage() {
  const faqs = [
    {
      question: 'Как да вляза в системата?',
      answer: 'Използвайте Telegram за вход. Натиснете бутона "Влез" и следвайте инструкциите за автентификация.',
    },
    {
      question: 'Мога ли да гласувам повече от веднъж?',
      answer: 'Не, всеки потребител може да гласува само веднъж на анкета. Това се гарантира чрез Telegram автентификация.',
    },
    {
      question: 'Как да създам анкета?',
      answer: 'Влезте в системата и използвайте бутона "Създай" в навигацията. Следвайте стъпките за създаване на нова анкета.',
    },
    {
      question: 'Са ли моите гласове анонимни?',
      answer: 'Да, вашите гласове са анонимни. Резултатите показват само общите данни, без да разкриват лична информация.',
    },
  ];

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="text-3xl">Често задавани въпроси</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-6">
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-border/50 pb-4 last:border-0">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
