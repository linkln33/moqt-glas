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
  const router = useRouter();
  const [domainError, setDomainError] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only check client-side after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !mounted) return;

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
      console.error('Failed to load Telegram widget script');
      setDomainError(true);
    };

    // Monitor for domain errors
    const checkForError = setInterval(() => {
      const widgetContainer = containerRef.current;
      if (widgetContainer) {
        const errorText = widgetContainer.textContent || '';
        if (errorText.includes('domain') || errorText.includes('invalid')) {
          setDomainError(true);
          clearInterval(checkForError);
        }
      }
    }, 1000);

    // Global callback function - must be defined before script loads
    (window as any).handleTelegramAuth = (user: TelegramAuthData) => {
      console.log('Telegram auth callback received:', {
        id: user.id,
        first_name: user.first_name,
        hasHash: !!user.hash,
      });
      
      try {
        setDomainError(false);
        clearInterval(checkForError);
        onAuth(user);
      } catch (error) {
        console.error('Error in Telegram auth callback:', error);
        setDomainError(true);
      }
    };
    
    // Also listen for errors from the widget
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      if (args.some(arg => typeof arg === 'string' && (arg.includes('domain') || arg.includes('Telegram')))) {
        console.log('Telegram widget error detected:', args);
        setDomainError(true);
      }
      originalConsoleError.apply(console, args);
    };

    containerRef.current.appendChild(script);

    return () => {
      clearInterval(checkForError);
      console.error = originalConsoleError; // Restore original
      if (containerRef.current && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      // Don't delete the callback immediately - Telegram might still call it
      setTimeout(() => {
        delete (window as any).handleTelegramAuth;
      }, 5000);
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
