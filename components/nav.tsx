'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

export function Nav() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const telegramAuth = localStorage.getItem('telegram_auth');
    setIsLoggedIn(!!telegramAuth);
  }, []);

  const navItems = [
    { href: '/', label: 'Начало' },
    { href: '/elections', label: 'Избори' },
    { href: '/dashboard', label: 'Табло', requiresAuth: true },
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/50 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
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

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
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
