'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  IconCopy,
  IconCheck,
  IconMusic,
  IconChevronDown,
  IconMessageCircle,
  IconHash,
  IconPhoto,
  IconVideo,
  IconTypography,
  IconVolume
} from '@tabler/icons-react';
import type { DistributionPack as DistributionPackType } from '@/types/analysis';

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <Button
      variant='ghost'
      size='sm'
      className='h-7 shrink-0 gap-1.5 text-xs opacity-100 sm:opacity-0 sm:transition-opacity sm:duration-150 sm:group-hover:opacity-100'
      onClick={(e) => {
        e.stopPropagation();
        copy();
      }}
    >
      {copied ? (
        <IconCheck className='size-3.5 text-score-high' />
      ) : (
        <IconCopy className='size-3.5' />
      )}
    </Button>
  );
}

/* ── Mobile accordion section ── */
function AccordionSection({
  icon,
  title,
  count,
  defaultOpen,
  children
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div className='border-b border-border/50 last:border-b-0'>
      <button
        className='flex w-full items-center gap-2.5 py-3 text-left'
        onClick={() => setOpen(!open)}
      >
        <span className='text-muted-foreground'>{icon}</span>
        <span className='flex-1 text-[13px] font-medium text-foreground'>
          {title}
        </span>
        {count != null && (
          <span className='font-mono text-[10px] text-muted-foreground'>
            {count}
          </span>
        )}
        <IconChevronDown
          className='size-3.5 shrink-0 text-muted-foreground transition-transform duration-200'
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
        />
      </button>
      <div
        className='overflow-hidden transition-all duration-200 ease-out'
        style={{
          maxHeight: open ? '1000px' : '0',
          opacity: open ? 1 : 0
        }}
      >
        <div className='pb-3'>{children}</div>
      </div>
    </div>
  );
}

interface DistributionPackProps {
  data: DistributionPackType;
}

export function DistributionPack({ data }: DistributionPackProps) {
  const [hashtagsCopied, setHashtagsCopied] = useState(false);

  async function copyAllHashtags() {
    await navigator.clipboard.writeText(data.hashtags.join(' '));
    setHashtagsCopied(true);
    setTimeout(() => setHashtagsCopied(false), 1500);
  }

  /* ── Shared sub-components ── */

  const captionsContent = (
    <div className='flex flex-col gap-2'>
      {data.captionVariants.map((cap, i) => (
        <div
          key={i}
          className='group flex items-start justify-between gap-2 rounded-[4px] border border-border/50 bg-muted/20 p-3 transition-colors duration-150 hover:bg-muted/40'
        >
          <p className='text-[13px] leading-relaxed text-foreground'>{cap}</p>
          <CopyBtn text={cap} />
        </div>
      ))}
    </div>
  );

  const hashtagsContent = (
    <>
      <div className='mb-2 flex items-center justify-end'>
        <Button
          variant='ghost'
          size='sm'
          className='h-6 gap-1 text-xs'
          onClick={copyAllHashtags}
        >
          {hashtagsCopied ? (
            <IconCheck className='size-3 text-score-high' />
          ) : (
            <IconCopy className='size-3' />
          )}
          {hashtagsCopied ? 'Copied!' : 'Copy all'}
        </Button>
      </div>
      <div className='flex flex-wrap gap-1.5'>
        {data.hashtags.map((tag, i) => (
          <Badge
            key={i}
            variant='secondary'
            className='rounded-[3px] font-mono text-[11px]'
          >
            {tag}
          </Badge>
        ))}
      </div>
    </>
  );

  const thumbnailContent = (
    <div className='rounded-[4px] border border-border/50 bg-muted/20 p-3'>
      <p className='text-[13px] italic leading-relaxed text-foreground'>
        {data.thumbnailConcept}
      </p>
    </div>
  );

  const bRollContent = (
    <ol className='flex flex-col gap-1'>
      {data.bRollShotList.map((shot, i) => (
        <li
          key={i}
          className='flex items-start gap-2 text-[13px] text-foreground'
        >
          <span className='font-mono text-[10px] text-muted-foreground'>
            {i + 1}.
          </span>
          {shot}
        </li>
      ))}
    </ol>
  );

  const onScreenTextContent = (
    <div className='overflow-x-auto rounded-[4px] border border-border/50'>
      <table className='w-full text-[13px]'>
        <thead>
          <tr className='border-b border-border/50 bg-muted/30'>
            <th className='px-3 py-1.5 text-left font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground'>
              Text
            </th>
            <th className='px-3 py-1.5 text-left font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground'>
              Timing
            </th>
          </tr>
        </thead>
        <tbody>
          {data.onScreenText.map((item, i) => (
            <tr key={i} className='border-b border-border/50 last:border-0'>
              <td className='px-3 py-2 text-foreground'>{item.text}</td>
              <td className='px-3 py-2 font-mono text-[11px] text-muted-foreground'>
                {item.timing}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const trendingSoundsContent = (
    <div className='flex flex-col gap-1.5'>
      {data.trendingSoundSuggestions.map((sound, i) => (
        <div
          key={i}
          className='flex items-center gap-2 text-[13px] text-foreground'
        >
          <IconMusic className='size-3.5 text-muted-foreground' />
          {sound}
        </div>
      ))}
    </div>
  );

  return (
    <div className='card-glow p-4 sm:p-6'>
      <h3 className='section-title mb-4 font-heading text-lg font-semibold tracking-[0.01em] text-foreground sm:mb-5'>
        Distribution Pack
      </h3>

      {/* ── Mobile: accordion layout ── */}
      <div className='md:hidden'>
        <AccordionSection
          icon={<IconMessageCircle className='size-4' />}
          title='Captions'
          count={data.captionVariants.length}
          defaultOpen
        >
          {captionsContent}
        </AccordionSection>

        <AccordionSection
          icon={<IconHash className='size-4' />}
          title='Hashtags'
          count={data.hashtags.length}
        >
          {hashtagsContent}
        </AccordionSection>

        <AccordionSection
          icon={<IconPhoto className='size-4' />}
          title='Thumbnail Concept'
        >
          {thumbnailContent}
        </AccordionSection>

        <AccordionSection
          icon={<IconVideo className='size-4' />}
          title='B-Roll Shots'
          count={data.bRollShotList.length}
        >
          {bRollContent}
        </AccordionSection>

        {data.onScreenText.length > 0 && (
          <AccordionSection
            icon={<IconTypography className='size-4' />}
            title='On-Screen Text'
            count={data.onScreenText.length}
          >
            {onScreenTextContent}
          </AccordionSection>
        )}

        {data.trendingSoundSuggestions.length > 0 && (
          <AccordionSection
            icon={<IconVolume className='size-4' />}
            title='Trending Sounds'
            count={data.trendingSoundSuggestions.length}
          >
            {trendingSoundsContent}
          </AccordionSection>
        )}
      </div>

      {/* ── Desktop: 2-column grid ── */}
      <div className='hidden gap-6 md:grid md:grid-cols-2'>
        {/* Captions */}
        <div>
          <span className='mb-2 block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground'>
            Captions
          </span>
          {captionsContent}
        </div>

        {/* Hashtags */}
        <div>
          <div className='mb-2 flex items-center justify-between'>
            <span className='font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground'>
              Hashtags
            </span>
            <Button
              variant='ghost'
              size='sm'
              className='h-6 gap-1 text-xs'
              onClick={copyAllHashtags}
            >
              {hashtagsCopied ? (
                <IconCheck className='size-3 text-score-high' />
              ) : (
                <IconCopy className='size-3' />
              )}
              {hashtagsCopied ? 'Copied!' : 'Copy all'}
            </Button>
          </div>
          <div className='flex flex-wrap gap-1.5'>
            {data.hashtags.map((tag, i) => (
              <Badge
                key={i}
                variant='secondary'
                className='rounded-[3px] font-mono text-[11px]'
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Thumbnail Concept */}
        <div>
          <span className='mb-2 block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground'>
            Thumbnail Concept
          </span>
          {thumbnailContent}
        </div>

        {/* B-Roll Shots */}
        <div>
          <span className='mb-2 block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground'>
            B-Roll Shots
          </span>
          {bRollContent}
        </div>

        {/* On-Screen Text */}
        {data.onScreenText.length > 0 && (
          <div>
            <span className='mb-2 block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground'>
              On-Screen Text
            </span>
            {onScreenTextContent}
          </div>
        )}

        {/* Trending Sounds */}
        {data.trendingSoundSuggestions.length > 0 && (
          <div>
            <span className='mb-2 block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground'>
              Trending Sounds
            </span>
            {trendingSoundsContent}
          </div>
        )}
      </div>
    </div>
  );
}
