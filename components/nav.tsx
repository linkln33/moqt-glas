'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationsBell } from '@/components/notifications-bell';
import { useState, useEffect } from 'react';

export function Nav() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const telegramAuth = localStorage.getItem('telegram_auth');
      setIsLoggedIn(!!telegramAuth);
    };

    // Check on mount
    checkAuth();

    // Listen for storage changes (when login happens in another tab/window)
    window.addEventListener('storage', checkAuth);

    // Listen for custom auth state change event (same window)
    const handleAuthChange = () => {
      checkAuth();
    };
    window.addEventListener('auth-state-changed', handleAuthChange);

    // Also check periodically in case localStorage was updated in same window
    const interval = setInterval(checkAuth, 500);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('auth-state-changed', handleAuthChange);
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { href: '/', label: 'Начало' },
    { href: '/dashboard', label: 'Лента', requiresAuth: true },
    { href: '/dashboard/elections', label: 'Избори' },
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/50 backdrop-blur-xl w-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-12 sm:h-14">
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/logo.svg" 
              alt="Моят Глас" 
              width={32}
              height={32}
              className="object-contain"
              priority
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Моят Глас
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navItems
              .filter((item) => !item.requiresAuth || isLoggedIn)
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === item.href
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isLoggedIn ? (
              <>
                <NotificationsBell />
                <Link href="/dashboard/create">
                  <Button size="sm" className="hidden sm:flex gradient-primary text-white">
                    + Създай
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="sm" variant="outline" className="glass">
                    Табло
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/login">
                <Button size="sm" className="gradient-primary text-white">
                  Влез
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
