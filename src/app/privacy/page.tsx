import Link from 'next/link';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

export const metadata: Metadata = {
  title: 'Privacy Policy | CloutIQ',
  description:
    'Privacy Policy for CloutIQ — AI-powered content intelligence for short-form video creators.'
};

export default async function PrivacyPage() {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.get('cloutiq_auth')?.value === '1';
  const backHref = isLoggedIn ? '/dashboard' : '/';
  const backLabel = isLoggedIn ? 'Back to dashboard' : 'Back to home';

  const htmlPath = path.join(
    process.cwd(),
    'src/app/privacy/privacy-content.html'
  );
  const privacyHtml = fs.readFileSync(htmlPath, 'utf-8').replace(/\r\n/g, '\n');

  return (
    <div className='min-h-screen bg-background'>
      <div className='mx-auto max-w-3xl px-6 py-12'>
        <Link
          href={backHref}
          className='mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground'
        >
          &larr; {backLabel}
        </Link>

        <div className='card-glow p-8'>
          <h1 className='mb-2 font-heading text-3xl font-bold text-foreground'>
            Privacy Policy
          </h1>
          <p className='mb-8 font-mono text-sm text-muted-foreground'>
            cloutiq.ai
          </p>

          <div
            className='privacy-termly-embed'
            dangerouslySetInnerHTML={{ __html: privacyHtml }}
          />
        </div>
      </div>
    </div>
  );
}
