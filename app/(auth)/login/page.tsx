'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TelegramLogin } from '@/components/telegram-login';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Грешка в конфигурацията</CardTitle>
            <CardDescription>
              Telegram ботът не е конфигуриран
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Влез с Telegram</CardTitle>
          <CardDescription>
            Използвайте Telegram, за да влезете и да гласувате
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-sm text-gray-600">Проверка на идентичността...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <TelegramLogin
                botName={botName}
                onAuth={handleTelegramAuth}
                className="w-full"
              />
              <p className="text-xs text-center text-gray-500 px-4">
                С натискане на бутона се съгласявате с условията за използване
              </p>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => router.push('/')}
            >
              Назад
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
