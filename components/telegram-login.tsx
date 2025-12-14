'use client';

import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up any existing script
    const existingScript = containerRef.current.querySelector('script');
    if (existingScript) {
      existingScript.remove();
    }

    // Check if we're on HTTPS or localhost
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isHttps = window.location.protocol === 'https:';

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
    };

    // Global callback function
    (window as any).handleTelegramAuth = (user: TelegramAuthData) => {
      onAuth(user);
    };

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete (window as any).handleTelegramAuth;
    };
  }, [botName, onAuth]);

  return (
    <div 
      ref={containerRef} 
      className={className}
      style={{ minHeight: '40px' }}
    />
  );
}
