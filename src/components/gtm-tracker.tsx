'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { pushToDataLayer } from '@/lib/gtm';
import { useAuthStore } from '@/stores/auth.store';

function getPageInfo(pathname: string) {
  if (pathname === '/') return { page_type: 'marketing', page_category: 'landing' };
  if (pathname === '/login') return { page_type: 'marketing', page_category: 'auth' };
  if (pathname === '/register') return { page_type: 'marketing', page_category: 'auth' };
  if (pathname === '/forgot-password') return { page_type: 'marketing', page_category: 'auth' };
  if (pathname === '/reset-password') return { page_type: 'marketing', page_category: 'auth' };
  if (pathname === '/terms') return { page_type: 'marketing', page_category: 'legal' };
  if (pathname === '/privacy') return { page_type: 'marketing', page_category: 'legal' };
  if (pathname === '/dashboard') return { page_type: 'app', page_category: 'dashboard' };
  if (pathname === '/history') return { page_type: 'app', page_category: 'history' };
  if (pathname === '/settings') return { page_type: 'app', page_category: 'settings' };
  if (pathname === '/admin') return { page_type: 'app', page_category: 'admin' };
  return { page_type: 'marketing', page_category: 'other' };
}

export function GtmTracker() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const lastIdentified = useRef<string | null>(null);

  // page_data on every route change
  useEffect(() => {
    const info = getPageInfo(pathname);
    pushToDataLayer({
      event: 'page_data',
      page_type: info.page_type,
      page_category: info.page_category,
      site_name: 'CloutIQ',
      user_status: user ? 'logged_in' : 'anonymous'
    });
  }, [pathname, user]);

  // user_data when user is authenticated
  useEffect(() => {
    if (!user?.id || lastIdentified.current === user.id) return;
    lastIdentified.current = user.id;
    pushToDataLayer({
      event: 'user_data',
      user_status: 'logged_in',
      user_id: user.id,
      account_plan: user.plan === 'CREATOR' ? 'Creator' : 'Free',
      package_type: user.plan === 'CREATOR' ? 'paid' : 'free'
    });
  }, [user]);

  return null;
}
