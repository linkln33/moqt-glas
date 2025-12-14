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
  const [loadingStep, setLoadingStep] = useState<string>('');

  const handleTelegramAuth = async (authData: any) => {
    console.log('handleTelegramAuth called with:', {
      hasData: !!authData,
      id: authData?.id,
      first_name: authData?.first_name,
      hasHash: !!authData?.hash,
      keys: authData ? Object.keys(authData) : [],
    });

    setLoading(true);
    setError(null);
    setLoadingStep('Проверка на данните...');

    try {
      // Validate auth data structure
      if (!authData || !authData.id || !authData.hash) {
        console.error('Invalid auth data structure:', authData);
        throw new Error('Невалидни данни от Telegram. Моля, опитайте отново.');
      }

      setLoadingStep('Изпращане към сървъра...');
      console.log('Sending Telegram auth data to server:', {
        id: authData.id,
        first_name: authData.first_name,
        username: authData.username,
        hasHash: !!authData.hash,
        auth_date: authData.auth_date,
      });

      // Use absolute URL in production to avoid path issues
      const apiUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/api/auth/telegram/verify`
        : '/api/auth/telegram/verify';

      console.log('🌐 Fetching from:', apiUrl);

      let response: Response;
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(authData),
        });
        console.log('📡 Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
        });
      } catch (networkError: any) {
        console.error('❌ Network error:', networkError);
        throw new Error(`Грешка при свързване със сървъра: ${networkError.message || 'Мрежова грешка'}`);
      }

      setLoadingStep('Обработка на отговора...');

      // Check if response is ok before parsing JSON
      let result;
      try {
        const text = await response.text();
        console.log('Response text:', text.substring(0, 200));
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Невалиден отговор от сървъра. Моля, опитайте отново.');
      }

      if (!response.ok) {
        console.error('❌ Auth verification failed:', {
          status: response.status,
          statusText: response.statusText,
          result,
        });
        const errorMessage = result?.error || `Неуспешна автентификация (${response.status})`;
        throw new Error(errorMessage);
      }

      console.log('✅ Auth verification successful:', {
        success: result.success,
        hasUser: !!result.user,
        userId: result.user?.id,
      });

      if (!result.success || !result.user) {
        console.error('❌ Invalid response format:', {
          result,
          hasSuccess: 'success' in result,
          hasUser: 'user' in result,
        });
        throw new Error('Невалиден отговор от сървъра');
      }

      setLoadingStep('Запазване на сесията...');

      // Store auth data in localStorage
      try {
        localStorage.setItem('telegram_auth', JSON.stringify(authData));
        localStorage.setItem('telegram_id', result.user.telegramId.toString());
        localStorage.setItem('user_id', result.user.id);
        localStorage.setItem('user_role', result.user.role || 'voter');
        
        console.log('✅ Auth successful, stored in localStorage:', {
          userId: result.user.id,
          telegramId: result.user.telegramId,
          role: result.user.role,
        });
      } catch (storageError) {
        console.error('❌ Failed to store in localStorage:', storageError);
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
      console.log('🔄 Redirecting to /elections...');
      
      // Redirect to elections
      try {
        router.push('/elections');
        router.refresh(); // Force refresh to update nav state
        
        // Also try window.location as fallback
        setTimeout(() => {
          if (window.location.pathname === '/login') {
            console.warn('Router push may have failed, using window.location');
            window.location.href = '/elections';
          }
        }, 1000);
      } catch (redirectError) {
        console.error('❌ Redirect error:', redirectError);
        // Fallback to window.location
        window.location.href = '/elections';
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Грешка при автентификация. Моля, опитайте отново.');
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
                <div className="w-full bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-xs text-blue-200/80 text-center">
                    💡 Ако прозорецът се появява и изчезва, проверете дали домейнът е зададен в{' '}
                    <a href="https://t.me/botfather" target="_blank" rel="noopener noreferrer" className="underline font-semibold">@BotFather</a>
                    {' '}с команда <code className="bg-blue-500/20 px-1 rounded">/setdomain</code>
                  </p>
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
