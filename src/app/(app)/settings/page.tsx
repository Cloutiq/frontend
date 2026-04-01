'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { IconEye, IconEyeOff, IconLoader2, IconPencil } from '@tabler/icons-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth.store';
import apiClient from '@/lib/api-client';
import { identifyUser } from '@/lib/analytics';
import { OnboardingModal } from '@/features/onboarding/components/onboarding-modal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import type { ApiErrorResponse, ApiSuccessResponse, User, BillingHistoryEntry } from '@/types/auth';
import { pushToDataLayer, generateEventId } from '@/lib/gtm';

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain 1 uppercase letter')
    .regex(/[0-9]/, 'Must contain 1 number')
});

const setPasswordSchema = z
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

const PROFILE_LABELS: Record<string, string> = {
  platform: 'Platform',
  niche: 'Niche',
  audienceAgeRange: 'Audience Age',
  audienceRegion: 'Audience Region',
  audienceLanguage: 'Audience Language',
  averageViewCount: 'Avg. View Count',
  biggestFrustration: 'Biggest Frustration'
};

const PROFILE_FIELDS = Object.keys(PROFILE_LABELS) as (keyof typeof PROFILE_LABELS)[];

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [hasPassword, setHasPassword] = useState(user?.hasPassword ?? !user?.googleId);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  async function refreshUser() {
    try {
      const res = await apiClient.get<ApiSuccessResponse<User>>(
        '/auth/who-am-i'
      );
      setUser(res.data.data);
      identifyUser(res.data.data);
    } catch {}
  }

  async function handleProfileComplete() {
    await refreshUser();
    setShowProfileEdit(false);
    toast.success('Creator profile updated');
  }

  return (
    <div className='mx-auto max-w-5xl flex-1 p-4 sm:p-6 md:p-8'>
      <h1 className='mb-6 font-heading text-2xl font-bold text-foreground'>
        Settings
      </h1>

      {/* ── Card 1: Account ────────────────────────────── */}
      <div className='card-glow mb-6'>
        {/* Header row: avatar + name/email + plan badge */}
        <div className='flex items-center gap-4 border-b border-border/50 p-6'>
          <div className='flex size-12 shrink-0 items-center justify-center rounded-sm bg-primary/10'>
            <span className='font-heading text-lg font-bold text-primary'>
              {user?.name?.slice(0, 2).toUpperCase() || 'CQ'}
            </span>
          </div>
          <div className='min-w-0 flex-1'>
            <div className='flex items-center gap-2'>
              <h2 className='truncate font-heading text-lg font-bold text-foreground'>
                {user?.name || '—'}
              </h2>
              {user?.role === 'ADMIN' && (
                <Badge variant='outline' className='shrink-0 border-primary text-primary'>
                  ADMIN
                </Badge>
              )}
              {user?.plan === 'CREATOR' && (
                <Badge className='shrink-0 bg-primary text-primary-foreground'>
                  CREATOR
                </Badge>
              )}
              {user?.plan === 'FREE' && (
                <Badge
                  variant='outline'
                  className='shrink-0 border-score-mid text-score-mid'
                >
                  FREE
                </Badge>
              )}
            </div>
            <p className='truncate font-mono text-xs text-muted-foreground'>
              {user?.email || '—'}
            </p>
          </div>
          {user?.plan === 'FREE' && (
            <div className='hidden shrink-0 text-right sm:block'>
              <p className='font-mono text-sm font-medium text-foreground'>
                {user.analysesThisMonth}/3
              </p>
              <p className='font-mono text-[10px] text-muted-foreground'>
                analyses this month
              </p>
            </div>
          )}
        </div>

        {/* Creator profile fields — non-admin only */}
        {!isAdmin && user && (
          <div className='p-6'>
            <div className='mb-3 flex items-center justify-between'>
              <p className='font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground'>
                Creator Profile
              </p>
              <Button
                variant='ghost'
                size='sm'
                className='h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground'
                onClick={() => setShowProfileEdit(true)}
              >
                <IconPencil className='size-3' />
                Edit
              </Button>
            </div>
            <div className='grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3'>
              {PROFILE_FIELDS.map((field) => (
                <div key={field}>
                  <p className='text-[11px] text-muted-foreground'>
                    {PROFILE_LABELS[field]}
                  </p>
                  <p className='text-sm font-medium text-foreground capitalize'>
                    {(user[field as keyof typeof user] as string)
                      ?.replace(/_/g, ' ')
                      .toLowerCase() || '—'}
                  </p>
                </div>
              ))}
            </div>

            <OnboardingModal
              open={showProfileEdit}
              onClose={() => setShowProfileEdit(false)}
              initialData={{
                platform: user.platform,
                niche: user.niche,
                audienceAgeRange: user.audienceAgeRange,
                audienceRegion: user.audienceRegion,
                audienceLanguage: user.audienceLanguage,
                averageViewCount: user.averageViewCount,
                biggestFrustration: user.biggestFrustration
              }}
              onComplete={handleProfileComplete}
            />
          </div>
        )}

        {/* Password button inside account card */}
        <div className='border-t border-border/50 px-6 py-4'>
          <Button
            size='sm'
            className='h-8 text-xs'
            onClick={() => setShowPasswordDialog(true)}
          >
            {hasPassword ? 'Change Password' : 'Set Password'}
          </Button>
        </div>
      </div>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className='rounded-sm'>
          <DialogHeader>
            <DialogTitle>
              {hasPassword ? 'Change Password' : 'Set Password'}
            </DialogTitle>
          </DialogHeader>
          {hasPassword ? (
            <ChangePasswordForm
              onSuccess={() => {
                setShowPasswordDialog(false);
                toast.success('Password updated successfully');
              }}
            />
          ) : (
            <SetPasswordForm
              onSuccess={() => {
                setHasPassword(true);
                setShowPasswordDialog(false);
                toast.success('Password updated successfully');
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Card 2: Plan & Billing — non-admin only ──── */}
      {!isAdmin && (
        <div className='card-glow mb-6'>
          <SubscriptionSection user={user} onRefresh={refreshUser} />
          <BillingHistorySection />
        </div>
      )}
    </div>
  );
}

interface ChangePasswordFormProps {
  onSuccess?: () => void;
}

function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const [show, setShow] = useState({ old: false, new: false });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(changePasswordSchema) });

  async function onSubmit(data: { oldPassword: string; newPassword: string }) {
    try {
      await apiClient.patch('/auth/change-password', data);
      reset();
      onSuccess?.();
    } catch (error) {
      const msg =
        (error as AxiosError<ApiErrorResponse>).response?.data?.message?.[0] ||
        'Failed to change password';
      toast.error(msg);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
      <div className='flex flex-col gap-2'>
        <Label htmlFor='oldPassword'>Current password</Label>
        <div className='relative'>
          <Input
            id='oldPassword'
            type={show.old ? 'text' : 'password'}
            disabled={isSubmitting}
            {...register('oldPassword')}
          />
          <button
            type='button'
            className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground'
            onClick={() => setShow((s) => ({ ...s, old: !s.old }))}
            tabIndex={-1}
          >
            {show.old ? <IconEyeOff className='size-4' /> : <IconEye className='size-4' />}
          </button>
        </div>
        {errors.oldPassword && (
          <p className='text-xs text-destructive'>{errors.oldPassword.message as string}</p>
        )}
      </div>
      <div className='flex flex-col gap-2'>
        <Label htmlFor='newPassword'>New password</Label>
        <div className='relative'>
          <Input
            id='newPassword'
            type={show.new ? 'text' : 'password'}
            disabled={isSubmitting}
            {...register('newPassword')}
          />
          <button
            type='button'
            className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground'
            onClick={() => setShow((s) => ({ ...s, new: !s.new }))}
            tabIndex={-1}
          >
            {show.new ? <IconEyeOff className='size-4' /> : <IconEye className='size-4' />}
          </button>
        </div>
        {errors.newPassword && (
          <p className='text-xs text-destructive'>{errors.newPassword.message as string}</p>
        )}
      </div>
      <Button type='submit' disabled={isSubmitting}>
        {isSubmitting ? <IconLoader2 className='mr-2 size-4 animate-spin' /> : null}
        Change Password
      </Button>
    </form>
  );
}

// ── Subscription Section ─────────────────────────────────────

function SubscriptionSection({
  user,
  onRefresh
}: {
  user: User | null;
  onRefresh: () => Promise<void>;
}) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const status = user?.subscriptionStatus;
  const endDate = user?.subscriptionEndDate;
  const formattedDate = endDate
    ? format(new Date(endDate), 'MMM d, yyyy')
    : null;

async function handleCancel() {
  setLoading(true);
  try {
    const { data } = await apiClient.post('/api/cancel-subscription');
    const accessUntil = data?.data?.accessUntil ?? data?.accessUntil;
    const formatted = accessUntil
      ? new Date(accessUntil).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : formattedDate; // fallback to whatever was already computed

    await onRefresh();
    toast.success(`Your subscription will end on ${formatted}`);
  } catch (error) {
    const msg =
      (error as AxiosError<ApiErrorResponse>).response?.data?.message?.[0] ||
      'Failed to cancel subscription';
    toast.error(msg);
  } finally {
    setLoading(false);
    setShowCancelModal(false);
  }
}

  async function handleResume() {
    setLoading(true);
    try {
      await apiClient.post('/api/resume-subscription');
      toast.success('Your subscription has been resumed');
      await onRefresh();
    } catch (error) {
      const msg =
        (error as AxiosError<ApiErrorResponse>).response?.data?.message?.[0] ||
        'Failed to resume subscription';
      toast.error(msg);
    } finally {
      setLoading(false);
      setShowResumeModal(false);
    }
  }

  async function handleUpgrade() {
    pushToDataLayer({
      event: 'add_to_cart',
      plan_id: 'creator_monthly',
      package_type: 'paid',
      value: 10
    });
    setLoading(true);
    try {
      const res = await apiClient.post('/api/create-checkout');
      const checkoutUrl = res.data?.data?.checkoutUrl || res.data?.data?.url;
      if (checkoutUrl) {
        pushToDataLayer({
          event: 'begin_checkout',
          event_id: generateEventId('checkout'),
          value: 10,
          currency: 'USD',
          payment_provider: 'stripe'
        });
        window.location.href = checkoutUrl;
      } else {
        toast.error('Could not create checkout session');
        setLoading(false);
      }
    } catch (error) {
      const msg =
        (error as AxiosError<ApiErrorResponse>).response?.data?.message?.[0] ||
        'Failed to start checkout';
      toast.error(msg);
      setLoading(false);
    }
  }

  return (
    <div className='p-6'>
      <h2 className='mb-4 font-heading text-lg font-bold text-foreground'>
        Plan & Billing
      </h2>

      {/* Active */}
      {status === 'active' && (
        <div className='flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Badge className='bg-primary text-primary-foreground'>
                Creator
              </Badge>
              <span className='text-sm text-muted-foreground'>$10/month</span>
            </div>
            <Button
              variant='ghost'
              size='sm'
              className='h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive'
              onClick={() => setShowCancelModal(true)}
            >
              Cancel
            </Button>
          </div>
          {formattedDate && (
            <p className='text-xs text-muted-foreground'>
              Next billing: <span className='text-foreground'>{formattedDate}</span>
            </p>
          )}
        </div>
      )}

      {/* Canceling */}
      {status === 'canceling' && (
        <div className='flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <Badge variant='outline' className='border-score-mid text-score-mid'>
              Creator (canceling)
            </Badge>
            <Button
              variant='outline'
              size='sm'
              className='h-7 text-xs'
              onClick={() => setShowResumeModal(true)}
            >
              Resume
            </Button>
          </div>
          {formattedDate && (
            <p className='text-xs text-score-mid'>
              Access until {formattedDate} — will not renew.
            </p>
          )}
        </div>
      )}

      {/* Free / no subscription */}
      {!status && (
        <div className='flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Badge variant='outline' className='border-score-mid text-score-mid'>
                Free
              </Badge>
              <span className='text-sm text-muted-foreground'>3 analyses/month</span>
            </div>
          </div>
          <Button size='sm' className='w-fit' onClick={handleUpgrade} disabled={loading}>
            {loading ? (
              <>
                <IconLoader2 className='mr-2 size-4 animate-spin' />
                Redirecting...
              </>
            ) : (
              'Upgrade to Creator — $10/month'
            )}
          </Button>
          <p className='text-[11px] text-muted-foreground'>
            By subscribing you agree to our{' '}
            <Link href='/terms' className='underline hover:text-foreground'>
              Terms of Service
            </Link>{' '}
            including the payment and cancellation terms.
          </p>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
          </DialogHeader>
          <p className='text-sm text-muted-foreground'>
            Are you sure? You&apos;ll keep Creator access until{' '}
            <span className='font-medium text-foreground'>{formattedDate}</span>.
            After that, you&apos;ll be on the Free plan (3 analyses/month).
            No refund will be issued.
          </p>
          <DialogFooter className='gap-2'>
            <Button
              variant='outline'
              onClick={() => setShowCancelModal(false)}
              disabled={loading}
            >
              Keep My Plan
            </Button>
            <Button
              variant='destructive'
              onClick={handleCancel}
              disabled={loading}
            >
              {loading ? <IconLoader2 className='mr-2 size-4 animate-spin' /> : null}
              Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resume Confirmation Modal */}
      <Dialog open={showResumeModal} onOpenChange={setShowResumeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resume Subscription</DialogTitle>
          </DialogHeader>
          <p className='text-sm text-muted-foreground'>
            Your Creator plan will continue and auto-renew on{' '}
            <span className='font-medium text-foreground'>{formattedDate}</span>.
          </p>
          <DialogFooter className='gap-2'>
            <Button
              variant='outline'
              onClick={() => setShowResumeModal(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleResume} disabled={loading}>
              {loading ? <IconLoader2 className='mr-2 size-4 animate-spin' /> : null}
              Resume Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Billing History Section ──────────────────────────────────

const BILLING_PAGE_SIZE = 10;

function BillingHistorySection() {
  const [history, setHistory] = useState<BillingHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await apiClient.get('/api/billing-history');
        setHistory(res.data?.data?.history || []);
      } catch {
        // No billing history available
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className='border-t border-border/50 px-6 py-4'>
        <p className='text-sm text-muted-foreground'>Loading billing history...</p>
      </div>
    );
  }

  if (history.length === 0) return null;

  const totalPages = Math.ceil(history.length / BILLING_PAGE_SIZE);
  const pageEntries = history.slice(
    page * BILLING_PAGE_SIZE,
    (page + 1) * BILLING_PAGE_SIZE
  );

  return (
    <div className='border-t border-border/50 px-6 pb-6 pt-4'>
      <p className='mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground'>
        Billing History
      </p>
      <div className='overflow-hidden rounded-sm border border-border'>
        {/* Desktop header */}
        <div className='hidden grid-cols-[120px_1fr_80px] border-b border-border bg-muted/30 px-4 py-2 sm:grid'>
          <span className='font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground'>
            Date
          </span>
          <span className='font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground'>
            Event
          </span>
          <span className='text-right font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground'>
            Amount
          </span>
        </div>
        {/* Rows */}
        {pageEntries.map((entry) => {
          let fmtDate = entry.date;
          try {
            fmtDate = format(new Date(entry.date), 'MMM d, yyyy');
          } catch {}

          return (
            <div
              key={entry.id}
              className='border-b border-border/50 px-3 py-2.5 last:border-b-0 sm:grid sm:grid-cols-[120px_1fr_80px] sm:px-4 sm:py-3'
            >
              {/* Mobile stacked layout */}
              <div className='flex items-center justify-between sm:contents'>
                <div className='flex items-center gap-2 sm:block'>
                  <span className='text-sm text-foreground capitalize sm:hidden'>
                    {entry.event}
                  </span>
                  <span className='font-mono text-[10px] text-muted-foreground sm:text-xs'>
                    {fmtDate}
                  </span>
                </div>
                <span className='hidden text-sm text-foreground capitalize sm:block'>
                  {entry.event}
                </span>
                <span className='font-mono text-sm font-medium text-foreground sm:text-right sm:font-normal'>
                  {entry.amount != null
                    ? `$${entry.amount.toFixed(2)}`
                    : '\u2014'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='mt-3 flex items-center justify-center gap-3'>
          <Button
            variant='outline'
            size='sm'
            className='h-7 rounded-sm px-3 text-xs'
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </Button>
          <span className='font-mono text-xs text-muted-foreground'>
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant='outline'
            size='sm'
            className='h-7 rounded-sm px-3 text-xs'
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function SetPasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const [show, setShow] = useState({ pw: false, confirm: false });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(setPasswordSchema) });

  async function onSubmit(data: { password: string; confirmPassword: string }) {
    try {
      await apiClient.post('/auth/set-password', data);
      reset();
      onSuccess();
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const msg = axiosError.response?.data?.message?.[0] || 'Failed to set password';
      if (msg.includes('change-password')) {
        onSuccess(); // User already has a password
      } else {
        toast.error(msg);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
      <p className='text-sm text-muted-foreground'>
        You signed up with Google. Set a password to also log in with email.
      </p>
      <div className='flex flex-col gap-2'>
        <Label htmlFor='password'>Password</Label>
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
            {show.pw ? <IconEyeOff className='size-4' /> : <IconEye className='size-4' />}
          </button>
        </div>
        {errors.password && (
          <p className='text-xs text-destructive'>{errors.password.message as string}</p>
        )}
      </div>
      <div className='flex flex-col gap-2'>
        <Label htmlFor='confirmPassword'>Confirm password</Label>
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
            {show.confirm ? <IconEyeOff className='size-4' /> : <IconEye className='size-4' />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className='text-xs text-destructive'>{errors.confirmPassword.message as string}</p>
        )}
      </div>
      <Button type='submit' disabled={isSubmitting}>
        {isSubmitting ? <IconLoader2 className='mr-2 size-4 animate-spin' /> : null}
        Set Password
      </Button>
    </form>
  );
}
