'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TelegramLogin } from '@/components/telegram-login';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTelegramAuth = async (authData: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/telegram/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Неуспешна автентификация');
      }

      // Store auth data in localStorage
      localStorage.setItem('telegram_auth', JSON.stringify(authData));
      localStorage.setItem('telegram_id', result.user.telegramId.toString());

      // Redirect to elections
      router.push('/elections');
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Грешка при автентификация');
    } finally {
      setLoading(false);
    }
  };

  const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME;

  if (!botName) {
    return (
      <div className="min-h-screen flex items-center justify-center py-8">
        <div className="container mx-auto px-4 max-w-md">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Грешка в конфигурацията</GlassCardTitle>
              <GlassCardDescription>
                Telegram ботът не е конфигуриран
              </GlassCardDescription>
            </GlassCardHeader>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-8">
      <div className="container mx-auto px-4 max-w-md">
        <GlassCard variant="gradient" className="shine">
          <GlassCardHeader className="text-center">
            <GlassCardTitle className="text-3xl text-white mb-2">
              Влез с Telegram
            </GlassCardTitle>
            <GlassCardDescription className="text-white/80">
              Използвайте Telegram, за да влезете и да гласувате
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="space-y-6">
            {error && (
              <GlassCard className="border-red-500/50 bg-red-500/10">
                <GlassCardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <span className="text-red-400 font-semibold">{error}</span>
                  </div>
                </GlassCardContent>
              </GlassCard>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                <p className="mt-4 text-white/80">Проверка на идентичността...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-6">
                <div className="w-full">
                  <TelegramLogin
                    botName={botName}
                    onAuth={handleTelegramAuth}
                    className="w-full"
                  />
                </div>
                <p className="text-xs text-center text-white/60 px-4">
                  С натискане на бутона се съгласявате с условията за използване
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-white/20">
              <Button
                variant="ghost"
                className="w-full text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => router.push('/')}
              >
                ← Назад
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
