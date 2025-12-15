'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Plus, List, BarChart3, User, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';

export function QuickNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    const checkAuth = () => {
      const telegramAuth = localStorage.getItem('telegram_auth');
      setIsLoggedIn(!!telegramAuth);
    };
    
    checkAuth();
    window.addEventListener('storage', checkAuth);
    window.addEventListener('auth-state-changed', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('auth-state-changed', checkAuth);
    };
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem('telegram_auth');
    window.dispatchEvent(new CustomEvent('auth-state-changed'));
    router.push('/login');
    router.refresh();
  };
  
  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Лента' },
    { href: '/dashboard/create', icon: Plus, label: 'Създай' },
    { href: '/dashboard/elections', icon: List, label: 'Избори' },
    { href: '/dashboard/settings', icon: User, label: 'Профил' },
  ];

  if (!isLoggedIn) {
    return null; // Don't show quick nav if not logged in
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border z-50 md:hidden" style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}>
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center flex-1 h-full transition-colors text-muted-foreground hover:text-destructive"
          title="Излез"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-xs mt-1 font-medium">Излез</span>
        </button>
      </div>
    </nav>
  );
}
