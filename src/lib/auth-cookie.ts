/**
 * Lightweight cookie helpers for middleware auth checks.
 *
 * The actual tokens live in Zustand (in-memory) for XSS safety.
 * These cookies only carry non-sensitive flags so the Next.js
 * edge middleware can decide whether to redirect.
 */

const AUTH_COOKIE = 'cloutiq_auth';
const ROLE_COOKIE = 'cloutiq_role';
const MUST_CHANGE_COOKIE = 'cloutiq_must_change';
const REFRESH_TOKEN_COOKIE = 'cloutiq_rt';

export function setAuthCookies(role: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=604800; SameSite=Lax`;
  document.cookie = `${ROLE_COOKIE}=${role}; path=/; max-age=604800; SameSite=Lax`;
}

export function setRefreshTokenCookie(refreshToken: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${REFRESH_TOKEN_COOKIE}=${refreshToken}; path=/; max-age=604800; SameSite=Lax`;
}

export function getRefreshTokenCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${REFRESH_TOKEN_COOKIE}=([^;]*)`)
  );
  return match ? match[1] : null;
}

export function setMustChangeCookie(mustChange: boolean) {
  if (typeof document === 'undefined') return;
  if (mustChange) {
    document.cookie = `${MUST_CHANGE_COOKIE}=1; path=/; max-age=604800; SameSite=Lax`;
  } else {
    document.cookie = `${MUST_CHANGE_COOKIE}=; path=/; max-age=0`;
  }
}

export function clearAuthCookies() {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `${MUST_CHANGE_COOKIE}=; path=/; max-age=0`;
  // Must match the SameSite=Lax used when setting the RT cookie
  document.cookie = `${REFRESH_TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export const AUTH_COOKIE_NAME = AUTH_COOKIE;
export const ROLE_COOKIE_NAME = ROLE_COOKIE;
export const MUST_CHANGE_COOKIE_NAME = MUST_CHANGE_COOKIE;
