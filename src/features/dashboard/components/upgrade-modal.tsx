'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { IconCheck, IconX } from '@tabler/icons-react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onUpgradeClick?: () => void;
}

const benefits = [
  'Unlimited analyses',
  'All 8 languages',
  'Full distribution pack',
  'Priority processing'
];

export function UpgradeModal({
  open,
  onClose,
  onUpgradeClick
}: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    onUpgradeClick?.();
    setLoading(true);
    try {
      const res = await apiClient.post('/api/create-checkout');
      const checkoutUrl = res.data?.data?.checkoutUrl || res.data?.data?.url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        toast.error('Could not create checkout session');
      }
    } catch {
      toast.error('Upgrade is not available yet. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          {/* Overlay */}
          <motion.div
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className='card-glow relative z-10 mx-4 w-full max-w-md p-6 sm:mx-0 sm:p-8'
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <button
              onClick={onClose}
              className='absolute right-4 top-4 text-muted-foreground transition-colors duration-120 hover:text-foreground'
            >
              <IconX className='size-4' />
            </button>

            <h2 className='font-heading text-2xl font-bold text-foreground'>
              You&apos;ve reached your limit
            </h2>
            <p className='mt-1 font-mono text-[12px] text-muted-foreground'>
              <span className='text-score-low'>3</span>/3 free analyses used this month
            </p>

            <div className='mt-6 flex flex-col gap-3'>
              {benefits.map((b) => (
                <div key={b} className='flex items-center gap-2'>
                  <IconCheck className='size-4 text-score-high' />
                  <span className='text-[13px] text-foreground'>{b}</span>
                </div>
              ))}
            </div>

            <div className='mt-6'>
              <span className='font-heading text-3xl font-bold text-primary'>
                $10
              </span>
              <span className='text-[13px] text-muted-foreground'> / month</span>
            </div>

            <Button
              className='mt-6 w-full'
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading ? 'Redirecting...' : 'Upgrade to Creator'}
            </Button>
            <p className='mt-2 text-center text-[11px] text-muted-foreground'>
              By subscribing you agree to our{' '}
              <a href='/terms' className='underline hover:text-foreground'>
                Terms of Service
              </a>{' '}
              including the payment and cancellation terms.
            </p>

            <button
              onClick={onClose}
              className='mt-3 w-full text-center text-[13px] text-muted-foreground transition-colors duration-120 hover:text-foreground'
            >
              Maybe later
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
