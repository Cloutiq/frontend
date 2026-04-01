'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AxiosError } from 'axios';
import {
  IconUsers,
  IconUserPlus,
  IconUser,
  IconStar,
  IconBolt,
  IconChartBar,
  IconTrendingUp,
  IconCurrencyDollar,
  IconRefresh,
  IconSearch,
  IconChevronLeft,
  IconChevronRight
} from '@tabler/icons-react';
import { format } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { ApiErrorResponse } from '@/types/auth';

// ── Types ──────────────────────────────────────────────

interface AdminStats {
  totalUsers: number;
  newUsersThisMonth: number;
  freeUsers: number;
  creatorUsers: number;
  analysesToday: number;
  analysesThisWeek: number;
  analysesThisMonth: number;
}

interface RevenueData {
  revenue: number;
  currency: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  plan: 'FREE' | 'CREATOR' | null;
  analysesThisMonth: number;
  totalAnalyses: number;
  subscriptionStatus: 'active' | 'canceling' | null;
  createdAt: string;
  isRecent?: boolean;
}

interface UsersMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ── Helpers ────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 70) return '#16a34a';
  if (score >= 40) return '#d97706';
  return '#dc2626';
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

function getUsageColor(count: number): string {
  if (count >= 3) return 'text-[#dc2626]';
  if (count >= 2) return 'text-[#d97706]';
  return 'text-muted-foreground';
}

function getElapsedText(seconds: number): string {
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  return `${mins}m ago`;
}

// Parse stats response — handles both flat and nested shapes
function parseStats(data: Record<string, unknown>): AdminStats {
  const users = data.users as Record<string, number> | undefined;
  const analyses = data.analyses as Record<string, number> | undefined;
  if (users && analyses) {
    return {
      totalUsers: users.total ?? 0,
      newUsersThisMonth: users.newThisMonth ?? 0,
      freeUsers: users.free ?? 0,
      creatorUsers: users.creator ?? 0,
      analysesToday: analyses.today ?? 0,
      analysesThisWeek: analyses.thisWeek ?? 0,
      analysesThisMonth: analyses.thisMonth ?? 0
    };
  }
  return {
    totalUsers: (data.totalUsers as number) ?? 0,
    newUsersThisMonth: (data.newUsersThisMonth as number) ?? 0,
    freeUsers: (data.freeUsers as number) ?? 0,
    creatorUsers: (data.creatorUsers as number) ?? 0,
    analysesToday: (data.analysesToday as number) ?? 0,
    analysesThisWeek: (data.analysesThisWeek as number) ?? 0,
    analysesThisMonth: (data.analysesThisMonth as number) ?? 0
  };
}

// ── Stat Card ──────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  subtext
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
  subtext?: string;
}) {
  return (
    <div className='card-glow p-5'>
      <div
        className='mb-3 inline-flex rounded-[4px] p-2'
        style={{ backgroundColor: `${accent}15` }}
      >
        <Icon className='size-[18px]' style={{ color: accent }} />
      </div>
      <p className='font-heading text-3xl font-bold text-foreground'>
        {value}
      </p>
      <p className='mt-1 font-mono text-xs uppercase tracking-wider text-muted-foreground'>
        {label}
      </p>
      {subtext && (
        <p className='mt-1 text-xs text-muted-foreground'>{subtext}</p>
      )}
    </div>
  );
}

// ── Stats Skeleton ─────────────────────────────────────

function StatsCardsSkeleton() {
  return (
    <div className='grid gap-4 grid-cols-2 md:grid-cols-4'>
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className='card-glow h-[130px] bg-muted' />
      ))}
    </div>
  );
}

// ── Table Skeleton ─────────────────────────────────────

function TableSkeleton() {
  return (
    <div className='space-y-0'>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className='flex items-center gap-4 border-b border-border/50 px-5 py-3 last:border-0'
        >
          <Skeleton className='size-8 rounded-[4px] bg-muted' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-3 w-32 bg-muted' />
            <Skeleton className='h-2.5 w-48 bg-muted' />
          </div>
          <Skeleton className='h-5 w-16 bg-muted' />
          <Skeleton className='h-4 w-20 bg-muted' />
          <Skeleton className='h-4 w-20 bg-muted' />
          <Skeleton className='h-7 w-24 bg-muted' />
        </div>
      ))}
    </div>
  );
}

// ── Plan Badge ─────────────────────────────────────────

function PlanBadge({
  plan,
  subscriptionStatus
}: {
  plan: 'FREE' | 'CREATOR';
  subscriptionStatus?: 'active' | 'canceling' | null;
}) {
  if (plan === 'CREATOR') {
    const isCanceling = subscriptionStatus === 'canceling';
    return (
      <Badge
        variant='outline'
        className={cn(
          'font-mono text-xs',
          isCanceling
            ? 'border-amber-500/50 bg-amber-500/[0.08] text-amber-400'
            : 'border-cyan-500/50 bg-cyan-500/[0.08] text-cyan-400'
        )}
      >
        CREATOR{isCanceling ? ' (canceling)' : ''}
      </Badge>
    );
  }
  return (
    <Badge
      variant='outline'
      className='border-amber-500/50 bg-amber-500/[0.08] font-mono text-xs text-amber-400'
    >
      FREE
    </Badge>
  );
}

// ── Plan Distribution Bar ──────────────────────────────

function PlanDistribution({
  freeUsers,
  creatorUsers,
  totalUsers
}: {
  freeUsers: number;
  creatorUsers: number;
  totalUsers: number;
}) {
  const freePercent = totalUsers > 0 ? Math.round((freeUsers / totalUsers) * 100) : 0;
  const creatorPercent = totalUsers > 0 ? Math.round((creatorUsers / totalUsers) * 100) : 0;
  const conversionRate =
    totalUsers > 0
      ? Math.round((creatorUsers / totalUsers) * 1000) / 10
      : 0;

  return (
    <div className='card-glow p-5'>
      <h3 className='mb-1 font-heading text-lg font-bold text-foreground'>
        Plan Distribution
      </h3>

      <div className='mt-4 flex h-3 w-full overflow-hidden rounded-full'>
        <div
          className='transition-all duration-500'
          style={{
            width: `${freePercent}%`,
            backgroundColor: '#30363d',
            minWidth: freeUsers > 0 ? '8px' : '0'
          }}
        />
        <div
          className='transition-all duration-500'
          style={{
            width: `${creatorPercent}%`,
            backgroundColor: '#38bdf8',
            minWidth: creatorUsers > 0 ? '8px' : '0'
          }}
        />
      </div>

      <div className='mt-3 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className='size-2.5 rounded-full' style={{ backgroundColor: '#30363d' }} />
          <span className='text-xs text-muted-foreground'>
            FREE {freePercent}%
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='size-2.5 rounded-full' style={{ backgroundColor: '#38bdf8' }} />
          <span className='text-xs text-[#38bdf8]'>
            CREATOR {creatorPercent}%
          </span>
        </div>
      </div>

      <div className='mt-3 flex items-center justify-between border-t border-border/50 pt-3'>
        <span className='text-xs text-muted-foreground'>
          {freeUsers} Free users
        </span>
        <span className='text-xs text-[#38bdf8]'>
          {creatorUsers} Creator users
        </span>
      </div>

      <div className='mt-2 text-center'>
        <span
          className='font-mono text-sm font-medium'
          style={{ color: getScoreColor(conversionRate * 5) }}
        >
          {conversionRate}% conversion rate
        </span>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────

export default function AdminPage() {
  // Data state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersMeta, setUsersMeta] = useState<UsersMeta | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);

  // Loading state
  const [statsLoading, setStatsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [revenueLoading, setRevenueLoading] = useState(true);

  // Error state
  const [statsError, setStatsError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [elapsed, setElapsed] = useState(0);

  // Table state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  // Timer refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch functions ────────────────────────────────

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await apiClient.get('/admin/stats');
      const data = res.data?.data || res.data;
      setStats(parseStats(data));
    } catch (error) {
      const msg =
        (error as AxiosError<ApiErrorResponse>).response?.data?.message?.[0] ||
        'Failed to load stats';
      setStatsError(msg);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async (p: number = 1, q: string = '') => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const params: Record<string, string | number> = {
        page: p,
        limit: PER_PAGE
      };
      if (q.trim()) params.search = q.trim();

      const res = await apiClient.get('/admin/users', { params });
      const data = res.data?.data || res.data;
      const userList: AdminUser[] = data?.data || data?.results || [];
      setUsers(userList.filter((u) => u.role !== 'ADMIN'));
      setUsersMeta(data?.meta || null);
    } catch (error) {
      const msg =
        (error as AxiosError<ApiErrorResponse>).response?.data?.message?.[0] ||
        'Failed to load users';
      setUsersError(msg);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchRevenue = useCallback(async () => {
    setRevenueLoading(true);
    try {
      const res = await apiClient.get('/admin/revenue');
      const data = res.data?.data || res.data;
      setRevenue(data);
    } catch {
      setRevenue({ revenue: 0, currency: 'usd' });
    } finally {
      setRevenueLoading(false);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchStats(), fetchUsers(page, debouncedSearch), fetchRevenue()]);
    setLastUpdated(new Date());
    setElapsed(0);
  }, [fetchStats, fetchUsers, fetchRevenue, page, debouncedSearch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  // ── Mount + auto-refresh ───────────────────────────

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    autoRefreshRef.current = setInterval(() => {
      fetchAll();
    }, 60000);
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, [fetchAll]);

  // ── Debounced search ────────────────────────────────

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Fetch users when page or search changes
  useEffect(() => {
    fetchUsers(page, debouncedSearch);
  }, [page, debouncedSearch, fetchUsers]);

  const totalPages = usersMeta?.totalPages ?? 1;

  // ── Render ─────────────────────────────────────────

  return (
    <div className='flex-1 space-y-6 p-6 md:p-8'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='font-heading text-2xl font-bold text-foreground'>
            Admin Dashboard
          </h1>
          <p className='text-sm text-muted-foreground'>
            CloutIQ platform overview
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <span className='font-mono text-xs text-muted-foreground'>
            Updated {getElapsedText(elapsed)}
          </span>
          <Button
            variant='outline'
            size='sm'
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <IconRefresh
              className={cn('mr-1.5 size-3.5', refreshing && 'animate-spin')}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Section 1 — Stats Cards */}
      {statsLoading && !stats ? (
        <StatsCardsSkeleton />
      ) : statsError && !stats ? (
        <div className='card-glow p-8 text-center'>
          <p className='text-sm text-muted-foreground'>{statsError}</p>
          <Button
            variant='outline'
            size='sm'
            className='mt-3'
            onClick={fetchStats}
          >
            Retry
          </Button>
        </div>
      ) : stats ? (
        <div className='grid gap-4 grid-cols-2 md:grid-cols-4'>
          <StatCard
            label='Total Users'
            value={stats.totalUsers}
            icon={IconUsers}
            accent='#38bdf8'
          />
          <StatCard
            label='New This Month'
            value={stats.newUsersThisMonth}
            icon={IconUserPlus}
            accent='#16a34a'
            subtext='joined this month'
          />
          <StatCard
            label='Free Plan'
            value={stats.freeUsers}
            icon={IconUser}
            accent='#6b7280'
            subtext='free users'
          />
          <StatCard
            label='Creator Plan'
            value={stats.creatorUsers}
            icon={IconStar}
            accent='#d97706'
            subtext='paid users'
          />
          <StatCard
            label='Analyses Today'
            value={stats.analysesToday}
            icon={IconBolt}
            accent='#38bdf8'
          />
          <StatCard
            label='This Week'
            value={stats.analysesThisWeek}
            icon={IconChartBar}
            accent='#38bdf8'
          />
          <StatCard
            label='This Month'
            value={stats.analysesThisMonth}
            icon={IconTrendingUp}
            accent='#38bdf8'
            subtext='analyses this month'
          />
          <StatCard
            label='Revenue This Month'
            value={
              revenueLoading
                ? '...'
                : formatCurrency(revenue?.revenue ?? 0)
            }
            icon={IconCurrencyDollar}
            accent='#16a34a'
            subtext='USD this month'
          />
        </div>
      ) : null}

      {/* Section 2 — Plan Distribution */}
      {stats && (
        <PlanDistribution
          freeUsers={stats.freeUsers}
          creatorUsers={stats.creatorUsers}
          totalUsers={stats.totalUsers}
        />
      )}

      {/* Section 3 — Users Table */}
      <div className='card-glow'>
        <div className='flex items-center justify-between border-b border-border px-5 py-4'>
          <div>
            <h3 className='font-heading text-lg font-bold text-foreground'>
              Users
            </h3>
            <p className='text-xs text-muted-foreground'>
              {usersMeta ? `${usersMeta.total} users` : '\u2014'}{' '}
              {debouncedSearch && `matching "${debouncedSearch}"`}
            </p>
          </div>
          <div className='relative w-64'>
            <IconSearch className='absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search by name or email...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='h-8 pl-9 text-xs'
            />
          </div>
        </div>

        {usersLoading && users.length === 0 ? (
          <TableSkeleton />
        ) : usersError && users.length === 0 ? (
          <div className='p-8 text-center'>
            <p className='text-sm text-muted-foreground'>{usersError}</p>
            <Button
              variant='outline'
              size='sm'
              className='mt-3'
              onClick={() => fetchUsers(page, debouncedSearch)}
            >
              Retry
            </Button>
          </div>
        ) : users.length === 0 ? (
          <div className='p-8 text-center'>
            <p className='text-sm text-muted-foreground'>
              {debouncedSearch ? 'No users match your search' : 'No users yet'}
            </p>
          </div>
        ) : (
          <>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-border'>
                    <th className='px-5 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground'>
                      Name
                    </th>
                    <th className='px-5 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground'>
                      Email
                    </th>
                    <th className='px-5 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground'>
                      Plan
                    </th>
                    {/* <th className='px-5 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground'>
                      This Month
                    </th> */}
                    <th className='px-5 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground'>
                      Total
                    </th>
                    <th className='px-5 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground'>
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className='h-14 border-b border-border/50 last:border-0 hover:bg-card/50'
                    >
                      {/* Name */}
                      <td className='px-5 py-3'>
                        <div className='flex items-center gap-3'>
                          <div className='flex size-8 shrink-0 items-center justify-center rounded-[4px] bg-[#38bdf8]/20 font-mono text-sm font-medium text-[#38bdf8]'>
                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <p className='text-sm font-medium text-foreground'>
                            {user.name}
                          </p>
                        </div>
                      </td>

                      {/* Email */}
                      <td className='px-5 py-3'>
                        <p className='font-mono text-xs text-muted-foreground'>
                          {user.email}
                        </p>
                      </td>

                      {/* Plan badge */}
                      <td className='px-5 py-3'>
                        <PlanBadge
                          plan={(user.plan as 'FREE' | 'CREATOR') || 'FREE'}
                          subscriptionStatus={user.subscriptionStatus}
                        />
                      </td>

                      {/* This Month — hidden for now */}
                      {/* <td className='px-5 py-3'>
                        <span
                          className={cn(
                            'font-mono text-sm',
                            getUsageColor(user.analysesThisMonth)
                          )}
                        >
                          {user.analysesThisMonth}
                        </span>
                      </td> */}

                      {/* Total */}
                      <td className='px-5 py-3'>
                        <span className='font-mono text-sm text-muted-foreground'>
                          {user.totalAnalyses ?? 0}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className='px-5 py-3'>
                        <span className='font-mono text-xs text-muted-foreground'>
                          {format(new Date(user.createdAt), 'MMM d, yyyy')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {usersMeta && (
              <div className='flex items-center justify-between border-t border-border px-5 py-3'>
                <p className='font-mono text-xs text-muted-foreground'>
                  Page {page} of {totalPages} &middot; {usersMeta.total} total users
                </p>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <IconChevronLeft className='size-4' />
                    Previous
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <IconChevronRight className='size-4' />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
