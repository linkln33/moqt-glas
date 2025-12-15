'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TelegramLogin } from '@/components/telegram-login';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('');

  // Handle redirect callback from Telegram (data-auth-url method)
  useEffect(() => {
    const success = searchParams.get('success');
    const userId = searchParams.get('userId');
    const telegramId = searchParams.get('telegramId');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(getErrorMessage(errorParam));
      // Clean URL
      router.replace('/login');
      return;
    }

    if (success === 'true' && userId && telegramId) {
      setLoading(true);
      setLoadingStep('Завършване на влизането...');

      // Store session data
      try {
        const role = searchParams.get('role') || 'voter';
        const firstName = searchParams.get('firstName') || '';
        const lastName = searchParams.get('lastName') || '';
        const username = searchParams.get('username') || '';

        // Store auth data
        localStorage.setItem('user_id', userId);
        localStorage.setItem('telegram_id', telegramId);
        localStorage.setItem('user_role', role);
        
        // Store user info for display
        if (firstName) {
          localStorage.setItem('user_first_name', firstName);
        }
        if (lastName) {
          localStorage.setItem('user_last_name', lastName);
        }
        if (username) {
          localStorage.setItem('user_username', username);
        }

        // Store full auth data for compatibility
        const authData = {
          id: parseInt(telegramId, 10),
          first_name: firstName,
          last_name: lastName || undefined,
          username: username || undefined,
          auth_date: Math.floor(Date.now() / 1000),
          hash: 'redirect-auth', // Placeholder since we already verified
        };
        localStorage.setItem('telegram_auth', JSON.stringify(authData));
        
        // Trigger custom event to update nav
        window.dispatchEvent(new CustomEvent('auth-state-changed', { 
          detail: { isLoggedIn: true } 
        }));

        // Small delay then redirect to feed
          setTimeout(() => {
            router.push('/dashboard');
          }, 500);
      } catch (err) {
        console.error('Failed to store session:', err);
        setError('Грешка при запазване на сесията');
        router.replace('/login');
      }
    }
  }, [searchParams, router]);

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'config':
        return 'Грешка в конфигурацията. Моля, свържете се с администратора.';
      case 'invalid':
        return 'Невалидни данни от Telegram. Моля, опитайте отново.';
      case 'auth':
        return 'Неуспешна автентификация. Моля, опитайте отново.';
      case 'user':
        return 'Грешка при създаване на потребител. Моля, опитайте отново.';
      case 'server':
        return 'Сървърна грешка. Моля, опитайте по-късно.';
      default:
        return 'Възникна грешка. Моля, опитайте отново.';
    }
  };

  const handleTelegramAuth = useCallback(async (authData: any) => {
    setLoading(true);
    setError(null);
    setLoadingStep('Проверка на данните...');

    try {
      // Validate auth data structure
      if (!authData || !authData.id || !authData.hash) {
        console.error('Invalid auth data structure');
        throw new Error('Невалидни данни от Telegram. Моля, опитайте отново.');
      }

      setLoadingStep('Изпращане към сървъра...');

      // Use absolute URL in production to avoid path issues
      const apiUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/api/auth/telegram/verify`
        : '/api/auth/telegram/verify';

      let response: Response;
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(authData),
        });
      } catch (networkError: any) {
        console.error('Network error:', networkError);
        throw new Error(`Грешка при свързване със сървъра: ${networkError.message || 'Мрежова грешка'}`);
      }

      setLoadingStep('Обработка на отговора...');

      // Parse response - check status first, then parse
      let result;
      const text = await response.text();
      
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse response as JSON');
        throw new Error('Невалиден отговор от сървъра. Моля, опитайте отново.');
      }

      // Check response status AFTER parsing (so we can show error message)
      if (!response.ok) {
        const errorMessage = result?.error || `Неуспешна автентификация (${response.status})`;
        throw new Error(errorMessage);
      }

      if (!result.success || !result.user) {
        console.error('Invalid response format');
        throw new Error('Невалиден отговор от сървъра');
      }

      setLoadingStep('Запазване на сесията...');

      // Store auth data in localStorage
      try {
        localStorage.setItem('telegram_auth', JSON.stringify(authData));
        localStorage.setItem('telegram_id', result.user.telegramId.toString());
        localStorage.setItem('user_id', result.user.id);
        localStorage.setItem('user_role', result.user.role || 'voter');
      } catch (storageError) {
        console.error('Failed to store in localStorage:', storageError);
        throw new Error('Грешка при запазване на сесията');
      }

      setLoadingStep('Актуализиране на навигацията...');

      // Trigger custom event to update nav in same window
      window.dispatchEvent(new CustomEvent('auth-state-changed', { 
        detail: { isLoggedIn: true } 
      }));

      // Small delay to ensure localStorage is set and nav updates
      await new Promise(resolve => setTimeout(resolve, 300));

      setLoadingStep('Пренасочване...');
      
      // Use window.location for immediate redirect (more reliable than router.push)
      // This ensures the redirect happens even if there are React state issues
      window.location.href = '/elections';
      
      // Also try router.push as backup (though window.location should work)
      try {
        router.push('/elections');
        router.refresh();
      } catch (redirectError) {
        // Router push error - window.location should handle redirect
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Грешка при автентификация. Моля, опитайте отново.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  }, [router]);

  const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME;

  if (!botName) {
    return (
      <div className="min-h-screen flex items-center justify-center py-8">
        <div className="container mx-auto px-4 max-w-md">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="text-red-400">⚠️ Грешка в конфигурацията</GlassCardTitle>
              <GlassCardDescription>
                Telegram ботът не е конфигуриран
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold">За да конфигурирате Telegram бот:</p>
                <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                  <li>Създайте бот чрез <a href="https://t.me/botfather" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@BotFather</a> в Telegram</li>
                  <li>Добавете в <code className="bg-background px-1.5 py-0.5 rounded text-xs">.env.local</code>:
                    <pre className="mt-2 p-2 bg-background rounded text-xs overflow-x-auto">
{`NEXT_PUBLIC_TELEGRAM_BOT_NAME=your_bot_name
TELEGRAM_BOT_TOKEN=your_bot_token`}
                    </pre>
                  </li>
                  <li>Рестартирайте сървъра за разработка</li>
                </ol>
                <p className="text-xs text-muted-foreground mt-4">
                  Вижте <a href="https://github.com/linkln33/moqt-glas/blob/main/SETUP.md" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">SETUP.md</a> за подробни инструкции.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/')}
              >
                ← Назад към началото
              </Button>
            </GlassCardContent>
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
                <p className="mt-4 text-white/80">{loadingStep || 'Проверка на идентичността...'}</p>
                {loadingStep && (
                  <p className="mt-2 text-xs text-white/60">Моля изчакайте...</p>
                )}
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="text-white">Зареждане...</div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
