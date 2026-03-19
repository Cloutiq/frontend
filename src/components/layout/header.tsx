'use client';

import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import { ThemeModeToggle } from '../themes/theme-mode-toggle';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { IconLogout } from '@tabler/icons-react';
import { useAuthStore } from '@/stores/auth.store';
import { clearAuthCookies } from '@/lib/auth-cookie';
import apiClient from '@/lib/api-client';

function getUsageColor(used: number): string {
  if (used >= 3) return 'var(--score-low)';
  if (used >= 2) return 'var(--score-mid)';
  return 'var(--score-high)';
}

export default function Header() {
  const { user, logout: storeLogout, refreshToken } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const isFree = !isAdmin && user?.plan === 'FREE';
  const used = user?.analysesThisMonth ?? 0;

  async function handleLogout() {
    try {
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Logout even if API fails
    }
    storeLogout();
    clearAuthCookies();
    // Full page load to clear Next.js Router Cache so next login starts fresh
    window.location.href = '/login';
  }

  return (
    <header className='flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
      <div className='flex items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4' />
        <Breadcrumbs />
      </div>

      <div className='flex items-center gap-3 px-4'>
        {/* Plan badge (hidden for admin) */}
        {user && !isAdmin && isFree && (
          <Badge
            variant='outline'
            className='hidden border-score-mid/50 bg-score-mid/10 font-mono text-xs text-score-mid sm:inline-flex'
          >
            FREE
          </Badge>
        )}
        {user && !isAdmin && user.plan === 'CREATOR' && (
          <Badge
            variant='outline'
            className='hidden border-primary/50 bg-primary/10 font-mono text-xs text-primary sm:inline-flex'
          >
            CREATOR
          </Badge>
        )}

        {/* Usage counter for FREE plan */}
        {isFree && (
          <div className='hidden items-center gap-2 sm:flex'>
            <span className='font-mono text-xs text-muted-foreground'>
              <span style={{ color: getUsageColor(used) }}>{used}</span>
              {' / 3'}
            </span>
            <div className='h-1.5 w-16 overflow-hidden rounded-sm bg-muted'>
              <div
                className='h-full rounded-sm transition-all duration-300'
                style={{
                  width: `${(used / 3) * 100}%`,
                  backgroundColor: getUsageColor(used)
                }}
              />
            </div>
          </div>
        )}

        <ThemeModeToggle />

        <Button
          variant='ghost'
          size='icon'
          className='size-8'
          onClick={handleLogout}
          title='Log out'
        >
          <IconLogout className='size-4' />
        </Button>
      </div>
    </header>
  );
}
