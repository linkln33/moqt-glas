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

// CRITICAL: Define callback at module level, OUTSIDE component
// This ensures it's always available before script loads
// Modern browsers block third-party cookies which prevents iframe from calling parent
// The callback MUST be defined before the script loads and must remain stable
if (typeof window !== 'undefined') {
  // Initialize callbacks map if it doesn't exist
  if (!(window as any).__telegramAuthCallbacks) {
    (window as any).__telegramAuthCallbacks = new Map();
  }
  
  // Define the global callback ONCE at module level
  // This ensures it exists before any component mounts
  // CRITICAL: Modern browsers block third-party cookies which prevents iframe from calling parent
  // This callback must be stable and always available
  if (!(window as any).handleTelegramAuth) {
    (window as any).handleTelegramAuth = function(user: TelegramAuthData) {
      
      // Trigger a custom event that components can listen to
      // This works even if direct function calls are blocked
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('telegram-auth', { 
          detail: user 
        }));
      }
      
      // Also try direct callback (may be blocked by browser)
      const callbacks = (window as any).__telegramAuthCallbacks;
      if (callbacks && callbacks instanceof Map && callbacks.size > 0) {
        const lastCallback = Array.from(callbacks.values())[callbacks.size - 1];
        if (typeof lastCallback === 'function') {
          try {
            lastCallback(user);
          } catch (error) {
            console.error('Error in direct callback:', error);
          }
        }
      }
      
      // Fallback to old method
      const latestOnAuth = (window as any).__latestTelegramOnAuth;
      if (typeof latestOnAuth === 'function') {
        try {
          latestOnAuth(user);
        } catch (error) {
          console.error('Error in fallback callback:', error);
        }
      }
    };
  }
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

  // Listen for Telegram auth event (works even if direct callback is blocked)
  useEffect(() => {
    if (!mounted) return;

    const handleTelegramAuthEvent = (event: CustomEvent) => {
      const user = event.detail as TelegramAuthData;
      callbackCalledRef.current = true;
      setCallbackReceived(true);
      
      if (user && user.id && user.hash) {
        onAuth(user);
      }
    };
    
    // Listen for postMessage from iframe (fallback if direct callback blocked)
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from Telegram's domain
      if (event.origin !== 'https://oauth.telegram.org') return;
      
      if (event.data && event.data.type === 'telegram-auth' && event.data.user) {
        callbackCalledRef.current = true;
        setCallbackReceived(true);
        onAuth(event.data.user);
      }
    };
    
    window.addEventListener('telegram-auth', handleTelegramAuthEvent as EventListener);
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('telegram-auth', handleTelegramAuthEvent as EventListener);
      window.removeEventListener('message', handleMessage);
    };
  }, [mounted, onAuth]);

  useEffect(() => {
    if (!mounted) return;

    // CRITICAL: Store callback reference in a Map for multiple instances
    // Use a unique ID for this component instance
    const callbackId = `telegram_auth_${Date.now()}_${Math.random()}`;
    
    // Store the onAuth callback
    if (!(window as any).__telegramAuthCallbacks) {
      (window as any).__telegramAuthCallbacks = new Map();
        }
    (window as any).__telegramAuthCallbacks.set(callbackId, onAuth);
    
    // The callback is already defined at module level
    // Just ensure our onAuth is stored in the callbacks map
    // This allows the global callback to find and call it
    
    // Always update the stored reference (for compatibility with fallback)
    (window as any).__latestTelegramOnAuth = onAuth;
    
    if (!containerRef.current) return;
    
    // Double-check callback is accessible (critical check)
    if (typeof (window as any).handleTelegramAuth !== 'function') {
      console.error('CRITICAL: handleTelegramAuth is not a function on window! Attempting to recreate callback...');
      // Try to recreate it
      (window as any).handleTelegramAuth = function(user: TelegramAuthData) {
        const latestOnAuth = (window as any).__latestTelegramOnAuth || onAuth;
        if (typeof latestOnAuth === 'function') {
          latestOnAuth(user);
        }
      };
    }

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
    // IMPORTANT: Use redirect method (data-auth-url) instead of callback (data-onauth)
    // This works even when browsers block third-party cookies
    const cacheBuster = Date.now();
    const script = document.createElement('script');
    script.src = `https://telegram.org/js/telegram-widget.js?22&cb=${cacheBuster}`;
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large');
    // Use redirect method - more reliable than callback in modern browsers
    const callbackUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/api/auth/telegram/callback`
      : '/api/auth/telegram/callback';
    script.setAttribute('data-auth-url', callbackUrl);
    script.setAttribute('data-request-access', 'write');
    script.async = true;
    
    // Verify callback exists before loading script
    if (typeof (window as any).handleTelegramAuth !== 'function') {
      console.error('CRITICAL: handleTelegramAuth not found before script load!');
      setDomainError(true);
      return;
    }

    // Error handling for script load
    script.onerror = () => {
      console.error('❌ Failed to load Telegram widget script');
      setDomainError(true);
    };

    script.onload = () => {
      // CRITICAL: Re-verify callback is accessible after script loads
      // The script might have checked for it during load
      if (typeof (window as any).handleTelegramAuth !== 'function') {
        console.error('CRITICAL: Callback lost after script load! Recreating...');
        (window as any).handleTelegramAuth = function(user: TelegramAuthData) {
          const latestOnAuth = (window as any).__latestTelegramOnAuth || onAuth;
          if (typeof latestOnAuth === 'function') {
            latestOnAuth(user);
          }
        };
      }
      
      // Wait a bit for widget to render, then check for button
      setTimeout(() => {
        const widgetContainer = containerRef.current;
        if (widgetContainer) {
          // Check for iframe (Telegram widget uses iframe)
          const iframe = widgetContainer.querySelector('iframe');
          if (iframe) {
            setWidgetLoaded(true);
            setDomainError(false);
            
            // Listen for iframe load
            iframe.onload = () => {
              setWidgetLoaded(true);
            };
            
            iframe.onerror = () => {
              console.error('Iframe load error');
              setDomainError(true);
              setWidgetLoaded(false);
            };
          } else {
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
            console.error('Domain error detected in widget');
            setDomainError(true);
            if (errorCheckIntervalRef.current) {
              clearInterval(errorCheckIntervalRef.current);
              errorCheckIntervalRef.current = null;
            }
          }
        }
      }, 2000);
      
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
      // Remove this instance's callback from the map
      if ((window as any).__telegramAuthCallbacks && callbackId) {
        (window as any).__telegramAuthCallbacks.delete(callbackId);
      }
      // DON'T delete the global callback - keep it alive for Telegram iframe
      // The callback must persist even if component unmounts temporarily
      // Update it to use the latest available callback
      const callbacks = (window as any).__telegramAuthCallbacks;
      if (callbacks && callbacks instanceof Map && callbacks.size > 0) {
        const lastCallback = Array.from(callbacks.values())[callbacks.size - 1];
        if (typeof lastCallback === 'function') {
          (window as any).handleTelegramAuth = function(user: TelegramAuthData) {
            lastCallback(user);
          };
        }
      } else if ((window as any).__latestTelegramOnAuth) {
        (window as any).handleTelegramAuth = function(user: TelegramAuthData) {
          const latestOnAuth = (window as any).__latestTelegramOnAuth;
          if (latestOnAuth && typeof latestOnAuth === 'function') {
            latestOnAuth(user);
          }
        };
      }
      // Note: We intentionally DON'T delete the callback here
      // Telegram iframe might call it even after component cleanup
    };
  }, [botName, onAuth, mounted]);
  
  // Cleanup on full unmount (page unload)
  useEffect(() => {
    return () => {
      // Only cleanup on actual page unload
      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', () => {
        if ((window as any).handleTelegramAuth) {
          delete (window as any).handleTelegramAuth;
        }
        if ((window as any).__latestTelegramOnAuth) {
          delete (window as any).__latestTelegramOnAuth;
        }
        });
      }
    };
  }, []);

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
