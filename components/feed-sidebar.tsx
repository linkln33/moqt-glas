'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { User, Settings, LogOut, Plus, BarChart3, Home, List, CreditCard, TrendingUp } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface UserProfile {
  userId: string;
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  role: string;
}

export function FeedSidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = () => {
      try {
        const authData = localStorage.getItem('telegram_auth');
        if (authData) {
          const parsed = JSON.parse(authData);
          setUser({
            userId: parsed.userId || '',
            telegramId: parsed.telegramId || '',
            firstName: parsed.firstName || 'Потребител',
            lastName: parsed.lastName,
            username: parsed.username,
            photoUrl: parsed.photoUrl,
            role: parsed.role || 'voter',
          });
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();

    // Listen for auth changes
    const handleAuthChange = () => loadUser();
    window.addEventListener('auth-state-changed', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('auth-state-changed', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('telegram_auth');
    window.dispatchEvent(new CustomEvent('auth-state-changed'));
    window.location.href = '/login';
  };

  if (isLoading) {
    return (
      <aside className="hidden lg:block w-80 shrink-0">
        <div className="sticky top-20 space-y-4">
          <GlassCard>
            <GlassCardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-16 bg-muted rounded-full"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      </aside>
    );
  }

  if (!user) {
    return (
      <aside className="hidden lg:block w-80 shrink-0">
        <div className="sticky top-20 space-y-4">
          <GlassCard>
            <GlassCardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">
                Влезте, за да видите профила си
              </p>
              <Link href="/login">
                <Button className="w-full gradient-primary text-white">
                  Влез
                </Button>
              </Link>
            </GlassCardContent>
          </GlassCard>
        </div>
      </aside>
    );
  }

  const displayName = user.firstName + (user.lastName ? ` ${user.lastName}` : '');
  const initials = user.firstName.charAt(0).toUpperCase() + (user.lastName?.charAt(0).toUpperCase() || '');

  return (
    <aside className="hidden lg:block w-80 shrink-0">
      <div className="sticky top-20 space-y-4">
        {/* User Profile Card */}
        <GlassCard>
          <GlassCardContent className="p-6">
            <div className="flex flex-col items-center text-center mb-4">
              {user.photoUrl ? (
                <Image
                  src={user.photoUrl}
                  alt={displayName}
                  width={80}
                  height={80}
                  className="rounded-full mb-3 border-2 border-primary"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-2xl font-bold text-white mb-3">
                  {initials}
                </div>
              )}
              <h3 className="font-semibold text-lg mb-1">{displayName}</h3>
              {user.username && (
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              )}
              {user.role !== 'voter' && (
                <span className="mt-2 px-2 py-1 text-xs bg-primary/20 text-primary rounded-full">
                  {user.role === 'admin' ? 'Администратор' : 'Модератор'}
                </span>
              )}
            </div>

            <div className="space-y-1 border-t border-border/50 pt-4">
              <Link href="/dashboard" className="block">
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start ${pathname === '/dashboard' ? 'bg-primary/10 text-primary' : ''}`}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Лента
                </Button>
              </Link>
              <Link href="/elections" className="block">
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start ${pathname === '/elections' ? 'bg-primary/10 text-primary' : ''}`}
                >
                  <List className="w-4 h-4 mr-2" />
                  Всички избори
                </Button>
              </Link>
              <Link href="/dashboard/create" className="block">
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start ${pathname === '/dashboard/create' ? 'bg-primary/10 text-primary' : ''}`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Създай анкета
                </Button>
              </Link>
              <Link href="/dashboard/statistics" className="block">
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start ${pathname === '/dashboard/statistics' ? 'bg-primary/10 text-primary' : ''}`}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Статистики
                </Button>
              </Link>
              <Link href="/dashboard/settings" className="block">
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start ${pathname === '/dashboard/settings' ? 'bg-primary/10 text-primary' : ''}`}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Настройки & Платежни данни
                </Button>
              </Link>
              <div className="pt-2 border-t border-border/50 mt-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Излез
                </Button>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Quick Stats Card */}
        <GlassCard>
          <GlassCardContent className="p-6">
            <h4 className="font-semibold mb-4">Бързи статистики</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Анкети</span>
                <span className="font-semibold">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Гласове</span>
                <span className="font-semibold">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Коментари</span>
                <span className="font-semibold">-</span>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </aside>
  );
}
