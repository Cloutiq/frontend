'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import {
  IconLoader2,
  IconEye,
  IconEyeOff,
  IconArrowLeft
} from '@tabler/icons-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import apiClient from '@/lib/api-client';
import type { ApiErrorResponse } from '@/types/auth';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain 1 uppercase letter')
      .regex(/[0-9]/, 'Must contain 1 number'),
    confirmPassword: z.string().min(1, 'Confirm your password')
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [show, setShow] = useState({ pw: false, confirm: false });
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(schema) });

  if (!token) {
    return (
      <div className='flex flex-col gap-4'>
        <h2 className='font-heading text-2xl font-bold text-foreground'>
          Invalid Link
        </h2>
        <p className='text-sm text-muted-foreground'>
          This password reset link is invalid or has expired.
        </p>
        <Link
          href='/forgot-password'
          className='text-sm text-primary hover:underline'
        >
          Request a new link
        </Link>
      </div>
    );
  }

  async function onSubmit(data: { password: string; confirmPassword: string }) {
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        password: data.password,
        confirmPassword: data.confirmPassword
      });
      setDone(true);
    } catch (error) {
      const msg =
        (error as AxiosError<ApiErrorResponse>).response?.data?.message?.[0] ||
        'Failed to reset password';
      toast.error(msg);
    }
  }

  if (done) {
    return (
      <div className='flex flex-col gap-4'>
        <h2 className='font-heading text-2xl font-bold text-foreground'>
          Password Reset
        </h2>
        <p className='text-sm text-muted-foreground'>
          Your password has been reset. You can now log in.
        </p>
        <Link href='/login'>
          <Button className='w-full'>Go to Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
      <div>
        <h2 className='font-heading text-2xl font-bold text-foreground'>
          Reset Password
        </h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          Enter your new password below.
        </p>
      </div>

      <div className='flex flex-col gap-2'>
        <Label htmlFor='password'>New Password</Label>
        <div className='relative'>
          <Input
            id='password'
            type={show.pw ? 'text' : 'password'}
            disabled={isSubmitting}
            {...register('password')}
          />
          <button
            type='button'
            className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground'
            onClick={() => setShow((s) => ({ ...s, pw: !s.pw }))}
            tabIndex={-1}
          >
            {show.pw ? (
              <IconEyeOff className='size-4' />
            ) : (
              <IconEye className='size-4' />
            )}
          </button>
        </div>
        {errors.password && (
          <p className='text-xs text-destructive'>
            {errors.password.message as string}
          </p>
        )}
      </div>

      <div className='flex flex-col gap-2'>
        <Label htmlFor='confirmPassword'>Confirm Password</Label>
        <div className='relative'>
          <Input
            id='confirmPassword'
            type={show.confirm ? 'text' : 'password'}
            disabled={isSubmitting}
            {...register('confirmPassword')}
          />
          <button
            type='button'
            className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground'
            onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
            tabIndex={-1}
          >
            {show.confirm ? (
              <IconEyeOff className='size-4' />
            ) : (
              <IconEye className='size-4' />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className='text-xs text-destructive'>
            {errors.confirmPassword.message as string}
          </p>
        )}
      </div>

      <Button type='submit' disabled={isSubmitting}>
        {isSubmitting ? (
          <IconLoader2 className='mr-2 size-4 animate-spin' />
        ) : null}
        Reset Password
      </Button>

      <Link
        href='/login'
        className='flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground'
      >
        <IconArrowLeft className='size-3.5' />
        Back to login
      </Link>
    </form>
  );
}
