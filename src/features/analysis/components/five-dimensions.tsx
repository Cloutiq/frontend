'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { IconChevronDown } from '@tabler/icons-react';
import { getScoreColor } from '@/lib/score-utils';
import type { ScoreWithExplanation } from '@/types/analysis';

interface FiveDimensionsProps {
  hookStrength: ScoreWithExplanation;
  emotionalIntensity: ScoreWithExplanation;
  curiosityGap: ScoreWithExplanation;
  clarity: ScoreWithExplanation;
  viralProbability: ScoreWithExplanation;
}

const dimensionLabels: Record<string, string> = {
  hookStrength: 'Hook Strength',
  emotionalIntensity: 'Emotional Intensity',
  curiosityGap: 'Curiosity Gap',
  clarity: 'Clarity',
  viralProbability: 'Viral Probability'
};

function DimensionRow({
  label,
  dim,
  index
}: {
  label: string;
  dim: ScoreWithExplanation;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const color = getScoreColor(dim.score);

  return (
    <div
      className='group cursor-pointer border-b border-border/50 last:border-0'
      onClick={() => setOpen(!open)}
    >
      <div className='flex items-center gap-2 py-3 sm:gap-4 sm:py-3.5'>
        <span className='w-[80px] shrink-0 text-[11px] font-medium text-foreground sm:w-[140px] sm:text-[13px]'>
          {label}
        </span>

        <div className='relative h-[3px] flex-1 overflow-hidden rounded-full bg-muted'>
          <motion.div
            className='h-full rounded-full'
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${dim.score}%` }}
            transition={{
              duration: 0.8,
              delay: index * 0.1,
              ease: 'easeOut'
            }}
          />
        </div>

        <span
          className='min-w-[28px] text-right font-mono text-xs font-medium sm:min-w-[48px] sm:text-sm'
          style={{ color }}
        >
          {dim.score}
        </span>

        <IconChevronDown
          className='size-3.5 shrink-0 text-muted-foreground transition-transform duration-200'
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
        />
      </div>

      <div
        className='overflow-hidden transition-all duration-200 ease-out'
        style={{ maxHeight: open ? '200px' : '0', opacity: open ? 1 : 0 }}
      >
        <p className='pb-3 text-[13px] leading-relaxed text-muted-foreground'>
          {dim.explanation}
        </p>
      </div>
    </div>
  );
}

export function FiveDimensions(props: FiveDimensionsProps) {
  const dimensions = Object.entries(props) as [
    string,
    ScoreWithExplanation
  ][];

  return (
    <div className='card-glow p-4 sm:p-6'>
      <h3 className='section-title mb-5 font-heading text-lg font-semibold tracking-[0.01em] text-foreground'>
        Score Breakdown
      </h3>
      <div className='flex flex-col'>
        {dimensions.map(([key, dim], i) => (
          <DimensionRow
            key={key}
            label={dimensionLabels[key]}
            dim={dim}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
