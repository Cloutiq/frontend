'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { IconEye, IconEyeOff, IconLoader2 } from '@tabler/icons-react';
import { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleLoginButton } from './google-login-button';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { setAuthCookies, setMustChangeCookie, setRefreshTokenCookie } from '@/lib/auth-cookie';
import { identifyUser, trackUserLoggedIn } from '@/lib/analytics';
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  AuthTokens,
  User
} from '@/types/auth';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required')
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const { setTokens, setUser, setShowOnboarding } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  async function handleAuthSuccess(
    data: AuthTokens,
    authMethod: 'email' | 'google'
  ) {
    setTokens(data.accessToken, data.refreshToken);
    setRefreshTokenCookie(data.refreshToken);

    if (data.mustChangeCredentials) {
      setAuthCookies('ADMIN');
      setMustChangeCookie(true);
      router.replace('/change-credentials');
      return;
    }

    // Fetch user profile to determine role before redirecting
    try {
      const whoRes = await apiClient.get<ApiSuccessResponse<User>>(
        '/auth/who-am-i'
      );
      const u = whoRes.data.data;
      setUser(u);
      setAuthCookies(u.role);
      if (!u.onboardingCompleted && u.role !== 'ADMIN') {
        setShowOnboarding(true);
      }
      try {
        identifyUser(u);
        trackUserLoggedIn(u.id, authMethod);
      } catch {}
      const dest = u.role === 'ADMIN' ? '/admin' : redirectTo;
      // Full page load to clear Next.js Router Cache from previous session
      window.location.href = dest;
    } catch {
      // Fallback: redirect without role info
      setAuthCookies('USER');
      window.location.href = redirectTo;
    }
  }

  async function onSubmit(formData: LoginFormData) {
    try {
      const response = await apiClient.post<ApiSuccessResponse<AuthTokens>>(
        '/auth/login',
        formData
      );
      await handleAuthSuccess(response.data.data, 'email');
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message =
        axiosError.response?.data?.message?.[0] ||
        'Login failed. Please try again.';
      toast.error(message);
    }
  }

  async function handleGoogleSuccess(idToken: string) {
    setIsGoogleLoading(true);
    try {
      const response = await apiClient.post<ApiSuccessResponse<AuthTokens>>(
        '/auth/google',
        { idToken }
      );
      await handleAuthSuccess(response.data.data, 'google');
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message =
        axiosError.response?.data?.message?.[0] ||
        'Google sign-in failed. Please try again.';
      toast.error(message);
    } finally {
      setIsGoogleLoading(false);
    }
  }

  const isLoading = isSubmitting || isGoogleLoading;

  return (
    <div className='flex flex-col gap-6 px-4 py-6 sm:p-8'>
      {/* Header */}
      <div>
        <h2 className='font-heading text-2xl font-bold text-foreground'>
          Welcome back
        </h2>
        <p className='mb-4 mt-1 text-sm text-muted-foreground'>
          Sign in to your CloutIQ account
        </p>
      </div>

      {/* Google Login */}
      <GoogleLoginButton
        onSuccess={handleGoogleSuccess}
        onError={() => toast.error('Google sign-in failed')}
      />

      {/* Divider */}
      <div className='relative'>
        <div className='absolute inset-0 flex items-center'>
          <span className='w-full border-t border-border' />
        </div>
        <div className='relative flex justify-center text-xs'>
          <span className='bg-background px-2 text-muted-foreground'>
            or continue with email
          </span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='email'>Email</Label>
          <Input
            id='email'
            type='email'
            placeholder='you@example.com'
            autoComplete='email'
            disabled={isLoading}
            {...register('email')}
          />
          {errors.email && (
            <p className='text-xs text-destructive'>{errors.email.message}</p>
          )}
        </div>

        <div className='flex flex-col gap-2'>
          <div className='flex items-center justify-between'>
            <Label htmlFor='password'>Password</Label>
            <Link
              href='/forgot-password'
              className='text-xs text-muted-foreground hover:text-foreground'
            >
              Forgot password?
            </Link>
          </div>
          <div className='relative'>
            <Input
              id='password'
              type={showPassword ? 'text' : 'password'}
              placeholder='••••••••'
              autoComplete='current-password'
              disabled={isLoading}
              {...register('password')}
            />
            <button
              type='button'
              className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                <IconEyeOff className='size-4' />
              ) : (
                <IconEye className='size-4' />
              )}
            </button>
          </div>
          {errors.password && (
            <p className='text-xs text-destructive'>
              {errors.password.message}
            </p>
          )}
        </div>

        <Button type='submit' className='mt-6 w-full' disabled={isLoading}>
          {isSubmitting ? (
            <>
              <IconLoader2 className='mr-2 size-4 animate-spin' />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>

      {/* Sign up link */}
      <p className='mt-4 text-center text-sm text-muted-foreground'>
        Don&apos;t have an account?{' '}
        <Link
          href='/register'
          className='font-medium text-primary hover:underline'
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
