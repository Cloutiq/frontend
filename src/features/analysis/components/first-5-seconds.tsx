'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconCopy, IconCheck } from '@tabler/icons-react';
import type { First5Seconds as First5SecondsType } from '@/types/analysis';

interface First5SecondsProps {
  data: First5SecondsType;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button
      variant='ghost'
      size='sm'
      className='h-7 shrink-0 gap-1.5 text-xs opacity-100 sm:opacity-0 sm:transition-opacity sm:duration-150 sm:group-hover:opacity-100'
      onClick={handleCopy}
    >
      {copied ? (
        <IconCheck className='size-3.5 text-score-high' />
      ) : (
        <IconCopy className='size-3.5' />
      )}
    </Button>
  );
}

export function First5Seconds({ data }: First5SecondsProps) {
  return (
    <div className='border-t border-border px-4 py-6 sm:px-6 sm:py-8'>
      <h3 className='section-title mb-5 font-heading text-lg font-semibold tracking-[0.01em] text-foreground'>
        First 5 Seconds
      </h3>

      <div className='mb-4 flex items-center gap-2'>
        <Badge
          variant='outline'
          className='font-mono text-[10px] uppercase'
        >
          {data.openerType}
        </Badge>
      </div>

      <p className='mb-5 text-[13px] leading-relaxed text-foreground'>
        {data.hookQuality}
      </p>

      <div className='flex flex-col gap-2'>
        <span className='text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground'>
          Alternative Hooks
        </span>
        {data.alternativeHooks.map((hook, i) => (
          <div
            key={i}
            className='group flex items-start justify-between gap-3 border-l-2 border-primary/60 bg-muted/30 p-3 transition-colors duration-150 hover:bg-muted/50'
          >
            <p className='text-[13px] leading-relaxed text-foreground'>{hook}</p>
            <CopyButton text={hook} />
          </div>
        ))}
      </div>
    </div>
  );
}
