'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import axios, { AxiosError } from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import {
  IconUpload,
  IconLoader2,
  IconFile,
  IconX
} from '@tabler/icons-react';

import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAnalysisStore } from '@/stores/analysis.store';
import { useAuthStore } from '@/stores/auth.store';
import apiClient from '@/lib/api-client';
import {
  trackScriptAnalyzed,
  trackLimitReached,
  trackUpgradeClicked,
  trackUpgradeCompleted,
  trackFileTranscribed,
  identifyUser
} from '@/lib/analytics';
import { AnalysisResults } from '@/features/analysis/components/analysis-results';
import { UpgradeModal } from '@/features/dashboard/components/upgrade-modal';
import type { Analysis, AnalysisLanguage } from '@/types/analysis';
import type { ApiErrorResponse, ApiSuccessResponse, User } from '@/types/auth';
import { pushToDataLayer, generateEventId } from '@/lib/gtm';

const languages: { code: AnalysisLanguage; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'ar', label: 'AR' },
  { code: 'hi', label: 'HI' },
  { code: 'es', label: 'ES' },
  { code: 'fr', label: 'FR' },
  { code: 'de', label: 'DE' },
  { code: 'tr', label: 'TR' },
  { code: 'bn', label: 'BN' }
];

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

// Rotating loading message sequences
const ANALYZE_MESSAGES = [
  'Reading your script...',
  'Analysing hook strength...',
  'Measuring emotional intensity...',
  'Predicting retention curve...',
  'Generating script rewrite...',
  'Building distribution pack...',
  'Calculating viral probability...',
  'Finalising your results...',
  'Almost there...'
];
const ANALYZE_INTERVAL = 4000;
const ANALYZE_DURATION = 20000;

const TRANSCRIBE_MESSAGES = [
  'Uploading your file...',
  'Transcribing audio...',
  'Processing segments...',
  'Cleaning up transcript...',
  'Almost done...'
];
const TRANSCRIBE_INTERVAL = 4000;
const TRANSCRIBE_DURATION = 15000;

const TRANSCRIBE_ANALYZE_MESSAGES = [
  'Uploading your file...',
  'Transcribing audio...',
  'Transcript ready. Analysing...',
  'Measuring hook strength...',
  'Predicting retention curve...',
  'Generating script rewrite...',
  'Building distribution pack...',
  'Finalising your results...',
  'Almost there...'
];
const TRANSCRIBE_ANALYZE_INTERVAL = 4000;
const TRANSCRIBE_ANALYZE_DURATION = 45000;

type LoadingMode = 'analyze' | 'transcribe' | 'transcribe-analyze';

function getLoadingConfig(mode: LoadingMode) {
  switch (mode) {
    case 'analyze':
      return {
        messages: ANALYZE_MESSAGES,
        interval: ANALYZE_INTERVAL,
        duration: ANALYZE_DURATION
      };
    case 'transcribe':
      return {
        messages: TRANSCRIBE_MESSAGES,
        interval: TRANSCRIBE_INTERVAL,
        duration: TRANSCRIBE_DURATION
      };
    case 'transcribe-analyze':
      return {
        messages: TRANSCRIBE_ANALYZE_MESSAGES,
        interval: TRANSCRIBE_ANALYZE_INTERVAL,
        duration: TRANSCRIBE_ANALYZE_DURATION
      };
  }
}

export default function DashboardPage() {
  const {
    currentAnalysis,
    isLoading,
    loadingMessage,
    selectedLanguage,
    scriptText,
    analysedAt,
    setAnalysis,
    setLoading,
    setLanguage,
    setScriptText,
    clearAnalysis
  } = useAnalysisStore();
  const { user, setUser } = useAuthStore();

  const router = useRouter();
  const searchParams = useSearchParams();

  const [file, setFile] = useState<File | null>(null);
  const [analyzeWithTranscription, setAnalyzeWithTranscription] =
    useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingMode, setLoadingMode] = useState<LoadingMode>('analyze');
  const [messageIndex, setMessageIndex] = useState(0);
  const [messageFade, setMessageFade] = useState(true);
  // 'idle' = not loading, 'loading' = in progress, 'completing' = done animating out
  const [phase, setPhase] = useState<'idle' | 'loading' | 'completing'>('idle');
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messageRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Handle ?checkout=success from Stripe checkout redirect
  useEffect(() => {
    if (searchParams.get('checkout') !== 'success') return;

    // Clean URL immediately
    window.history.replaceState({}, '', '/dashboard');
    toast.success('Welcome to Creator plan!');
    refreshUser();

    try {
      if (user?.id) trackUpgradeCompleted(user.id);
    } catch {}

    // Fire GTM purchase event with backend-confirmed data
    (async () => {
      try {
        const res = await apiClient.get('/api/latest-purchase');
        const purchase = res.data?.data;
        if (!purchase) return;

        // Deduplicate by transaction ID
        const firedTxns = JSON.parse(localStorage.getItem('gtm_fired_purchases') || '[]');
        if (firedTxns.includes(purchase.transactionId)) return;

        pushToDataLayer({
          event: 'purchase',
          event_id: generateEventId('purchase'),
          transaction_id: purchase.transactionId,
          user_id: user?.id,
          plan_id: 'creator_monthly',
          package_type: 'paid',
          value: purchase.amount,
          currency: purchase.currency,
          subscription_id: purchase.subscriptionId
        });

        firedTxns.push(purchase.transactionId);
        localStorage.setItem('gtm_fired_purchases', JSON.stringify(firedTxns));
      } catch {
        // Silently fail — purchase tracking is best-effort
      }
    })();
  }, []);

  // Progress bar + rotating messages tied to loading state
  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      setMessageIndex(0);
      setMessageFade(true);
      setPhase('loading');

      const config = getLoadingConfig(loadingMode);

      // Progress bar: fast to 70%, then asymptotically approaches 95%
      // Never stalls — always moving, no matter how long backend takes
      const start = Date.now();
      progressRef.current = setInterval(() => {
        const elapsed = Date.now() - start;
        const ratio = elapsed / config.duration;
        // Fast phase: 0→70% in estimated duration
        // Slow phase: 70→95% asymptotic (never reaches 95)
        const p = ratio < 1
          ? ratio * 70
          : 70 + 25 * (1 - 1 / (1 + (ratio - 1) * 0.5));
        setProgress(Math.min(p, 95));
      }, 100);

      // Rotating messages
      let step = 0;
      messageRef.current = setInterval(() => {
        setMessageFade(false);
        setTimeout(() => {
          step++;
          const maxIdx = config.messages.length - 1;
          setMessageIndex(Math.min(step, maxIdx));
          setMessageFade(true);
        }, 400);
      }, config.interval);
    } else {
      // Cleanup timers
      if (progressRef.current) {
        clearInterval(progressRef.current);
        progressRef.current = null;
      }
      if (messageRef.current) {
        clearInterval(messageRef.current);
        messageRef.current = null;
      }
      // On completion: jump to 100%, stay in completing phase, then transition out
      if (phase === 'loading') {
        setProgress(100);
        setPhase('completing');
        const t = setTimeout(() => {
          setProgress(0);
          setPhase('idle');
        }, 600);
        return () => clearTimeout(t);
      }
    }
    return () => {
      if (progressRef.current) {
        clearInterval(progressRef.current);
        progressRef.current = null;
      }
      if (messageRef.current) {
        clearInterval(messageRef.current);
        messageRef.current = null;
      }
    };
  }, [isLoading]);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      const f = accepted[0];
      if (f.size > MAX_FILE_SIZE) {
        toast.error('File must be under 500 MB');
        return;
      }
      setFile(f);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/mpeg': ['.mp3'],
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
      'audio/wav': ['.wav']
    },
    maxFiles: 1,
    multiple: false
  });

  async function handleAnalyze() {
    if (!scriptText.trim()) {
      toast.error('Please enter a script to analyse');
      return;
    }

    setLoadingMode('analyze');
    setLoading(true, 'Analysing your script...');
    try {
      const res = await apiClient.post<ApiSuccessResponse<Analysis>>(
        '/api/analyze',
        {
          scriptText: scriptText.trim(),
          language: selectedLanguage
        }
      );
      setAnalysis(res.data.data);
      refreshUser();
      try {
        if (user?.id) {
          trackScriptAnalyzed(
            user.id,
            user.plan,
            res.data.data.viralScore,
            selectedLanguage
          );
        }
      } catch {}
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleTranscribe() {
    if (!file) {
      toast.error('Please select a file to transcribe');
      return;
    }

    const mode: LoadingMode = analyzeWithTranscription
      ? 'transcribe-analyze'
      : 'transcribe';
    setLoadingMode(mode);
    setLoading(true, analyzeWithTranscription
      ? 'Transcribing & analysing...'
      : 'Transcribing...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (analyzeWithTranscription) {
        formData.append('analyze', 'true');
        formData.append('language', selectedLanguage);
      }

      // Post directly to backend API (bypass Vercel proxy which has body size limits)
      const { accessToken } = useAuthStore.getState();
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transcribe`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
          timeout: 0
        }
      );

      const data = res.data.data;

      if (data.transcript?.text) {
        setScriptText(data.transcript.text);
      }
      if (data.analysis) {
        setAnalysis(data.analysis);
        try {
          if (user?.id) {
            trackScriptAnalyzed(
              user.id,
              user.plan,
              data.analysis.viralScore,
              selectedLanguage
            );
          }
        } catch {}
      }
      try {
        if (user?.id) {
          trackFileTranscribed(
            user.id,
            user.plan,
            selectedLanguage,
            analyzeWithTranscription
          );
        }
      } catch {}
      refreshUser();
      setFile(null);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }

  function handleApiError(error: unknown) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const status = axiosError.response?.status;
    const errorType = axiosError.response?.data?.error;

    if (status === 403 && errorType === 'Plan Limit Reached') {
      setShowUpgradeModal(true);
      try {
        if (user?.id) {
          trackLimitReached(user.id, user.analysesThisMonth ?? 3);
        }
      } catch {}
      return;
    }

    const message =
      axiosError.response?.data?.message?.[0] ||
      'Something went wrong. Please try again.';
    toast.error(message);
  }

  async function refreshUser() {
    try {
      const res = await apiClient.get<ApiSuccessResponse<User>>(
        '/auth/who-am-i'
      );
      setUser(res.data.data);
    } catch {
      // Silently fail
    }
  }

  // Determine which view to show
  const viewKey = phase !== 'idle' ? 'loading' : currentAnalysis ? 'results' : 'input';

  return (
    <AnimatePresence mode='wait'>
      {/* Loading state */}
      {viewKey === 'loading' && (() => {
        const config = getLoadingConfig(loadingMode);
        const currentMessage = phase === 'completing'
          ? 'Done! Loading results...'
          : config.messages[messageIndex] || 'Processing...';

        return (
          <motion.div
            key='loading'
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className='flex flex-1 flex-col items-center justify-center gap-6 p-8'
          >
            <div className='h-[2px] w-full max-w-72 overflow-hidden rounded-full bg-muted'>
              <div
                className='h-full rounded-full bg-primary'
                style={{
                  width: `${progress}%`,
                  transition:
                    progress === 100
                      ? 'width 300ms ease-out'
                      : 'width 100ms linear'
                }}
              />
            </div>

            <div className='flex h-6 items-center'>
              <p
                className='font-mono text-[13px] text-muted-foreground transition-opacity duration-300'
                style={{ opacity: phase === 'completing' ? 1 : messageFade ? 1 : 0 }}
              >
                {currentMessage}
              </p>
            </div>

            <p className='font-mono text-[11px] text-muted-foreground/40'>
              {loadingMode === 'transcribe-analyze'
                ? 'This usually takes 30-60 seconds'
                : loadingMode === 'transcribe'
                  ? 'This usually takes 10-30 seconds'
                  : 'This usually takes 15-30 seconds'}
            </p>
          </motion.div>
        );
      })()}

      {/* Results state */}
      {viewKey === 'results' && currentAnalysis && (
        <motion.div
          key='results'
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className='flex-1 overflow-y-auto'
        >
          <div className='mx-auto max-w-4xl p-4 sm:p-6 md:p-8'>
            <div className='mb-6 flex items-center justify-between'>
              <h1 className='font-heading text-2xl font-bold text-foreground'>
                Analysis Results
              </h1>
              <Button variant='outline' size='sm' onClick={clearAnalysis}>
                New Analysis
              </Button>
            </div>
            {analysedAt && (
              <p className='mb-4 font-mono text-[11px] text-muted-foreground'>
                Analysed {formatTimestamp(analysedAt)} &middot;{' '}
                {selectedLanguage.toUpperCase()} &middot; Score:{' '}
                {currentAnalysis.viralScore}
              </p>
            )}
            <AnalysisResults
              analysis={currentAnalysis}
              scriptText={scriptText}
              language={selectedLanguage}
            />
          </div>
        </motion.div>
      )}

      {/* Input state */}
      {viewKey === 'input' && (
        <motion.div
          key='input'
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className='flex flex-1 flex-col items-center justify-center p-4 sm:p-6 md:p-8'
        >
          <div className='w-full max-w-2xl'>
            <div className='mb-6 text-center'>
              <h1 className='font-heading text-2xl font-bold text-foreground'>
                Analyse your script
              </h1>
              <p className='mt-1 text-[13px] text-muted-foreground'>
                Paste your script or upload a video to get AI-powered feedback
              </p>
            </div>

            {/* Script textarea */}
            <textarea
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder='Paste your video script here...'
              className='w-full rounded-[4px] border border-border bg-[rgba(13,17,23,0.6)] px-3.5 py-3 font-mono text-[13px] leading-[1.6] text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none'
              style={{
                minHeight: '120px',
                maxHeight: '220px',
                resize: 'none'
              }}
            />

            {/* File upload zone */}
            <div
              {...getRootProps()}
              className={`mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[4px] border-2 border-dashed p-6 transition-all duration-150 ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/60'
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className='flex items-center gap-2'>
                  <IconFile className='size-4 text-primary' />
                  <span className='text-[13px] text-foreground'>{file.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className='text-muted-foreground hover:text-foreground'
                  >
                    <IconX className='size-3.5' />
                  </button>
                </div>
              ) : (
                <>
                  <IconUpload className='size-5 text-muted-foreground/60' />
                  <p className='text-[13px] text-muted-foreground'>
                    Drop MP3, MP4, MOV, or WAV here (max 500 MB)
                  </p>
                </>
              )}
            </div>

            {/* Analyze toggle for transcription */}
            {file && (
              <label className='mt-2 flex items-center gap-2 text-[13px] text-muted-foreground'>
                <input
                  type='checkbox'
                  checked={analyzeWithTranscription}
                  onChange={(e) => setAnalyzeWithTranscription(e.target.checked)}
                />
                Also analyse after transcription
              </label>
            )}

            {/* Language selector */}
            <div className='mt-4 flex items-center gap-3'>
              <span className='font-mono text-[11px] text-muted-foreground'>Language:</span>
              <div className='flex flex-wrap gap-1'>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`rounded-[4px] px-3 py-1.5 text-[12px] font-medium transition-all duration-150 ${
                      selectedLanguage === lang.code
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'border border-border bg-transparent text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className='mt-6 flex gap-3'>
              <Button
                className='flex-1'
                size='lg'
                onClick={handleAnalyze}
                disabled={!scriptText.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <IconLoader2 className='mr-2 size-4 animate-spin' />
                    Analysing...
                  </>
                ) : (
                  'Analyse Script'
                )}
              </Button>
              {file && (
                <Button
                  variant='outline'
                  size='lg'
                  onClick={handleTranscribe}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <IconLoader2 className='mr-2 size-4 animate-spin' />
                      Transcribing...
                    </>
                  ) : (
                    'Transcribe'
                  )}
                </Button>
              )}
            </div>

            {/* Usage warning */}
            {user?.plan === 'FREE' && (user.analysesThisMonth ?? 0) >= 3 && (
              <p className='mt-4 text-center text-[12px] text-score-mid'>
                You&apos;ve used all 3 free analyses this month.{' '}
                <button
                  className='text-primary hover:underline'
                  onClick={() => setShowUpgradeModal(true)}
                >
                  Upgrade to Creator
                </button>
              </p>
            )}
          </div>

          <UpgradeModal
            open={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            onUpgradeClick={() => {
              try {
                if (user?.id) trackUpgradeClicked(user.id);
              } catch {}
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function formatTimestamp(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
