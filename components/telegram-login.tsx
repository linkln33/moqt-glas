'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginProps {
  botName: string;
  onAuth: (data: TelegramAuthData) => void;
  className?: string;
}

export function TelegramLogin({ botName, onAuth, className }: TelegramLoginProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const errorCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const callbackCalledRef = useRef(false);
  const router = useRouter();
  const [domainError, setDomainError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [callbackReceived, setCallbackReceived] = useState(false);

  // Only check client-side after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !mounted) return;

    // Define global callback FIRST, before loading script
    // CRITICAL: Must be a direct function on window, not a wrapper
    // Telegram widget requires the function to be directly accessible
    (window as any).handleTelegramAuth = function(user: TelegramAuthData) {
      callbackCalledRef.current = true;
      setCallbackReceived(true); // Show visual indicator
      console.log('🔵 ========================================');
      console.log('🔵 Telegram auth callback RECEIVED!');
      console.log('🔵 ========================================');
      console.log('🔵 Callback data:', {
        id: user?.id,
        first_name: user?.first_name,
        last_name: user?.last_name,
        username: user?.username,
        hasHash: !!user?.hash,
        hashLength: user?.hash?.length || 0,
        auth_date: user?.auth_date,
        keys: user ? Object.keys(user) : [],
        timestamp: new Date().toISOString(),
        callbackType: typeof (window as any).handleTelegramAuth,
      });
      
      if (!user || !user.id || !user.hash) {
        console.error('❌ ========================================');
        console.error('❌ INVALID USER DATA IN CALLBACK');
        console.error('❌ ========================================');
        console.error('❌ Received data:', user);
        console.error('❌ Missing fields:', {
          hasId: !!user?.id,
          hasHash: !!user?.hash,
          hasFirstName: !!user?.first_name,
        });
        setDomainError(true);
        // Show alert to user
        alert('Грешка: Невалидни данни от Telegram. Моля, опитайте отново.');
        return;
      }
      
      try {
        // Get the latest onAuth from the stored reference
        const latestOnAuth = (window as any).__latestTelegramOnAuth || onAuth;
        
        console.log('🔵 ========================================');
        console.log('🔵 CALLING onAuth CALLBACK...');
        console.log('🔵 ========================================');
        console.log('🔵 onAuth status:', {
          onAuthType: typeof latestOnAuth,
          onAuthExists: !!latestOnAuth,
          hasStoredReference: !!(window as any).__latestTelegramOnAuth,
          onAuthIsFunction: typeof latestOnAuth === 'function',
        });
        
        setDomainError(false);
        if (errorCheckIntervalRef.current) {
          clearInterval(errorCheckIntervalRef.current);
          errorCheckIntervalRef.current = null;
        }
        
        // Call the onAuth prop - this should trigger handleTelegramAuth in login page
        if (typeof latestOnAuth === 'function') {
          console.log('🔵 Executing onAuth function now...');
          try {
            latestOnAuth(user);
            console.log('✅ ========================================');
            console.log('✅ onAuth callback COMPLETED successfully');
            console.log('✅ ========================================');
          } catch (onAuthError) {
            console.error('❌ ========================================');
            console.error('❌ ERROR IN onAuth FUNCTION');
            console.error('❌ ========================================');
            console.error('❌ Error:', onAuthError);
            console.error('❌ Error details:', {
              message: onAuthError instanceof Error ? onAuthError.message : String(onAuthError),
              stack: onAuthError instanceof Error ? onAuthError.stack : undefined,
            });
            setDomainError(true);
            alert('Грешка при обработка на данните. Проверете конзолата за подробности.');
            throw onAuthError; // Re-throw to be caught by outer try-catch
          }
        } else {
          console.error('❌ ========================================');
          console.error('❌ onAuth IS NOT A FUNCTION!');
          console.error('❌ ========================================');
          console.error('❌ onAuth value:', latestOnAuth);
          console.error('❌ onAuth type:', typeof latestOnAuth);
          setDomainError(true);
          alert('Грешка: onAuth не е функция. Моля, презаредете страницата.');
        }
      } catch (error) {
        console.error('❌ ========================================');
        console.error('❌ UNEXPECTED ERROR IN TELEGRAM AUTH CALLBACK');
        console.error('❌ ========================================');
        console.error('❌ Error:', error);
        console.error('❌ Error details:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        setDomainError(true);
        alert('Грешка при автентификация. Проверете конзолата за подробности.');
      }
    };
    
    // Store a reference to the latest onAuth in case it changes
    (window as any).__latestTelegramOnAuth = onAuth;
    
    // Verify the callback is accessible globally (required by Telegram)
    if (typeof (window as any).handleTelegramAuth !== 'function') {
      console.error('❌ CRITICAL: handleTelegramAuth is not a function on window!');
      setDomainError(true);
      return;
    }
    
    // Log that callback is set up
    console.log('✅ Telegram callback registered:', {
      callbackExists: !!(window as any).handleTelegramAuth,
      botName,
      onAuthType: typeof onAuth,
    });

    // Clean up any existing script
    const existingScript = containerRef.current.querySelector('script');
    if (existingScript) {
      existingScript.remove();
    }

    // Check if we're on localhost (only after mount)
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isHttps = window.location.protocol === 'https:';

    // Show warning for localhost
    if (isLocalhost && !isHttps) {
      setDomainError(true);
      console.warn('Telegram Login Widget requires HTTPS. For localhost, use ngrok or deploy to production.');
      return;
    }

    // Create script element
    // IMPORTANT: Use the latest widget version and ensure callback name matches exactly
    // Add cache-busting timestamp to force fresh load
    const cacheBuster = Date.now();
    const script = document.createElement('script');
    script.src = `https://telegram.org/js/telegram-widget.js?22&cb=${cacheBuster}`;
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'handleTelegramAuth'); // Must match window function name exactly
    script.setAttribute('data-request-access', 'write');
    script.async = true;
    
    // Verify callback exists before loading script
    if (typeof (window as any).handleTelegramAuth !== 'function') {
      console.error('❌ CRITICAL: handleTelegramAuth not found before script load!');
      setDomainError(true);
      return;
    }
    
    console.log('✅ Callback verified before script load:', {
      callbackExists: typeof (window as any).handleTelegramAuth === 'function',
      callbackName: 'handleTelegramAuth',
      botName,
    });

    // Error handling for script load
    script.onerror = () => {
      console.error('❌ Failed to load Telegram widget script');
      setDomainError(true);
    };

    script.onload = () => {
      console.log('✅ Telegram widget script loaded');
      console.log('📋 Callback check:', {
        callbackExists: !!(window as any).handleTelegramAuth,
        callbackType: typeof (window as any).handleTelegramAuth,
        botName,
        currentUrl: window.location.href,
        hostname: window.location.hostname,
        expectedDomain: 'moqt-glas.onrender.com',
      });
      console.log('💡 If domain was just changed, wait 5-10 minutes for Telegram to propagate');
      console.log('💡 Clear browser cache (Ctrl+Shift+Delete) and try again');
      
      // Wait a bit for widget to render, then check for button
      setTimeout(() => {
        const widgetContainer = containerRef.current;
        if (widgetContainer) {
          const button = widgetContainer.querySelector('iframe') || widgetContainer.querySelector('button') || widgetContainer.querySelector('a');
          console.log('🔍 Widget container check:', {
            hasContainer: !!widgetContainer,
            containerHTML: widgetContainer.innerHTML.substring(0, 200),
            hasButton: !!button,
            buttonType: button?.tagName,
            containerText: widgetContainer.textContent?.substring(0, 100),
          });
          
          // Check for iframe (Telegram widget uses iframe)
          const iframe = widgetContainer.querySelector('iframe');
          if (iframe) {
            console.log('📦 Iframe found:', {
              src: iframe.src,
              width: iframe.width,
              height: iframe.height,
            });
            setWidgetLoaded(true);
            setDomainError(false);
            
            // Listen for iframe load
            iframe.onload = () => {
              console.log('✅ Iframe loaded');
              setWidgetLoaded(true);
            };
            
            iframe.onerror = () => {
              console.error('❌ Iframe load error');
              setDomainError(true);
              setWidgetLoaded(false);
            };
          } else {
            console.warn('⚠️ No iframe found in widget container');
            setWidgetLoaded(false);
            // Only set error if we've waited long enough
            setTimeout(() => {
              if (!widgetContainer.querySelector('iframe')) {
                setDomainError(true);
              }
            }, 3000);
          }
        }
      }, 1000);
      
      // Monitor for domain errors after script loads
      errorCheckIntervalRef.current = setInterval(() => {
        const widgetContainer = containerRef.current;
        if (widgetContainer) {
          const errorText = widgetContainer.textContent || '';
          const innerHTML = widgetContainer.innerHTML || '';
          
          // Check for various error indicators
          if (errorText.includes('domain') || 
              errorText.includes('invalid') || 
              errorText.includes('Bot domain') ||
              innerHTML.includes('domain') ||
              innerHTML.includes('invalid')) {
            console.error('❌ Domain error detected in widget:', {
              text: errorText,
              html: innerHTML.substring(0, 200),
            });
            setDomainError(true);
            if (errorCheckIntervalRef.current) {
              clearInterval(errorCheckIntervalRef.current);
              errorCheckIntervalRef.current = null;
            }
          }
          
          // Log widget state periodically
          const iframe = widgetContainer.querySelector('iframe');
          if (iframe && !callbackCalledRef.current) {
            console.log('📊 Widget state:', {
              iframeSrc: iframe.src,
              containerText: errorText.substring(0, 50),
              callbackCalled: callbackCalledRef.current,
            });
          }
        }
      }, 2000);
      
      // Check if widget is visible and callback status (for debugging)
      setTimeout(() => {
        if (!callbackCalledRef.current) {
          const widgetContainer = containerRef.current;
          const iframe = widgetContainer?.querySelector('iframe');
          const hasWidget = !!iframe;
          const containerText = widgetContainer?.textContent || '';
          const containerHTML = widgetContainer?.innerHTML || '';
          
          console.warn('⚠️ Callback not called yet after 5 seconds.');
          console.warn('   Widget status:', {
            hasIframe: hasWidget,
            iframeSrc: iframe?.src || 'N/A',
            iframeVisible: iframe ? (iframe.offsetWidth > 0 && iframe.offsetHeight > 0) : false,
            iframeWidth: iframe?.offsetWidth || 0,
            iframeHeight: iframe?.offsetHeight || 0,
            containerHasContent: containerText.length > 0,
            containerTextPreview: containerText.substring(0, 100),
          });
          
          if (!hasWidget) {
            console.error('❌ Telegram widget iframe not found! This means domain is NOT configured correctly.');
            console.error('');
            console.error('   ⏰ Domain Propagation Time:');
            console.error('      - Usually: 5-10 minutes');
            console.error('      - Sometimes: up to 30 minutes');
            console.error('      - After setting domain, wait at least 10 minutes');
            console.error('');
            console.error('   🔧 VERIFY domain in BotFather RIGHT NOW:');
            console.error('      1. Open Telegram → @BotFather');
            console.error('      2. Send: /mybots');
            console.error('      3. Select your bot');
            console.error('      4. Click: "Bot Settings" → "Domain"');
            console.error('      5. Should show EXACTLY: moqt-glas.onrender.com');
            console.error('         (NO https://, NO trailing /, NO path)');
            console.error('');
            console.error('   🔧 If domain is wrong or missing:');
            console.error('      1. Send: /setdomain');
            console.error('      2. Select your bot');
            console.error('      3. Enter: moqt-glas.onrender.com');
            console.error('      4. Wait 10-15 minutes for propagation');
            console.error('      5. Clear browser cache and try again');
            console.error('');
            console.error('   🔍 Check iframe in DOM:');
            console.error('      Run: document.querySelector(\'iframe[src*="telegram.org"]\')');
            console.error('      If null → domain not configured or not propagated');
            
            // Check for error messages in container
            if (containerText.includes('domain') || containerText.includes('invalid') || containerText.includes('Bot')) {
              console.error('');
              console.error('   📋 Error message detected in widget:', containerText);
            }
          } else {
            console.warn('   ✅ Widget iframe is loaded! Domain is configured correctly.');
            console.warn('   This warning is NORMAL - it just means you haven\'t clicked the button yet.');
            console.warn('');
            console.warn('   ✅ Next steps:');
            console.warn('      1. Click the Telegram login button (it should be visible)');
            console.warn('      2. Authorize in the Telegram popup');
            console.warn('      3. Callback will be called immediately');
            console.warn('');
            console.warn('   ⚠️ If callback still not called AFTER clicking:');
            console.warn('      - Domain might not have fully propagated (wait 5-10 more min)');
            console.warn('      - Browser might be blocking third-party cookies');
            console.warn('      - Try incognito/private window');
            console.warn('      - Check browser console for errors');
          }
          
          console.warn('');
          console.warn('   📍 Current URL:', window.location.href);
          console.warn('   📍 Expected domain in BotFather: moqt-glas.onrender.com (NO https://)');
          console.warn('   📍 Bot name:', botName);
          console.warn('');
          console.warn('   💡 Quick test: Run this in console to check widget:');
          console.warn('      const iframe = document.querySelector(\'iframe[src*="telegram.org"]\');');
          console.warn('      console.log("Widget found:", !!iframe, "Visible:", iframe?.offsetWidth > 0);');
        }
      }, 5000);
    };

    containerRef.current.appendChild(script);

    return () => {
      if (errorCheckIntervalRef.current) {
        clearInterval(errorCheckIntervalRef.current);
        errorCheckIntervalRef.current = null;
      }
      if (containerRef.current && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      // Update the callback to use latest onAuth before cleanup (keep as function, not arrow)
      if ((window as any).__latestTelegramOnAuth) {
        (window as any).handleTelegramAuth = function(user: TelegramAuthData) {
          const latestOnAuth = (window as any).__latestTelegramOnAuth;
          if (latestOnAuth && typeof latestOnAuth === 'function') {
            latestOnAuth(user);
          }
        };
      }
      // Keep callback for a bit in case Telegram is still processing
      setTimeout(() => {
        if ((window as any).handleTelegramAuth) {
          delete (window as any).handleTelegramAuth;
        }
        if ((window as any).__latestTelegramOnAuth) {
          delete (window as any).__latestTelegramOnAuth;
        }
      }, 10000);
    };
  }, [botName, onAuth, mounted]);

  // Always render the container div to avoid hydration mismatch
  // Only show error message after mount
  return (
    <div className={className}>
      {mounted && domainError && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-sm font-semibold text-yellow-300 mb-2">⚠️ Проблем с Telegram Login Widget</p>
          <p className="text-xs text-yellow-200/80 mb-3">
            Възможни причини:
          </p>
          <ol className="text-xs text-yellow-200/70 space-y-1.5 list-decimal list-inside mb-3">
            <li><strong>Домейн не е зададен в BotFather:</strong> Използвайте <code className="bg-yellow-500/20 px-1 rounded">/setdomain</code> в <a href="https://t.me/botfather" target="_blank" rel="noopener noreferrer" className="underline">@BotFather</a></li>
            <li><strong>Формат на домейна:</strong> Трябва да е точно <code className="bg-yellow-500/20 px-1 rounded">moqt-glas.onrender.com</code> (БЕЗ https://, БЕЗ /)</li>
            <li><strong>Пропагация:</strong> Изчакайте 5-10 минути след задаване на домейна</li>
            <li><strong>Кеш на браузъра:</strong> Изчистете кеша (Ctrl+Shift+Delete) или използвайте инкогнито режим</li>
            <li><strong>Third-party cookies:</strong> Проверете дали браузърът не блокира third-party cookies</li>
            <li><strong>HTTPS:</strong> Уверете се, че сайтът е на HTTPS</li>
          </ol>
          <div className="mt-3 space-y-2">
            <p className="text-xs text-yellow-200/60">
              Текущ URL: <code className="bg-yellow-500/20 px-1 rounded">{typeof window !== 'undefined' ? window.location.href : 'N/A'}</code>
            </p>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }}
              className="text-xs bg-yellow-500/20 hover:bg-yellow-500/30 px-3 py-1.5 rounded transition-colors text-yellow-200"
            >
              🔄 Презареди страницата (за изчистване на кеш)
            </button>
          </div>
        </div>
      )}
      <div 
        ref={containerRef} 
        style={{ minHeight: '40px' }}
      />
      
      {/* Widget Status Indicator - Only show in development or when there's an issue */}
      {mounted && (
        <div className="mt-2 text-xs text-muted-foreground space-y-1">
          {callbackReceived ? (
            <div className="flex items-center gap-2 text-blue-400 animate-pulse">
              <span>🔄</span>
              <span>Данните са получени, обработва се...</span>
            </div>
          ) : widgetLoaded ? (
            <div className="flex items-center gap-2 text-green-400">
              <span>✅</span>
              <span>Widget зареден - Натиснете бутона за вход</span>
            </div>
          ) : domainError ? (
            <div className="flex items-center gap-2 text-yellow-400">
              <span>⚠️</span>
              <span>Изчакайте 10-15 минути след задаване на домейна</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>⏳</span>
              <span>Зареждане на widget...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
