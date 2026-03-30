'use client';

import { useState, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconCopy, IconCheck } from '@tabler/icons-react';
import type { ScriptRewrite as ScriptRewriteType } from '@/types/analysis';

interface ScriptRewriteProps {
  data: ScriptRewriteType;
  originalScript: string;
}

function parseMarkers(text: string) {
  const parts: Array<{ type: 'text' | 'pattern' | 'broll'; content: string }> =
    [];
  const regex = /\[(PATTERN INTERRUPT|B-ROLL):\s*([^\]]+)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({
      type: match[1] === 'PATTERN INTERRUPT' ? 'pattern' : 'broll',
      content: match[2]
    });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }
  return parts;
}

export function ScriptRewrite({ data, originalScript }: ScriptRewriteProps) {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'rewritten' | 'original'>('rewritten');
  const parts = parseMarkers(data.rewrittenScript);

  async function handleCopy() {
    await navigator.clipboard.writeText(data.rewrittenScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className='border-t border-border px-4 py-6 sm:px-6 sm:py-8'>
      <div className='mb-5 flex items-center justify-between'>
        <h3 className='section-title font-heading text-lg font-semibold tracking-[0.01em] text-foreground'>
          Script Rewrite
        </h3>
        <Button
          variant='ghost'
          size='sm'
          className='gap-1.5 text-xs'
          onClick={handleCopy}
        >
          {copied ? (
            <IconCheck className='size-3.5 text-score-high' />
          ) : (
            <IconCopy className='size-3.5' />
          )}
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>

      {/* Mobile tabs */}
      <div className='mb-4 flex gap-1 md:hidden'>
        <Button
          variant={tab === 'rewritten' ? 'default' : 'ghost'}
          size='sm'
          onClick={() => setTab('rewritten')}
        >
          Rewritten
        </Button>
        <Button
          variant={tab === 'original' ? 'default' : 'ghost'}
          size='sm'
          onClick={() => setTab('original')}
        >
          Original
        </Button>
      </div>

      <div className='grid gap-0 overflow-hidden rounded-[4px] border border-border md:grid-cols-2'>
        {/* Original */}
        <div className={`${tab === 'rewritten' ? 'hidden md:block' : ''} md:border-r md:border-border`}>
          <div className='border-b border-border/50 px-4 py-2'>
            <span className='font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground'>
              Original
            </span>
          </div>
          <div className='max-h-[350px] overflow-y-auto p-3 sm:max-h-[400px] sm:p-4'>
            <p className='whitespace-pre-wrap text-[13px] leading-[1.8] text-muted-foreground'>
              {originalScript}
            </p>
          </div>
        </div>

        {/* Rewritten */}
        <div className={tab === 'original' ? 'hidden md:block' : ''}>
          <div className='border-b border-border/50 px-4 py-2'>
            <span className='font-mono text-[10px] uppercase tracking-[0.12em] text-primary'>
              Rewritten
            </span>
          </div>
          <div className='max-h-[350px] overflow-y-auto p-3 sm:max-h-[400px] sm:p-4'>
            <p className='whitespace-pre-wrap text-[13px] leading-[1.8] text-foreground'>
              {parts.map((part, i) => (
                <Fragment key={i}>
                  {part.type === 'text' && part.content}
                  {part.type === 'pattern' && (
                    <span className='mx-0.5 inline rounded-[3px] border border-score-mid/25 bg-score-mid/12 px-1.5 py-0.5 font-mono text-[11px] text-score-mid'>
                      [PATTERN INTERRUPT: {part.content}]
                    </span>
                  )}
                  {part.type === 'broll' && (
                    <span className='mx-0.5 inline rounded-[3px] border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] text-primary'>
                      [B-ROLL: {part.content}]
                    </span>
                  )}
                </Fragment>
              ))}
            </p>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className='mt-5 flex flex-wrap gap-4'>
        {data.patternInterrupts.length > 0 && (
          <div>
            <span className='mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground'>
              Pattern Interrupts
            </span>
            <div className='flex flex-wrap gap-1'>
              {data.patternInterrupts.map((p, i) => (
                <Badge
                  key={i}
                  variant='outline'
                  className='rounded-[3px] border-score-mid/30 text-[11px] text-score-mid'
                >
                  {p}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {data.bRollSuggestions.length > 0 && (
          <div>
            <span className='mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground'>
              B-Roll Suggestions
            </span>
            <div className='flex flex-wrap gap-1'>
              {data.bRollSuggestions.map((b, i) => (
                <Badge
                  key={i}
                  variant='outline'
                  className='rounded-[3px] border-primary/30 text-[11px] text-primary'
                >
                  {b}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
