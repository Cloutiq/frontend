'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { format } from 'date-fns';
import {
  IconFileText,
  IconArrowRight,
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconAlertTriangle,
  IconArrowLeft,
  IconLoader2
} from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth.store';
import apiClient from '@/lib/api-client';
import { getScoreColor } from '@/lib/score-utils';
import { AnalysisResults } from '@/features/analysis/components/analysis-results';
import type { ApiErrorResponse, ApiSuccessResponse } from '@/types/auth';
import type { AnalysisResult, AnalysisLanguage } from '@/types/analysis';

// Support both camelCase (NestJS default) and snake_case field names
interface HistoryEntryRaw {
  id: string;
  script_text?: string;
  scriptText?: string;
  language: string;
  viral_score?: number;
  viralScore?: number;
  created_at?: string;
  createdAt?: string;
  result?: AnalysisResult;
  analysis_result?: AnalysisResult;
}

interface HistoryEntry {
  id: string;
  scriptText: string;
  language: string;
  viralScore: number;
  createdAt: string;
  result?: AnalysisResult;
}

interface HistoryMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface HistoryResponse {
  data: HistoryEntryRaw[];
  meta: HistoryMeta;
}

function normalizeEntry(raw: HistoryEntryRaw): HistoryEntry {
  return {
    id: raw.id,
    scriptText: raw.scriptText || raw.script_text || '',
    language: raw.language || 'en',
    viralScore: raw.viralScore ?? raw.viral_score ?? 0,
    createdAt: raw.createdAt || raw.created_at || '',
    result: raw.result || raw.analysis_result
  };
}

const languageCodes: Record<string, string> = {
  en: 'EN',
  ar: 'AR',
  hi: 'HI',
  es: 'ES',
  fr: 'FR',
  de: 'DE',
  tr: 'TR',
  bn: 'BN'
};

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: 'Unknown date', time: '' };
    return {
      date: format(d, 'MMM dd, yyyy'),
      time: format(d, 'hh:mm a')
    };
  } catch {
    return { date: 'Unknown date', time: '' };
  }
}

export default function HistoryPage() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [meta, setMeta] = useState<HistoryMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchHistory = useCallback(
    async (p: number) => {
      if (!user?.id) return;
      setLoading(true);
      setError(false);
      try {
        const res = await apiClient.get<
          ApiSuccessResponse<HistoryResponse>
        >(`/api/creator/${user.id}/history`, {
          params: { page: p, limit: 10 }
        });
        const rawItems: HistoryEntryRaw[] = res.data.data.data || [];
        setEntries(rawItems.map(normalizeEntry));
        setMeta(res.data.data.meta);
        setPage(p);
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        const message =
          axiosError.response?.data?.message?.[0] ||
          'Failed to load history. Try again.';
        toast.error(message);
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  const handleViewDetails = useCallback(
    async (entry: HistoryEntry) => {
      // Fetch full analysis from detail endpoint (history list truncates scriptText)
      setDetailLoading(true);
      try {
        const res = await apiClient.get<ApiSuccessResponse<HistoryEntryRaw>>(
          `/api/analysis/${entry.id}`
        );
        const full = normalizeEntry(res.data.data);
        setSelectedEntry(full);
      } catch {
        // Fallback: use data from list (may have truncated scriptText but has result)
        setSelectedEntry(entry);
      } finally {
        setDetailLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  // Table header component (hidden on mobile — cards used instead)
  const tableHeader = (
    <div className='hidden grid-cols-[120px_1fr_80px_80px_120px] items-center border-b border-border bg-card/50 px-4 py-2 md:grid'>
      <span className='font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground'>
        Date
      </span>
      <span className='font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground'>
        Script Preview
      </span>
      <span className='font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground'>
        Language
      </span>
      <span className='font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground'>
        Score
      </span>
      <span className='font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground'>
        Action
      </span>
    </div>
  );

  // Loading state — real header + skeleton rows
  if (loading) {
    return (
      <div className='flex-1 p-4 sm:p-6 md:p-8'>
        <div className='mx-auto max-w-5xl'>
          {/* Page header — always visible */}
          <div className='mb-6 flex items-center justify-between'>
            <div>
              <h1 className='font-heading text-2xl font-bold text-foreground'>
                Analysis History
              </h1>
              <p className='mt-1 text-sm text-muted-foreground'>
                Your past script analyses
              </p>
            </div>
            <Badge variant='outline' className='font-mono text-xs'>
              &mdash; analyses
            </Badge>
          </div>

          {/* Table with real header + skeleton rows */}
          <div className='card-glow w-full overflow-hidden'>
            {tableHeader}
            {/* Mobile skeleton cards */}
            <div className='flex flex-col gap-3 p-3 md:hidden'>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className='rounded-[4px] border border-border/50 p-3'>
                  <div className='flex items-center justify-between'>
                    <Skeleton className='h-3 w-24 rounded-sm' />
                    <Skeleton className='h-6 w-8 rounded-sm' />
                  </div>
                  <Skeleton className='mt-2 h-3 w-full rounded-sm' />
                  <Skeleton className='mt-1 h-3 w-2/3 rounded-sm' />
                  <div className='mt-2 flex items-center gap-2'>
                    <Skeleton className='h-5 w-12 rounded-sm' />
                    <Skeleton className='h-2.5 w-16 rounded-sm' />
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop skeleton rows */}
            <div className='hidden md:block'>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className='grid h-16 grid-cols-[120px_1fr_80px_80px_120px] items-center border-b border-border/50 px-4'
                >
                  <div className='flex flex-col gap-1'>
                    <Skeleton className='h-3 w-24 rounded-sm' />
                    <Skeleton className='h-2.5 w-16 rounded-sm' />
                  </div>
                  <div className='flex flex-col gap-1 pr-4'>
                    <Skeleton className='h-3 w-48 rounded-sm' />
                    <Skeleton className='h-3 w-32 rounded-sm' />
                  </div>
                  <Skeleton className='h-5 w-12 rounded-sm' />
                  <Skeleton className='h-6 w-8 rounded-sm' />
                  <Skeleton className='h-8 w-[88px] rounded-sm' />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className='flex flex-1 flex-col items-center justify-center p-8'>
        <div className='card-glow flex w-full max-w-sm flex-col items-center gap-3 p-8'>
          <IconAlertTriangle className='size-8 text-score-mid' />
          <h1 className='font-heading text-lg font-bold text-foreground'>
            Could not load history
          </h1>
          <p className='text-center text-sm text-muted-foreground'>
            Check your connection and try again
          </p>
          <Button
            variant='outline'
            size='sm'
            className='mt-2'
            onClick={() => fetchHistory(page)}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (meta && meta.total === 0) {
    return (
      <div className='flex flex-1 flex-col items-center justify-center p-8'>
        <div className='card-glow flex w-full max-w-md flex-col items-center gap-3 border-2 border-dashed p-8'>
          <IconFileText className='size-10 text-muted-foreground' />
          <h1 className='font-heading text-xl font-bold text-foreground'>
            No analyses yet
          </h1>
          <p className='text-center text-sm text-muted-foreground'>
            Run your first script analysis to see your history here
          </p>
          <Link href='/dashboard'>
            <Button variant='outline' className='mt-2'>
              Analyse a script
              <IconArrowRight className='ml-1.5 size-4' />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Detail view — show full analysis
  if (selectedEntry) {
    const { date, time } = formatDate(selectedEntry.createdAt);
    const langCode = languageCodes[selectedEntry.language] || selectedEntry.language.toUpperCase();

    return (
      <div className='flex-1 p-4 sm:p-6 md:p-8'>
        <div className='mx-auto max-w-5xl'>
          {/* Back button + header */}
          <div className='mb-6'>
            <Button
              variant='ghost'
              size='sm'
              className='mb-3 gap-1.5 text-muted-foreground hover:text-foreground'
              onClick={() => setSelectedEntry(null)}
            >
              <IconArrowLeft className='size-4' />
              Back to History
            </Button>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='font-heading text-2xl font-bold text-foreground'>
                  Analysis Details
                </h1>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {date} at {time}
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <Badge variant='outline' className='font-mono text-[10px]'>
                  {langCode}
                </Badge>
                <span
                  className='font-heading text-3xl font-bold'
                  style={{ color: getScoreColor(selectedEntry.viralScore) }}
                >
                  {selectedEntry.viralScore}
                </span>
              </div>
            </div>
          </div>

          {/* Full analysis results or fallback */}
          {selectedEntry.result ? (
            <AnalysisResults
              analysis={{
                id: selectedEntry.id,
                viralScore: selectedEntry.viralScore,
                result: selectedEntry.result
              }}
              scriptText={selectedEntry.scriptText}
              language={(selectedEntry.language as AnalysisLanguage) || 'en'}
            />
          ) : (
            <div className='card-glow p-6'>
              <p className='mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground'>
                Script
              </p>
              <div className='max-h-60 overflow-y-auto'>
                <p className='whitespace-pre-wrap text-sm text-foreground'>
                  {selectedEntry.scriptText || 'No script text available'}
                </p>
              </div>
              <p className='mt-4 text-xs text-muted-foreground'>
                Full analysis breakdown is not available for this entry. Run a new analysis to see the full AI breakdown.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Data state — list view
  return (
    <div className='flex-1 p-6 md:p-8'>
      <div className='mx-auto max-w-5xl'>
        {/* Page header */}
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h1 className='font-heading text-2xl font-bold text-foreground'>
              Analysis History
            </h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              Your past script analyses
            </p>
          </div>
          {meta && (
            <Badge variant='outline' className='font-mono text-xs'>
              {meta.total} analyses
            </Badge>
          )}
        </div>

        {/* Table */}
        <div className='card-glow w-full overflow-hidden'>
          {tableHeader}

          {/* Mobile card rows */}
          <div className='flex flex-col gap-2 p-3 md:hidden'>
            {entries.map((entry) => {
              const { date: d, time: t } = formatDate(entry.createdAt);
              const lc = languageCodes[entry.language] || entry.language.toUpperCase();

              return (
                <div
                  key={entry.id}
                  className='cursor-pointer rounded-[4px] border border-border/50 p-3 transition-colors duration-150 active:bg-muted/20'
                  onClick={() => handleViewDetails(entry)}
                >
                  <div className='flex items-center justify-between'>
                    <span className='font-mono text-[10px] text-muted-foreground'>
                      {d} &middot; {t}
                    </span>
                    <span
                      className='font-heading text-xl font-bold'
                      style={{ color: getScoreColor(entry.viralScore) }}
                    >
                      {entry.viralScore}
                    </span>
                  </div>
                  <p className='mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-foreground'>
                    {entry.scriptText || 'No script text'}
                  </p>
                  <div className='mt-2 flex items-center gap-2'>
                    <Badge variant='outline' className='font-mono text-[10px]'>
                      {lc}
                    </Badge>
                    <span className='text-[10px] text-muted-foreground'>Tap to view</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table rows */}
          <div className='hidden md:block'>
            {entries.map((entry) => {
              const { date: d, time: t } = formatDate(entry.createdAt);
              const lc = languageCodes[entry.language] || entry.language.toUpperCase();

              return (
                <div
                  key={entry.id}
                  className='grid h-16 grid-cols-[120px_1fr_80px_80px_120px] items-center border-b border-border/50 px-4 transition-colors duration-150 hover:bg-muted/20'
                >
                  <div className='flex flex-col'>
                    <span className='font-mono text-xs text-muted-foreground'>
                      {d}
                    </span>
                    <span className='font-mono text-[10px] text-muted-foreground/70'>
                      {t}
                    </span>
                  </div>
                  <p className='truncate pr-4 text-sm text-foreground'>
                    {(entry.scriptText || '').length > 150
                      ? `${entry.scriptText.slice(0, 150)}...`
                      : entry.scriptText || 'No script text'}
                  </p>
                  <Badge variant='outline' className='w-fit font-mono text-[10px]'>
                    {lc}
                  </Badge>
                  <span
                    className='font-heading text-xl font-bold'
                    style={{ color: getScoreColor(entry.viralScore) }}
                  >
                    {entry.viralScore}
                  </span>
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-fit text-xs'
                    onClick={() => handleViewDetails(entry)}
                    disabled={detailLoading}
                  >
                    {detailLoading ? (
                      <IconLoader2 className='mr-1 size-3 animate-spin' />
                    ) : (
                      <IconEye className='mr-1 size-3' />
                    )}
                    View Details
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 0 && (
          <div className='mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-between'>
            <p className='font-mono text-xs text-muted-foreground'>
              {meta.total} analyses total
            </p>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={page <= 1}
                onClick={() => fetchHistory(page - 1)}
              >
                <IconChevronLeft className='size-4' />
                <span className='hidden sm:inline'>Previous</span>
              </Button>
              <span className='font-mono text-xs text-muted-foreground'>
                {page} / {meta.totalPages}
              </span>
              <Button
                variant='outline'
                size='sm'
                disabled={page >= meta.totalPages}
                onClick={() => fetchHistory(page + 1)}
              >
                <span className='hidden sm:inline'>Next</span>
                <IconChevronRight className='size-4' />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
