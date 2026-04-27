'use client';

import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const pageNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/leads': 'Leads',
  '/properties': 'Properties',
  '/visits': 'Visits & Meetings',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
};

export function TopNav() {
  const pathname = usePathname();
  const pageName = Object.entries(pageNames).find(([path]) =>
    pathname === path || pathname.startsWith(`${path}/`),
  )?.[1] || 'Dashboard';

  return (
    <header className="border-b border-border bg-card">
      <div className="flex h-16 items-center justify-between px-6">
        <h1 className="text-2xl font-bold text-foreground">{pageName}</h1>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search..."
              className="rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
