'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';
import apiClient from '@/lib/api-client';
import {
  getRefreshTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies,
  setAuthCookies
} from '@/lib/auth-cookie';
import type { ApiSuccessResponse, User } from '@/types/auth';

/**
 * Fetches user profile on mount if we have a token but no user data.
 * This handles page refreshes where Zustand state is lost but cookies persist.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, accessToken, setUser, setTokens, setShowOnboarding, logout } =
    useAuthStore();
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const restoreAttempted = useRef(false);

  useEffect(() => {
    // Only attempt restore once to avoid loops
    if (restoreAttempted.current) return;
    restoreAttempted.current = true;

    async function restoreSession() {
      // Case 1: already have user — just check onboarding
      if (user && accessToken) {
        if (!user.onboardingCompleted && user.role !== 'ADMIN') {
          setShowOnboarding(true);
        }
        setReady(true);
        return;
      }

      // Case 2: have access token but no user — fetch profile
      if (accessToken && !user) {
        try {
          const res = await apiClient.get<ApiSuccessResponse<User>>(
            '/auth/who-am-i'
          );
          const u = res.data.data;
          setUser(u);
          if (!u.onboardingCompleted && u.role !== 'ADMIN') {
            setShowOnboarding(true);
          }
          setReady(true);
          return;
        } catch {
          // Token invalid — fall through to redirect
        }
      }

      // Case 3: no access token (page refresh) — try refresh token from cookie
      const savedRefreshToken = getRefreshTokenCookie();
      if (savedRefreshToken) {
        try {
          const refreshRes = await axios.post(
            `${apiClient.defaults.baseURL}/auth/refresh`,
            { refreshToken: savedRefreshToken }
          );
          const {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
          } = refreshRes.data.data;

          setTokens(newAccessToken, newRefreshToken);
          setRefreshTokenCookie(newRefreshToken);

          // Fetch user profile with the new token
          const userRes = await apiClient.get<ApiSuccessResponse<User>>(
            '/auth/who-am-i',
            { headers: { Authorization: `Bearer ${newAccessToken}` } }
          );
          const u = userRes.data.data;
          setUser(u);
          setAuthCookies(u.role);
          if (!u.onboardingCompleted && u.role !== 'ADMIN') {
            setShowOnboarding(true);
          }
          setReady(true);
          return;
        } catch {
          // Refresh token expired or invalid — clear everything
          logout();
          clearAuthCookies();
        }
      }

      // No valid session — redirect to login
      setReady(true);
      router.replace('/login');
    }
    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Client-side role guard: admin cannot access /dashboard or /history
  useEffect(() => {
    if (!user) return;
    const isAdmin = user.role === 'ADMIN';
    const adminBlocked = ['/dashboard', '/history'];
    const userBlocked = ['/admin'];

    if (isAdmin && adminBlocked.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
      router.replace('/admin');
    }
    if (!isAdmin && userBlocked.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
      router.replace('/dashboard');
    }
  }, [user, pathname, router]);

  if (!ready) {
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-background'>
        <div className='size-6 animate-spin rounded-full border-2 border-primary border-t-transparent' />
      </div>
    );
  }

  // No user after restore — show spinner while redirect happens
  if (!user || !accessToken) {
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-background'>
        <div className='size-6 animate-spin rounded-full border-2 border-primary border-t-transparent' />
      </div>
    );
  }

  // Block render while role redirect is pending
  const isAdmin = user.role === 'ADMIN';
  const adminBlocked = ['/dashboard', '/history'];
  const userBlocked = ['/admin'];
  if (
    (isAdmin && adminBlocked.some((r) => pathname === r || pathname.startsWith(`${r}/`))) ||
    (!isAdmin && userBlocked.some((r) => pathname === r || pathname.startsWith(`${r}/`)))
  ) {
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-background'>
        <div className='size-6 animate-spin rounded-full border-2 border-primary border-t-transparent' />
      </div>
    );
  }

  return <>{children}</>;
}
