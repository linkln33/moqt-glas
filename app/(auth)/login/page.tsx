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
      console.log('✅ Telegram auth successful via redirect:', { userId, telegramId });
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
        
        console.log('✅ Session stored successfully');
        
        // Trigger custom event to update nav
        window.dispatchEvent(new CustomEvent('auth-state-changed', { 
          detail: { isLoggedIn: true } 
        }));

        // Small delay then redirect
        setTimeout(() => {
          router.push('/elections');
        }, 500);
      } catch (err) {
        console.error('❌ Failed to store session:', err);
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
    console.log('🟢 ========================================');
    console.log('🟢 handleTelegramAuth CALLED IN LOGIN PAGE');
    console.log('🟢 ========================================');
    console.log('🟢 Received auth data:', {
      hasData: !!authData,
      id: authData?.id,
      first_name: authData?.first_name,
      last_name: authData?.last_name,
      username: authData?.username,
      hasHash: !!authData?.hash,
      hashLength: authData?.hash?.length || 0,
      auth_date: authData?.auth_date,
      keys: authData ? Object.keys(authData) : [],
      fullData: authData,
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
      console.log('📤 Sending Telegram auth data to server:', {
        id: authData.id,
        first_name: authData.first_name,
        last_name: authData.last_name,
        username: authData.username,
        photo_url: authData.photo_url ? 'present' : 'missing',
        auth_date: authData.auth_date,
        hash: authData.hash ? authData.hash.substring(0, 16) + '...' : 'missing',
        hashLength: authData.hash?.length || 0,
        allKeys: Object.keys(authData),
        dataTypes: Object.entries(authData).reduce((acc, [key, value]) => {
          acc[key] = typeof value;
          return acc;
        }, {} as Record<string, string>),
      });

      // Use absolute URL in production to avoid path issues
      const apiUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/api/auth/telegram/verify`
        : '/api/auth/telegram/verify';

      console.log('🌐 Fetching from:', apiUrl);

      let response: Response;
      try {
        console.log('🌐 ========================================');
        console.log('🌐 SENDING REQUEST TO SERVER');
        console.log('🌐 ========================================');
        console.log('🌐 URL:', apiUrl);
        console.log('🌐 Method: POST');
        console.log('🌐 Body:', JSON.stringify(authData, null, 2));
        
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(authData),
        });
        
        console.log('📡 ========================================');
        console.log('📡 RESPONSE RECEIVED FROM SERVER');
        console.log('📡 ========================================');
        console.log('📡 Status:', response.status);
        console.log('📡 Status Text:', response.statusText);
        console.log('📡 OK:', response.ok);
        console.log('📡 Headers:', Object.fromEntries(response.headers.entries()));
      } catch (networkError: any) {
        console.error('❌ ========================================');
        console.error('❌ NETWORK ERROR');
        console.error('❌ ========================================');
        console.error('❌ Error:', networkError);
        console.error('❌ Error message:', networkError?.message);
        console.error('❌ Error name:', networkError?.name);
        console.error('❌ Error stack:', networkError?.stack);
        throw new Error(`Грешка при свързване със сървъра: ${networkError.message || 'Мрежова грешка'}`);
      }

      setLoadingStep('Обработка на отговора...');

      // Parse response - check status first, then parse
      let result;
      const text = await response.text();
      console.log('📄 ========================================');
      console.log('📄 RESPONSE TEXT');
      console.log('📄 ========================================');
      console.log('📄 Full response text:', text);
      console.log('📄 Response length:', text.length);
      console.log('📄 First 500 chars:', text.substring(0, 500));
      
      try {
        result = JSON.parse(text);
        console.log('✅ ========================================');
        console.log('✅ RESPONSE PARSED SUCCESSFULLY');
        console.log('✅ ========================================');
        console.log('✅ Parsed result:', JSON.stringify(result, null, 2));
      } catch (parseError) {
        console.error('❌ ========================================');
        console.error('❌ FAILED TO PARSE RESPONSE AS JSON');
        console.error('❌ ========================================');
        console.error('❌ Parse error:', parseError);
        console.error('❌ Response text (first 500 chars):', text.substring(0, 500));
        console.error('❌ Response status:', response.status);
        console.error('❌ Response status text:', response.statusText);
        throw new Error('Невалиден отговор от сървъра. Моля, опитайте отново.');
      }

      // Check response status AFTER parsing (so we can show error message)
      if (!response.ok) {
        console.error('❌ ========================================');
        console.error('❌ AUTH VERIFICATION FAILED');
        console.error('❌ ========================================');
        console.error('❌ Status:', response.status);
        console.error('❌ Status Text:', response.statusText);
        console.error('❌ Response result:', result);
        console.error('❌ Full response text:', text);
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
      console.log('📊 Final state check:', {
        hasTelegramAuth: !!localStorage.getItem('telegram_auth'),
        hasUserId: !!localStorage.getItem('user_id'),
        hasTelegramId: !!localStorage.getItem('telegram_id'),
        currentPath: window.location.pathname,
      });
      
      // Use window.location for immediate redirect (more reliable than router.push)
      // This ensures the redirect happens even if there are React state issues
      window.location.href = '/elections';
      
      // Also try router.push as backup (though window.location should work)
      try {
        router.push('/elections');
        router.refresh();
      } catch (redirectError) {
        console.warn('Router push error (using window.location instead):', redirectError);
      }
    } catch (err: any) {
      console.error('❌ ========================================');
      console.error('❌ AUTH ERROR IN handleTelegramAuth');
      console.error('❌ ========================================');
      console.error('❌ Error:', err);
      console.error('❌ Error message:', err?.message);
      console.error('❌ Error stack:', err?.stack);
      console.error('❌ Full error object:', JSON.stringify(err, null, 2));
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
