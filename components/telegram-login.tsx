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
    // CRITICAL: Must be a direct function on window, not a wrapper
    // Telegram widget requires the function to be directly accessible
    (window as any).handleTelegramAuth = function(user: TelegramAuthData) {
      callbackCalledRef.current = true;
      console.log('🔵 Telegram auth callback received:', {
        id: user?.id,
        first_name: user?.first_name,
        hasHash: !!user?.hash,
        keys: user ? Object.keys(user) : [],
        timestamp: new Date().toISOString(),
        callbackType: typeof (window as any).handleTelegramAuth,
      });
      
      if (!user || !user.id || !user.hash) {
        console.error('❌ Invalid user data in callback:', user);
        setDomainError(true);
        return;
      }
      
      try {
        // Get the latest onAuth from the stored reference
        const latestOnAuth = (window as any).__latestTelegramOnAuth || onAuth;
        
        console.log('🔵 Calling onAuth callback...', {
          onAuthType: typeof latestOnAuth,
          onAuthExists: !!latestOnAuth,
          hasStoredReference: !!(window as any).__latestTelegramOnAuth,
        });
        
        setDomainError(false);
        if (errorCheckIntervalRef.current) {
          clearInterval(errorCheckIntervalRef.current);
          errorCheckIntervalRef.current = null;
        }
        
        // Call the onAuth prop - this should trigger handleTelegramAuth in login page
        if (typeof latestOnAuth === 'function') {
          latestOnAuth(user);
          console.log('✅ onAuth callback completed');
        } else {
          console.error('❌ onAuth is not a function!', { latestOnAuth });
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
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
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
      });
      
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
            
            // Listen for iframe load
            iframe.onload = () => {
              console.log('✅ Iframe loaded');
            };
            
            iframe.onerror = () => {
              console.error('❌ Iframe load error');
              setDomainError(true);
            };
          } else {
            console.warn('⚠️ No iframe found in widget container');
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
      
      // Also check if callback was called after a delay (for debugging)
      setTimeout(() => {
        if (!callbackCalledRef.current) {
          console.warn('⚠️ Callback not called yet after 5 seconds. This might indicate:');
          console.warn('   1. Widget button was not clicked');
          console.warn('   2. Domain is not configured in BotFather');
          console.warn('   3. Domain configuration hasn\'t propagated yet (wait 5-10 min)');
          console.warn('   4. Domain format is incorrect in BotFather');
          console.warn('   Current URL:', window.location.href);
          console.warn('   Expected domain in BotFather: moqt-glas.onrender.com (NO https://)');
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
            <li><strong>Third-party cookies:</strong> Проверете дали браузърът не блокира third-party cookies</li>
            <li><strong>HTTPS:</strong> Уверете се, че сайтът е на HTTPS</li>
          </ol>
          <p className="text-xs text-yellow-200/60 mt-3">
            Текущ URL: <code className="bg-yellow-500/20 px-1 rounded">{typeof window !== 'undefined' ? window.location.href : 'N/A'}</code>
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
