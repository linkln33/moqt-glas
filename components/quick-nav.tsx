'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, List, BarChart3, User } from 'lucide-react';

export function QuickNav() {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Начало' },
    { href: '/dashboard/create', icon: Plus, label: 'Създай' },
    { href: '/elections', icon: List, label: 'Избори' },
    { href: '/dashboard/statistics', icon: BarChart3, label: 'Статистики' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border z-50 md:hidden">
      <div className="flex justify-around items-center h-16 safe-area-bottom">
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
      </div>
    </nav>
  );
}
