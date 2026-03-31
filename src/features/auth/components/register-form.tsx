'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';
import {
  setAuthCookies,
  setRefreshTokenCookie,
  getRefreshTokenCookie
} from '@/lib/auth-cookie';
import { identifyUser, trackSignUp } from '@/lib/analytics';
import { pushToDataLayer, generateEventId } from '@/lib/gtm';
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  AuthTokens,
  LoginResponse,
  User
} from '@/types/auth';
import { isVerificationPending } from '@/types/auth';

const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least 1 number')
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least 1 special character'
      ),
    confirmPassword: z.string().min(1, 'Confirm your password')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // If user is already authenticated (e.g. browser back from dashboard),
  // replace this history entry so back button skips over register entirely.
  useEffect(() => {
    function redirectIfAuthenticated() {
      const rt = getRefreshTokenCookie();
      if (rt) {
        setIsRedirecting(true);
        window.location.replace('/dashboard');
      }
    }
    redirectIfAuthenticated();

    function handlePageShow(e: PageTransitionEvent) {
      if (e.persisted) redirectIfAuthenticated();
    }
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  // sign_up_start on mount
  useEffect(() => {
    pushToDataLayer({
      event: 'sign_up_start',
      signup_method: 'email',
      plan_id: 'free_monthly',
      package_type: 'free'
    });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  async function handleAuthSuccess(
    data: AuthTokens,
    authMethod: 'email' | 'google'
  ) {
    // Only persist cookies — Zustand state is lost after full page reload
    setRefreshTokenCookie(data.refreshToken);

    // Fetch user profile for analytics, then navigate
    // Use raw axios with explicit token (not apiClient — Zustand may be stale)
    try {
      const res = await axios.get<ApiSuccessResponse<User>>(
        '/backend/auth/who-am-i',
        { headers: { Authorization: `Bearer ${data.accessToken}`, 'Cache-Control': 'no-store' } }
      );
      const u = res.data.data;
      setAuthCookies(u.role);
      try {
        identifyUser(u);
        trackSignUp(u.id, authMethod);
        pushToDataLayer({
          event: 'sign_up',
          event_id: generateEventId('signup'),
          user_id: u.id,
          plan_id: 'free_monthly',
          package_type: 'free'
        });
      } catch {}
    } catch {
      // Fallback: set basic cookies so middleware works
      setAuthCookies('USER');
    }

    // Replace history entry so back button doesn't return to register page
    window.location.replace('/dashboard');
  }

  async function onSubmit(formData: RegisterFormData) {
    pushToDataLayer({
      event: 'sign_up_submit',
      signup_method: 'email',
      form_id: 'signup_form'
    });
    try {
      const response = await apiClient.post<ApiSuccessResponse<LoginResponse>>(
        '/auth/register',
        {
          name: formData.name,
          email: formData.email,
          password: formData.password
        }
      );
      const data = response.data.data;

      if (isVerificationPending(data)) {
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        return;
      }

      await handleAuthSuccess(data, 'email');
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const raw =
        axiosError.response?.data?.message?.[0] ||
        'Registration failed. Please try again.';
      const message =
        raw.toLowerCase().includes('password is not strong enough')
          ? 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character.'
          : raw;
      toast.error(message);
    }
  }

  async function handleGoogleSuccess(idToken: string) {
    pushToDataLayer({
      event: 'sign_up_submit',
      signup_method: 'google',
      form_id: 'signup_form'
    });
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
        'Google sign-up failed. Please try again.';
      toast.error(message);
    } finally {
      setIsGoogleLoading(false);
    }
  }

  const isLoading = isSubmitting || isGoogleLoading;

  // Don't flash the register form — show spinner while redirecting
  if (isRedirecting) {
    return (
      <div className='flex min-h-[300px] items-center justify-center'>
        <div className='size-6 animate-spin rounded-full border-2 border-primary border-t-transparent' />
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-6 px-4 py-6 sm:p-8'>
      {/* Header */}
      <div>
        <h2 className='font-heading text-2xl font-bold text-foreground'>
          Create your account
        </h2>
        <p className='mb-4 mt-1 text-sm text-muted-foreground'>
          Start analysing your scripts with AI
        </p>
      </div>

      {/* Google Sign Up */}
      <GoogleLoginButton
        onSuccess={handleGoogleSuccess}
        onError={() => toast.error('Google sign-up failed')}
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

      {/* Registration Form */}
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='name'>Name</Label>
          <Input
            id='name'
            type='text'
            placeholder='Your name'
            autoComplete='name'
            disabled={isLoading}
            {...register('name')}
          />
          {errors.name && (
            <p className='text-xs text-destructive'>{errors.name.message}</p>
          )}
        </div>

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
          <Label htmlFor='password'>Password</Label>
          <div className='relative'>
            <Input
              id='password'
              type={showPassword ? 'text' : 'password'}
              placeholder='••••••••'
              autoComplete='new-password'
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

        <div className='flex flex-col gap-2'>
          <Label htmlFor='confirmPassword'>Confirm password</Label>
          <div className='relative'>
            <Input
              id='confirmPassword'
              type={showConfirm ? 'text' : 'password'}
              placeholder='••••••••'
              autoComplete='new-password'
              disabled={isLoading}
              {...register('confirmPassword')}
            />
            <button
              type='button'
              className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
              onClick={() => setShowConfirm(!showConfirm)}
              tabIndex={-1}
            >
              {showConfirm ? (
                <IconEyeOff className='size-4' />
              ) : (
                <IconEye className='size-4' />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className='text-xs text-destructive'>
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type='submit' className='mt-6 w-full' disabled={isLoading}>
          {isSubmitting ? (
            <>
              <IconLoader2 className='mr-2 size-4 animate-spin' />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </Button>
        <p className='mt-3 text-center text-[11px] text-muted-foreground'>
          By creating an account you agree to our{' '}
          <Link
            href='/terms'
            className='underline hover:text-foreground'
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href='/privacy'
            className='underline hover:text-foreground'
          >
            Privacy Policy
          </Link>
          .
        </p>
      </form>

      {/* Sign in link */}
      <p className='mt-4 text-center text-sm text-muted-foreground'>
        Already have an account?{' '}
        <Link
          href='/login'
          className='font-medium text-primary hover:underline'
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
