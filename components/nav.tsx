'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationsBell } from '@/components/notifications-bell';
import { useState, useEffect } from 'react';
import { LogOut, User, Menu, X } from 'lucide-react';

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [user, setUser] = useState<{ firstName?: string; username?: string; photoUrl?: string } | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const telegramAuth = localStorage.getItem('telegram_auth');
      const isAuth = !!telegramAuth;
      setIsLoggedIn(isAuth);
      
      if (isAuth) {
        try {
          const parsed = JSON.parse(telegramAuth);
          setUser({
            firstName: parsed.first_name || parsed.firstName,
            username: parsed.username,
            photoUrl: parsed.photo_url || parsed.photoUrl,
          });
        } catch (error) {
          console.error('Error parsing auth data:', error);
        }
      } else {
        setUser(null);
      }
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

  const handleLogout = () => {
    localStorage.removeItem('telegram_auth');
    window.dispatchEvent(new CustomEvent('auth-state-changed'));
    setShowUserMenu(false);
    router.push('/login');
    router.refresh();
  };

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
                  <Button size="sm" variant="outline" className="hidden sm:flex glass">
                    Табло
                  </Button>
                </Link>
                
                {/* User Menu - Mobile & Desktop */}
                <div className="relative">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2"
                  >
                    {user?.photoUrl ? (
                      <Image
                        src={user.photoUrl}
                        alt={user.firstName || 'User'}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">{user?.firstName || user?.username || 'Профил'}</span>
                    <Menu className="w-4 h-4 sm:hidden" />
                  </Button>
                  
                  {showUserMenu && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowUserMenu(false)}
                      />
                      {/* Dropdown Menu */}
                      <div className="absolute right-0 mt-2 w-48 glass rounded-lg shadow-lg border border-border z-50">
                        <div className="p-2 space-y-1">
                          <Link
                            href="/dashboard/settings"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-background/50 transition-colors text-sm"
                          >
                            <User className="w-4 h-4" />
                            Профил
                          </Link>
                          <Link
                            href="/dashboard/settings"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-background/50 transition-colors text-sm sm:hidden"
                          >
                            <span>Настройки</span>
                          </Link>
                          <div className="border-t border-border/50 my-1"></div>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-destructive/10 text-destructive transition-colors text-sm"
                          >
                            <LogOut className="w-4 h-4" />
                            Излез
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
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
