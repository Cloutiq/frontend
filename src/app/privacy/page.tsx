import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | CloutIQ',
  description:
    'Privacy Policy for CloutIQ — AI-powered content intelligence for short-form video creators.'
};

export default function PrivacyPage() {
  return (
    <div className='min-h-screen bg-background'>
      <div className='mx-auto max-w-3xl px-6 py-12'>
        <Link
          href='/'
          className='mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground'
        >
          &larr; Back to home
        </Link>

        <div className='card-glow p-8'>
          <h1 className='mb-2 font-heading text-3xl font-bold text-foreground'>
            Privacy Policy
          </h1>
          <p className='mb-8 font-mono text-sm text-muted-foreground'>
            cloutiq.ai
          </p>

          {/* Termly embed placeholder — replace the div below with the Termly
              embed script from your Termly dashboard (Publishing > Embed Code).
              Example:
              <div
                name="termly-embed"
                data-id="YOUR_TERMLY_POLICY_ID"
                data-type="iframe"
              />
              <script src="https://app.termly.io/embed-policy.min.js" />
          */}
          <div id='termly-embed' className='min-h-[200px]'>
            <p className='text-sm text-muted-foreground'>
              Our privacy policy is being prepared and will be available here
              shortly. For questions, contact{' '}
              <a
                href='mailto:team@cloutiq.ai'
                className='text-primary hover:underline'
              >
                team@cloutiq.ai
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
