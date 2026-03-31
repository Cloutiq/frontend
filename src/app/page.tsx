'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import Link from 'next/link';
import { useTheme } from 'next-themes';

import apiClient from '@/lib/api-client';
import { pushToDataLayer } from '@/lib/gtm';
import { getRefreshTokenCookie } from '@/lib/auth-cookie';
import type { ApiErrorResponse } from '@/types/auth';
import '@/styles/landing.css';

// ── Helpers ──────────────────────────────────────────────

function countUp(
  el: HTMLElement | null,
  target: number,
  dur: number,
  suffix?: string
) {
  if (!el) return;
  const t0 = performance.now();
  (function tick(now: number) {
    const p = Math.min((now - t0) / dur, 1);
    const v = Math.round(target * (1 - Math.pow(1 - p, 3)));
    el.textContent = v.toLocaleString() + (suffix || '');
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}

// ── FAQ Data ─────────────────────────────────────────────

const faqs = [
  {
    q: 'How accurate is the viral score?',
    a: 'The score is based on analysis of thousands of high and low-performing scripts across niches, combined with your specific niche and platform context. Scripts scoring above 75 consistently show better hook retention and completion rates. It is a strong predictor of structural content quality — not a guarantee of views, since distribution and timing also play a role.'
  },
  {
    q: 'Does it work for any niche?',
    a: "Yes. CloutIQ is personalised to your niche during onboarding — fitness, finance, comedy, beauty, food, lifestyle, business, and more. The hook rewrites and distribution pack are generated specifically for your category, not from a generic template."
  },
  {
    q: 'What languages are supported?',
    a: 'English, Arabic (with full RTL layout), Hindi, Spanish, French, German, Turkish, and Bengali. All eight produce native-quality output — generated in the target language, not translated from English.'
  },
  {
    q: 'Can I upload audio or video files?',
    a: 'Yes. Upload MP3, MP4, or WAV files up to 25MB. CloutIQ transcribes them and runs the full analysis on the transcript automatically — so you can analyse scripts you\'ve already recorded.'
  },
  {
    q: 'How is CloutIQ different from ChatGPT?',
    a: "ChatGPT is general-purpose. CloutIQ is purpose-built for short-form video pre-production — with a scoring model, hook rewrite engine, retention curve, and distribution pack all optimised for TikTok, Reels, and Shorts. You'd spend 20 minutes prompting ChatGPT to get half of what CloutIQ gives you in 10 seconds."
  },
  {
    q: 'Is there an agency or team plan?',
    a: 'Yes. The Agency plan includes team workspaces with client tagging, multiple member seats, and niche-specific benchmarking per client. Email team@cloutiq.ai to discuss pricing for your team size.'
  }
];

// ── Component ────────────────────────────────────────────

export default function LandingPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [ctaEmail, setCtaEmail] = useState('');
  const [ctaSubmitted, setCtaSubmitted] = useState(false);
  const [ctaLoading, setCtaLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check auth state for nav buttons
  useEffect(() => {
    const rt = getRefreshTokenCookie();
    if (rt) setIsLoggedIn(true);

    function handlePageShow(e: PageTransitionEvent) {
      if (e.persisted) {
        const rt = getRefreshTokenCookie();
        setIsLoggedIn(!!rt);
      }
    }
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  // refs for animated elements
  const heroScoreRef = useRef<HTMLDivElement>(null);
  const s1Ref = useRef<HTMLDivElement>(null);
  const s2Ref = useRef<HTMLDivElement>(null);
  const s3Ref = useRef<HTMLDivElement>(null);
  const b1Ref = useRef<HTMLDivElement>(null);
  const b2Ref = useRef<HTMLDivElement>(null);
  const b3Ref = useRef<HTMLDivElement>(null);
  const b4Ref = useRef<HTMLDivElement>(null);
  const baWrapRef = useRef<HTMLDivElement>(null);
  const badScoreRef = useRef<HTMLDivElement>(null);
  const goodScoreRef = useRef<HTMLDivElement>(null);
  const baBarRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => setMounted(true), []);

  // reveal on scroll
  useEffect(() => {
    const els = document.querySelectorAll('.landing-page .reveal');
    const ro = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('vis');
            ro.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    els.forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  }, []);

  // GTM: view_package when pricing section enters viewport (fire once)
  useEffect(() => {
    const pricingEl = document.getElementById('pricing');
    if (!pricingEl) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          pushToDataLayer({
            event: 'view_package',
            package_list_name: 'Pricing Plans',
            packages: [
              { plan_id: 'free_monthly', plan_name: 'Free', package_type: 'free', price: 0 },
              { plan_id: 'creator_monthly', plan_name: 'Creator', package_type: 'paid', price: 10 }
            ]
          });
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(pricingEl);
    return () => obs.disconnect();
  }, []);

  // hero count-up animations
  useEffect(() => {
    const timer = setTimeout(() => {
      countUp(s1Ref.current, 12847, 1600);
      countUp(s2Ref.current, 8, 800);

      // special s3 animation
      const s3 = s3Ref.current;
      if (s3) {
        const t0 = performance.now();
        (function tick(now: number) {
          const p = Math.min((now - t0) / 1400, 1);
          s3.textContent =
            Math.round(10 * (1 - Math.pow(1 - p, 3))) + 's';
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      }

      countUp(heroScoreRef.current, 85, 1800);

      const bars: [React.RefObject<HTMLDivElement | null>, string][] = [
        [{ current: b1Ref.current }, '88%'],
        [{ current: b2Ref.current }, '82%'],
        [{ current: b3Ref.current }, '79%'],
        [{ current: b4Ref.current }, '74%']
      ];
      bars.forEach(([ref, w], i) => {
        setTimeout(() => {
          if (ref.current) ref.current.style.width = w;
        }, 700 + i * 150);
      });
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // before/after intersection animation
  useEffect(() => {
    const wrap = baWrapRef.current;
    if (!wrap) return;
    let fired = false;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !fired) {
            fired = true;
            countUp(badScoreRef.current, 19, 900);
            countUp(goodScoreRef.current, 87, 1700);
            baBarRefs.current.forEach((b) => {
              if (b) b.style.width = b.dataset.w || '0%';
            });
            obs.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    obs.observe(wrap);
    return () => obs.disconnect();
  }, []);

  const handleCTA = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!ctaEmail) return;
      setCtaLoading(true);
      try {
        await apiClient.post('/api/waitlist', { email: ctaEmail });
        setCtaSubmitted(true);
      } catch (error) {
        const msg =
          (error as AxiosError<ApiErrorResponse>).response?.data
            ?.message?.[0] || 'Something went wrong';
        toast.error(msg);
      } finally {
        setCtaLoading(false);
      }
    },
    [ctaEmail]
  );

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className='landing-page'>
      {/* ── NAV ── */}
      <nav className='l-nav'>
        <Link href='/' className='nav-logo'>
          <span className='spark' />
          CloutIQ
        </Link>
        <div className='nav-links'>
          <span className='nav-link' onClick={() => scrollTo('how')}>
            How it works
          </span>
          <span className='nav-link' onClick={() => scrollTo('features')}>
            Features
          </span>
          <span className='nav-link' onClick={() => scrollTo('creator-plan')}>
            Pricing
          </span>
          <span className='nav-link' onClick={() => scrollTo('agencies')}>
            For Agencies
          </span>
        </div>
        <div className='nav-right'>
          <div className='t-pill'>
            <button
              className={`t-btn${mounted && resolvedTheme === 'dark' ? ' on' : ''}`}
              onClick={() => setTheme('dark')}
              title='Dark'
            >
              &#127769;
            </button>
            <button
              className={`t-btn${mounted && resolvedTheme === 'light' ? ' on' : ''}`}
              onClick={() => setTheme('light')}
              title='Light'
            >
              &#9728;&#65039;
            </button>
          </div>
          {isLoggedIn ? (
            <Link href='/dashboard' className='btn-primary'>
              Dashboard &rarr;
            </Link>
          ) : (
            <>
              <Link href='/login' className='btn-outline'>
                Log in
              </Link>
              <Link
                href='/register'
                className='btn-primary'
                onClick={() => pushToDataLayer({
                  event: 'cta_click',
                  cta_name: 'Start free',
                  cta_position: 'nav'
                })}
              >
                Start free &rarr;
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── TICKER ── */}
      <div className='ticker' aria-hidden='true'>
        <div className='ticker-track'>
          {[0, 1].map((k) => (
            <span key={k}>
              <span className='t-item'>Viral score 0-100</span>
              <span className='t-sep' />
              <span className='t-item'>Hook strength</span>
              <span className='t-sep' />
              <span className='t-item'>Retention curve</span>
              <span className='t-sep' />
              <span className='t-item'>3 hook rewrites</span>
              <span className='t-sep' />
              <span className='t-item'>B-roll suggestions</span>
              <span className='t-sep' />
              <span className='t-item'>Caption generator</span>
              <span className='t-sep' />
              <span className='t-item'>8 languages</span>
              <span className='t-sep' />
              <span className='t-item'>
                TikTok &middot; Reels &middot; Shorts
              </span>
              <span className='t-sep' />
              <span className='t-item'>Niche benchmarks</span>
              <span className='t-sep' />
              <span className='t-item'>Distribution pack</span>
              <span className='t-sep' />
            </span>
          ))}
        </div>
      </div>

      {/* ── HERO ── */}
      <div className='hero-wrap'>
        <div className='hero-inner'>
          <div>
            <div className='hero-tag fu1'>&#9889; AI Script Intelligence</div>
            <h1 className='hero-h1 fu2'>
              Know if your video
              <br />
              will <em>perform</em>
              <br />
              before you film.
            </h1>
            <p className='hero-p fu3'>
              Paste your script. Get a viral score, hook rewrites, retention
              curve, and a complete production pack in 10 seconds. Stop
              guessing. Start knowing.
            </p>
            <div className='hero-ctas fu4'>
              <Link
                href='/register'
                className='hero-cta-main'
                onClick={() => pushToDataLayer({
                  event: 'cta_click',
                  cta_name: 'Analyse my script free',
                  cta_position: 'hero_section'
                })}
              >
                Analyse my script free &rarr;
              </Link>
              <span
                className='hero-cta-ghost'
                onClick={() => scrollTo('how')}
              >
                See how it works
              </span>
            </div>
            <p className='hero-note fu4'>
              Free forever &middot; No credit card &middot; 3 analyses/month
              free
            </p>
            <div className='hero-stats fu5'>
              <div>
                <div className='hs-n' ref={s1Ref}>
                  0
                </div>
                <div className='hs-l'>Scripts analysed</div>
              </div>
              <div className='hs-div' />
              <div>
                <div className='hs-n' ref={s2Ref}>
                  0
                </div>
                <div className='hs-l'>Languages supported</div>
              </div>
              <div className='hs-div' />
              <div>
                <div className='hs-n' ref={s3Ref}>
                  0s
                </div>
                <div className='hs-l'>Average result time</div>
              </div>
            </div>
          </div>

          {/* Score card mockup */}
          <div className='hero-mockup fu6'>
            <div className='score-card'>
              <div className='sc-header'>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-m)',
                      fontSize: '10px',
                      letterSpacing: '.1em',
                      textTransform: 'uppercase',
                      color: 'var(--ink3)',
                      marginBottom: '4px'
                    }}
                  >
                    Fitness &middot; TikTok &middot; English
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--ink)'
                    }}
                  >
                    Your Script
                  </div>
                </div>
                <div className='sc-badge'>Top 12%</div>
              </div>
              <div className='sc-score' ref={heroScoreRef}>
                0
              </div>
              <div className='sc-score-l'>Viral Probability Score</div>
              <div className='sc-bars'>
                <div className='sc-row'>
                  <div className='sc-lbl'>Hook Strength</div>
                  <div className='sc-bg'>
                    <div
                      className='sc-bar'
                      ref={b1Ref}
                      style={{ background: 'var(--good)' }}
                    />
                  </div>
                  <div className='sc-val' style={{ color: 'var(--good)' }}>
                    88
                  </div>
                </div>
                <div className='sc-row'>
                  <div className='sc-lbl'>Curiosity Gap</div>
                  <div className='sc-bg'>
                    <div
                      className='sc-bar'
                      ref={b2Ref}
                      style={{ background: 'var(--accent)' }}
                    />
                  </div>
                  <div className='sc-val' style={{ color: 'var(--accent)' }}>
                    82
                  </div>
                </div>
                <div className='sc-row'>
                  <div className='sc-lbl'>Emotional Pull</div>
                  <div className='sc-bg'>
                    <div
                      className='sc-bar'
                      ref={b3Ref}
                      style={{ background: 'var(--accent)' }}
                    />
                  </div>
                  <div className='sc-val' style={{ color: 'var(--accent)' }}>
                    79
                  </div>
                </div>
                <div className='sc-row'>
                  <div className='sc-lbl'>Avg Retention</div>
                  <div className='sc-bg'>
                    <div
                      className='sc-bar'
                      ref={b4Ref}
                      style={{ background: 'var(--accent)' }}
                    />
                  </div>
                  <div className='sc-val' style={{ color: 'var(--accent)' }}>
                    74%
                  </div>
                </div>
              </div>
            </div>
            <div className='float-badge'>
              <div style={{ fontSize: '20px' }}>&#9998;&#65039;</div>
              <div>
                <div className='fb-text'>3 Hook Rewrites Ready</div>
                <div className='fb-sub'>
                  Click to copy &middot; Niche-specific
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── LOGO WALL ── */}
      <div className='logo-wall'>
        <div className='logo-wall-inner'>
          <div className='lw-label'>Trusted by creators at</div>
          <div className='lw-logos'>
            {[
              'FitnessFuel',
              'GrowthAgency',
              'CreatorLabs',
              'ViralStudio',
              'ContentOS',
              'ScaleCreator'
            ].map((n) => (
              <div key={n} className='lw-logo'>
                {n}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PROBLEM ── */}
      <section style={{ borderBottom: '1px solid var(--border)' }}>
        <div className='container'>
          <div className='reveal'>
            <div className='sec-eyebrow'>The problem</div>
            <h2 className='sec-title'>
              You&apos;re filming scripts that
              <br />
              were never going to work.
            </h2>
            <p className='sec-sub'>
              Most creators don&apos;t have a content problem. They have a
              pre-production problem. The video was flawed before the camera
              turned on.
            </p>
          </div>
          <div className='problem-grid reveal'>
            {[
              {
                num: '01',
                title: 'You post and hope',
                desc: "There's no system for knowing if your script is strong before you spend hours filming and editing. Every post is a guess."
              },
              {
                num: '02',
                title: 'Your hook loses them in 3 seconds',
                desc: 'TikTok data shows 40% of viewers decide to stay or scroll in the first 3 seconds. Most hooks are written to be safe, not to stop the scroll.'
              },
              {
                num: '03',
                title: "Agencies can't scale quality",
                desc: 'Managing 10 clients means 10 scripts a week with no objective quality filter. Senior time disappears into rewrites that should have been caught earlier.'
              },
              {
                num: '04',
                title: "You don't know why it flopped",
                desc: "Without pre-production data, you can't diagnose what went wrong. You just post again and hope the algorithm is kinder this time."
              }
            ].map((p) => (
              <div key={p.num} className='p-item'>
                <div className='p-num'>{p.num}</div>
                <div className='p-title'>{p.title}</div>
                <p className='p-desc'>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BEFORE / AFTER ── */}
      <section style={{ borderBottom: '1px solid var(--border)' }}>
        <div className='container'>
          <div className='reveal'>
            <div className='sec-eyebrow'>See the difference</div>
            <h2 className='sec-title'>
              Same creator. Same topic.
              <br />
              <em>Completely different result.</em>
            </h2>
            <p className='sec-sub'>
              One script gets 200 views. The other gets 200,000. Here is
              exactly why — and how CloutIQ spots it before you film.
            </p>
          </div>
          <div className='reveal' ref={baWrapRef}>
            <div className='ba-grid'>
              {/* Before */}
              <div className='ba-card bad'>
                <div className='ba-tag bad'>&#10060; Before CloutIQ</div>
                <div className='ba-score bad' ref={badScoreRef}>
                  0
                </div>
                <div className='ba-score-l'>Viral score</div>
                <p className='ba-script'>
                  &ldquo;Hey guys, so today I wanted to talk about something
                  I&apos;ve been thinking about for a while. I&apos;ve been
                  working out for 3 years and learned a lot, so I wanted to
                  share some tips&hellip;&rdquo;
                </p>
                <div className='ba-rows'>
                  {[
                    { label: 'Hook strength', val: '18', w: '18%' },
                    { label: 'Curiosity gap', val: '12', w: '12%' },
                    { label: 'Emotional pull', val: '21', w: '21%' },
                    { label: 'Avg retention', val: '28%', w: '28%' }
                  ].map((r, i) => (
                    <div key={r.label} className='ba-row'>
                      <div className='ba-rl'>{r.label}</div>
                      <div className='ba-bg'>
                        <div
                          className='ba-b bad'
                          data-w={r.w}
                          ref={(el) => {
                            baBarRefs.current[i] = el;
                          }}
                        />
                      </div>
                      <div className='ba-rv bad'>{r.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className='ba-mid'>
                <div className='ba-arrow'>
                  <svg viewBox='0 0 24 24' fill='none'>
                    <path
                      d='M5 12h14M12 5l7 7-7 7'
                      stroke='var(--accent)'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </div>
              </div>

              {/* After */}
              <div className='ba-card gd'>
                <div className='ba-tag gd'>&#10003; After CloutIQ rewrite</div>
                <div className='ba-score gd' ref={goodScoreRef}>
                  0
                </div>
                <div className='ba-score-l'>Viral score</div>
                <p className='ba-script'>
                  &ldquo;
                  <span className='hl'>
                    I got in the best shape of my life doing the one thing
                    every trainer told me not to do
                  </span>{' '}
                  — and I have the before photos to prove it.&rdquo;
                </p>
                <div className='ba-rows'>
                  {[
                    { label: 'Hook strength', val: '91', w: '91%' },
                    { label: 'Curiosity gap', val: '88', w: '88%' },
                    { label: 'Emotional pull', val: '84', w: '84%' },
                    { label: 'Avg retention', val: '73%', w: '73%' }
                  ].map((r, i) => (
                    <div key={r.label} className='ba-row'>
                      <div className='ba-rl'>{r.label}</div>
                      <div className='ba-bg'>
                        <div
                          className='ba-b gd'
                          data-w={r.w}
                          ref={(el) => {
                            baBarRefs.current[4 + i] = el;
                          }}
                        />
                      </div>
                      <div className='ba-rv gd'>{r.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className='ba-insight'>
              <div className='bi-ico'>&#128161;</div>
              <div className='bi-txt'>
                <strong>
                  The script took 60 seconds to rewrite. The difference in
                  views is enormous.
                </strong>{' '}
                CloutIQ tells you what makes your hook weak, gives you three
                stronger alternatives, and shows you exactly where viewers
                would have dropped off — before you spend 3 hours filming.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        id='how'
        style={{
          background: 'var(--bg2)',
          borderBottom: '1px solid var(--border)'
        }}
      >
        <div className='container'>
          <div className='reveal'>
            <div className='sec-eyebrow'>How it works</div>
            <h2 className='sec-title'>
              From script to production brief
              <br />
              in <em>10 seconds.</em>
            </h2>
            <p className='sec-sub'>
              No setup. No learning curve. Paste your script and walk away
              with everything you need to film something that performs.
            </p>
          </div>
          <div className='steps-grid reveal'>
            {[
              {
                num: '01',
                title: 'Paste your script',
                desc: 'Type it, paste it, or upload a video or audio file. CloutIQ reads everything — English, Arabic, Hindi, Spanish, French, German, Turkish, or Bengali.',
                tag: 'Takes 5 seconds'
              },
              {
                num: '02',
                title: 'Get your score',
                desc: 'A viral probability score, 5-dimension breakdown, hook quality rating, retention curve with drop-off timestamps, and specific fixes for every weakness.',
                tag: 'Results in 10 seconds'
              },
              {
                num: '03',
                title: 'Film the stronger version',
                desc: '3 hook rewrites in your niche voice, a full script rewrite, B-roll shot list, on-screen text timing, captions, and hashtags — all ready to copy.',
                tag: 'Post with confidence'
              }
            ].map((s) => (
              <div key={s.num} className='step-card'>
                <div className='step-num'>{s.num}</div>
                <div className='step-title'>{s.title}</div>
                <p className='step-desc'>{s.desc}</p>
                <span className='step-tag'>{s.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section
        id='features'
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className='container'>
          <div className='reveal'>
            <div className='sec-eyebrow'>What you get</div>
            <h2 className='sec-title'>
              Everything a content strategist
              <br />
              would tell you. <em>In one run.</em>
            </h2>
          </div>
          <div className='features-grid reveal'>
            {[
              {
                ico: '\u26A1',
                title: 'Viral Probability Score',
                desc: 'A single 0-100 score benchmarked against real performance data in your specific niche and platform. Not a generic model — calibrated to your category.',
                tag: 'Niche-calibrated \u2192'
              },
              {
                ico: '\uD83C\uDFAF',
                title: '5-Dimension Breakdown',
                desc: 'Hook Strength, Emotional Intensity, Curiosity Gap, Clarity, and Viral Probability — each scored with a written explanation of exactly why it\u2019s weak or strong.',
                tag: 'With written reasoning \u2192'
              },
              {
                ico: '\u270F\uFE0F',
                title: '3 Hook Rewrites',
                desc: "Stronger alternatives written in your niche's voice — not generic suggestions. Rewrites that use the patterns and language that actually perform in your category.",
                tag: 'Click to copy \u2192'
              },
              {
                ico: '\uD83D\uDCC9',
                title: 'Retention Curve',
                desc: 'See the exact timestamps where your audience would tap away and the specific reason why. Fix it before you film, not after you watch your analytics tank.',
                tag: '6 timestamp predictions \u2192'
              },
              {
                ico: '\uD83D\uDCE6',
                title: 'Full Distribution Pack',
                desc: 'Caption variants, hashtag sets, thumbnail concept, B-roll shot list, on-screen text with timing, pattern interrupts, and trending sound ideas. Every post, fully packaged.',
                tag: 'Ready to publish \u2192'
              },
              {
                ico: '\uD83C\uDF0D',
                title: '8 Languages, Native Quality',
                desc: 'English, Arabic (RTL), Hindi, Spanish, French, German, Turkish, and Bengali. Not translation — native output calibrated for each market and platform culture.',
                tag: 'RTL support included \u2192'
              }
            ].map((f) => (
              <div key={f.title} className='feat-card'>
                <span className='feat-ico'>{f.ico}</span>
                <div className='feat-title'>{f.title}</div>
                <p className='feat-desc'>{f.desc}</p>
                <span className='feat-tag'>{f.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section
        id='agencies'
        style={{
          background: 'var(--bg2)',
          borderBottom: '1px solid var(--border)'
        }}
      >
        <div className='container'>
          <div className='reveal'>
            <div className='sec-eyebrow'>Who it&apos;s for</div>
            <h2 className='sec-title'>
              Built for creators.
              <br />
              <em>Powerful enough for agencies.</em>
            </h2>
            <p className='sec-sub'>
              Whether you post three times a week or manage 15 clients,
              CloutIQ fits your workflow.
            </p>
          </div>
          <div className='audience-grid reveal'>
            <div className='aud-card'>
              <div className='aud-label'>For Creators</div>
              <div className='aud-title'>Stop posting and hoping.</div>
              <p className='aud-desc'>
                You work hard on your content. CloutIQ makes sure every video
                you film has the strongest possible chance of performing —
                before you press record.
              </p>
              <div className='aud-list'>
                {[
                  'Know your viral score before filming',
                  'Get 3 stronger hook alternatives instantly',
                  'See exactly where viewers would drop off',
                  'Walk away with captions, hashtags, and B-roll ideas',
                  'Personalised to your niche and platform'
                ].map((t) => (
                  <div key={t} className='aud-item'>
                    {t}
                  </div>
                ))}
              </div>
            </div>
            <div className='aud-card'>
              <div className='aud-label'>For Agencies</div>
              <div className='aud-title'>
                Scale quality without scaling headcount.
              </div>
              <p className='aud-desc'>
                Stop letting weak scripts reach your clients. CloutIQ becomes
                the quality gate between your junior writers and your client
                deliverables.
              </p>
              <div className='aud-list'>
                {[
                  'Objective quality filter before client review',
                  'Junior writers get scored feedback on every submission',
                  'Niche-specific benchmarks per client',
                  'Multilingual output for international clients',
                  'Show clients data, not opinions, on content quality'
                ].map((t) => (
                  <div key={t} className='aud-item'>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section
        id='pricing'
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className='container'>
          <div className='reveal' style={{ textAlign: 'center' }}>
            <div className='sec-eyebrow ctr'>Pricing</div>
            <h2 className='sec-title'>
              Simple pricing.
              <br />
              No surprises.
            </h2>
            <p className='sec-sub' style={{ margin: '0 auto' }}>
              Start free. Upgrade when you&apos;re ready. Cancel anytime.
            </p>
          </div>
          <div className='pricing-grid reveal'>
            {/* Free */}
            <div className='pricing-card'>
              <div className='p-tier'>Free</div>
              <div className='p-price'>
                $0<span>/mo</span>
              </div>
              <div className='p-period'>Forever free</div>
              <p className='p-desc-text'>
                Try CloutIQ on your next 3 scripts. No card required.
              </p>
              <hr className='p-divider' />
              <div className='p-features'>
                <div className='p-feat'>3 analyses per month</div>
                <div className='p-feat'>
                  Viral score + 5-dimension breakdown
                </div>
                <div className='p-feat'>3 hook rewrites per analysis</div>
                <div className='p-feat'>Retention curve</div>
                <div className='p-feat off'>Distribution pack</div>
                <div className='p-feat off'>Analysis history</div>
                <div className='p-feat off'>8 languages</div>
              </div>
              <Link
                href='/register'
                className='p-cta outlined'
                onClick={() => pushToDataLayer({
                  event: 'select_package',
                  plan_name: 'Free',
                  plan_id: 'free_monthly',
                  package_type: 'free',
                  cta_name: 'Start free'
                })}
              >
                Start free &rarr;
              </Link>
            </div>

            {/* Creator */}
            <div id='creator-plan' className='pricing-card featured'>
              <div className='p-tier'>Creator</div>
              <div className='p-price'>
                $10<span>/mo</span>
              </div>
              <div className='p-period'>
                Billed monthly &middot; Cancel anytime
              </div>
              <p className='p-desc-text'>
                Unlimited analyses. Everything you need to post with
                confidence every week.
              </p>
              <hr className='p-divider' />
              <div className='p-features'>
                <div className='p-feat'>Unlimited analyses</div>
                <div className='p-feat'>
                  Viral score + 5-dimension breakdown
                </div>
                <div className='p-feat'>
                  3 hook rewrites + full script rewrite
                </div>
                <div className='p-feat'>
                  Retention curve with timestamps
                </div>
                <div className='p-feat'>Full distribution pack</div>
                <div className='p-feat'>Analysis history</div>
                <div className='p-feat'>8 languages with RTL support</div>
              </div>
              <Link
                href='/register'
                className='p-cta solid'
                onClick={() => pushToDataLayer({
                  event: 'select_package',
                  plan_name: 'Creator',
                  plan_id: 'creator_monthly',
                  package_type: 'paid',
                  cta_name: 'Get Creator'
                })}
              >
                Get Creator &rarr;
              </Link>
            </div>

            {/* Agency */}
            <div className='pricing-card'>
              <div className='p-tier'>Agency</div>
              <div className='p-price' style={{ fontSize: '36px' }}>
                Custom
              </div>
              <div className='p-period'>Team pricing</div>
              <p className='p-desc-text'>
                Multi-client workspaces, team seats, client tagging, and
                priority support.
              </p>
              <hr className='p-divider' />
              <div className='p-features'>
                <div className='p-feat'>Everything in Creator</div>
                <div className='p-feat'>
                  Team workspace + client tagging
                </div>
                <div className='p-feat'>Multiple team member seats</div>
                <div className='p-feat'>
                  Niche benchmarking per client
                </div>
                <div className='p-feat'>Quality approval workflows</div>
                <div className='p-feat'>
                  Priority support + onboarding
                </div>
              </div>
              <a href='mailto:team@cloutiq.ai' className='p-cta outlined'>
                Talk to us &rarr;
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section
        style={{
          background: 'var(--bg2)',
          borderBottom: '1px solid var(--border)'
        }}
      >
        <div className='container'>
          <div className='reveal' style={{ textAlign: 'center' }}>
            <div className='sec-eyebrow ctr'>What creators say</div>
            <h2 className='sec-title'>
              They stopped guessing.
              <br />
              <em>So can you.</em>
            </h2>
          </div>
          <div className='testi-grid reveal'>
            {[
              {
                quote:
                  '\u201CI used to agonise over whether my hook was good enough. Now I know before I film. My average views went up 3x in the first month.\u201D',
                init: 'S',
                name: 'Sara M.',
                role: 'Fitness Creator \u00B7 TikTok'
              },
              {
                quote:
                  '\u201CWe run 12 client accounts. CloutIQ is the first step before any script goes to a senior. It\u2019s saved us at least 5 hours a week in rewrites.\u201D',
                init: 'J',
                name: 'James K.',
                role: 'Content Agency Owner'
              },
              {
                quote:
                  '\u201CThe Arabic output is genuinely native quality \u2014 not a translation. That alone is worth it for our MENA clients.\u201D',
                init: 'L',
                name: 'Layla R.',
                role: 'Digital Agency \u00B7 Dubai'
              }
            ].map((t) => (
              <div key={t.name} className='testi-card'>
                <div className='testi-stars'>&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <div className='testi-quote'>{t.quote}</div>
                <div className='testi-author'>
                  <div className='testi-av'>{t.init}</div>
                  <div>
                    <div className='testi-name'>{t.name}</div>
                    <div className='testi-role'>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ borderBottom: '1px solid var(--border)' }}>
        <div className='container'>
          <div className='reveal'>
            <div className='sec-eyebrow'>FAQ</div>
            <h2 className='sec-title'>
              Questions you&apos;re
              <br />
              probably already asking.
            </h2>
          </div>
          <div className='faq-list reveal'>
            {faqs.map((f, i) => (
              <div
                key={i}
                className={`faq-item${openFaq === i ? ' open' : ''}`}
              >
                <div
                  className='faq-q'
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {f.q}
                  <span className='faq-icon'>+</span>
                </div>
                <div className='faq-a'>{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className='cta-section'>
        <div className='container'>
          <div className='reveal'>
            <h2 className='cta-h2'>
              Your next video
              <br />
              deserves to <em>perform.</em>
            </h2>
            <p className='cta-p'>
              Join thousands of creators and agencies who analyse before they
              film. Start free — no card needed.
            </p>

            {ctaSubmitted ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '15px',
                  color: '#fff',
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  padding: '14px 24px',
                  maxWidth: '440px',
                  margin: '0 auto 16px'
                }}
              >
                <span>&#10003;</span>
                <span>
                  You&apos;re in. We&apos;ll be in touch before launch.
                </span>
              </div>
            ) : (
              <form onSubmit={handleCTA}>
                <div className='cta-form'>
                  <input
                    type='email'
                    className='cta-input'
                    placeholder='your@email.com'
                    required
                    value={ctaEmail}
                    onChange={(e) => setCtaEmail(e.target.value)}
                  />
                  <button
                    type='submit'
                    className='cta-btn'
                    disabled={ctaLoading}
                  >
                    {ctaLoading ? '...' : 'Get early access'}
                  </button>
                </div>
              </form>
            )}

            <div className='cta-note'>
              Free forever tier &middot; No credit card &middot; Unsubscribe
              anytime
            </div>
            <div
              style={{
                marginTop: '20px',
                fontSize: '14px',
                color: 'rgba(255,255,255,0.7)'
              }}
            >
              Already have an account?{' '}
              <Link
                href='/login'
                style={{
                  color: '#fff',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px'
                }}
              >
                Log in &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className='l-footer'>
        <div className='footer-inner'>
          <div className='footer-top'>
            <div>
              <div className='footer-logo'>
                <span className='spark' />
                CloutIQ
              </div>
              <div className='footer-tagline'>
                The pre-production intelligence layer for short-form video.
                Know before you film.
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className='f-badge'>TikTok</span>
                <span className='f-badge'>Reels</span>
                <span className='f-badge'>Shorts</span>
              </div>
            </div>
            <div>
              <div className='footer-col-title'>Product</div>
              <div className='footer-links-col'>
                <span
                  className='footer-link'
                  style={{ cursor: 'pointer' }}
                  onClick={() => scrollTo('how')}
                >
                  How it works
                </span>
                <span
                  className='footer-link'
                  style={{ cursor: 'pointer' }}
                  onClick={() => scrollTo('features')}
                >
                  Features
                </span>
                <span
                  className='footer-link'
                  style={{ cursor: 'pointer' }}
                  onClick={() => scrollTo('pricing')}
                >
                  Pricing
                </span>
                <Link href='/register' className='footer-link'>
                  Start free
                </Link>
              </div>
            </div>
            <div>
              <div className='footer-col-title'>For teams</div>
              <div className='footer-links-col'>
                <span
                  className='footer-link'
                  style={{ cursor: 'pointer' }}
                  onClick={() => scrollTo('agencies')}
                >
                  For agencies
                </span>
                <a href='mailto:team@cloutiq.ai' className='footer-link'>
                  Agency pricing
                </a>
                <Link href='/login' className='footer-link'>
                  Log in
                </Link>
              </div>
            </div>
            <div>
              <div className='footer-col-title'>Company</div>
              <div className='footer-links-col'>
                <Link href='/privacy' className='footer-link'>
                  Privacy
                </Link>
                <Link href='/terms' className='footer-link'>
                  Terms
                </Link>
                <a href='mailto:team@cloutiq.ai' className='footer-link'>
                  Contact
                </a>
              </div>
            </div>
          </div>
          <div className='footer-bottom'>
            <div className='footer-copy'>
              &copy; {new Date().getFullYear()} CloutIQ. All rights reserved.
            </div>
            <div className='f-badges'>
              <span className='f-badge'>8 Languages</span>
              <span className='f-badge'>GDPR Ready</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
