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

  // Only check client-side after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !mounted) return;

    // Define global callback FIRST, before loading script
    // This ensures it's available when Telegram calls it
    // Use a wrapper to ensure we always have the latest onAuth reference
    const callbackWrapper = (user: TelegramAuthData) => {
      callbackCalledRef.current = true;
      console.log('🔵 Telegram auth callback received:', {
        id: user?.id,
        first_name: user?.first_name,
        hasHash: !!user?.hash,
        keys: user ? Object.keys(user) : [],
        timestamp: new Date().toISOString(),
      });
      
      if (!user || !user.id || !user.hash) {
        console.error('❌ Invalid user data in callback:', user);
        setDomainError(true);
        return;
      }
      
      try {
        console.log('🔵 Calling onAuth callback...', {
          onAuthType: typeof onAuth,
          onAuthExists: !!onAuth,
        });
        setDomainError(false);
        if (errorCheckIntervalRef.current) {
          clearInterval(errorCheckIntervalRef.current);
          errorCheckIntervalRef.current = null;
        }
        
        // Call the onAuth prop - this should trigger handleTelegramAuth in login page
        if (typeof onAuth === 'function') {
          onAuth(user);
          console.log('✅ onAuth callback completed');
        } else {
          console.error('❌ onAuth is not a function!', { onAuth });
          setDomainError(true);
        }
      } catch (error) {
        console.error('❌ Error in Telegram auth callback:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        setDomainError(true);
      }
    };
    
    // Store the callback on window
    (window as any).handleTelegramAuth = callbackWrapper;
    
    // Also store a reference to the latest onAuth in case it changes
    (window as any).__latestTelegramOnAuth = onAuth;
    
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
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'handleTelegramAuth');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

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
      });
      
      // Monitor for domain errors after script loads
      errorCheckIntervalRef.current = setInterval(() => {
        const widgetContainer = containerRef.current;
        if (widgetContainer) {
          const errorText = widgetContainer.textContent || '';
          if (errorText.includes('domain') || errorText.includes('invalid') || errorText.includes('Bot domain')) {
            console.error('❌ Domain error detected in widget:', errorText);
            setDomainError(true);
            if (errorCheckIntervalRef.current) {
              clearInterval(errorCheckIntervalRef.current);
              errorCheckIntervalRef.current = null;
            }
          }
        }
      }, 1000);
      
      // Also check if callback was called after a delay (for debugging)
      setTimeout(() => {
        if (!callbackCalledRef.current) {
          console.warn('⚠️ Callback not called yet after 5 seconds. This might indicate the widget button was not clicked or there\'s an issue.');
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
      // Update the callback to use latest onAuth before cleanup
      if ((window as any).__latestTelegramOnAuth) {
        (window as any).handleTelegramAuth = (user: TelegramAuthData) => {
          const latestOnAuth = (window as any).__latestTelegramOnAuth;
          if (latestOnAuth) {
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
          <p className="text-sm font-semibold text-yellow-300 mb-2">⚠️ Домейн не е конфигуриран за localhost</p>
          <p className="text-xs text-yellow-200/80 mb-3">
            Telegram Login Widget изисква HTTPS. За локална разработка:
          </p>
          <ol className="text-xs text-yellow-200/70 space-y-1.5 list-decimal list-inside mb-3">
            <li>Инсталирайте <strong>ngrok</strong>: <code className="bg-yellow-500/20 px-1 rounded">brew install ngrok</code></li>
            <li>Стартирайте тунел: <code className="bg-yellow-500/20 px-1 rounded">ngrok http 3000</code></li>
            <li>Задайте домейна в <a href="https://t.me/botfather" target="_blank" rel="noopener noreferrer" className="underline">@BotFather</a> с <code className="bg-yellow-500/20 px-1 rounded">/setdomain</code></li>
            <li>Отворете приложението чрез ngrok URL (не localhost)</li>
          </ol>
          <p className="text-xs text-yellow-200/60">
            Или тествайте след като разгърнете в production.
          </p>
        </div>
      )}
      <div 
        ref={containerRef} 
        style={{ minHeight: '40px' }}
      />
    </div>
  );
}
