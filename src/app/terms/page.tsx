import Link from 'next/link';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | CloutIQ',
  description:
    'Terms of Service for CloutIQ — AI-powered content intelligence for short-form video creators.'
};

export default async function TermsPage() {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.get('cloutiq_auth')?.value === '1';
  const backHref = isLoggedIn ? '/dashboard' : '/';
  const backLabel = isLoggedIn ? 'Back to dashboard' : 'Back to home';

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
            CloutIQ — Terms of Service
          </h1>
          <p className='mb-8 font-mono text-sm text-muted-foreground'>
            Effective Date: March 26, 2026 &middot; cloutiq.ai
          </p>

          <div className='prose-sm space-y-6 text-sm leading-relaxed text-muted-foreground'>
            <p>
              Please read these Terms of Service carefully before using CloutIQ.
              By creating an account or using any part of the CloutIQ service,
              you agree to be bound by these terms. If you do not agree, do not
              use the service.
            </p>

            {/* 1 */}
            <section>
              <h2 className='mb-3 font-heading text-lg font-bold text-foreground'>
                1. About CloutIQ
              </h2>
              <p>
                CloutIQ is an AI-powered pre-production intelligence tool for
                short-form video content creators and agencies. The service
                analyses script text and audio or video transcripts to generate a
                viral probability score, scoring breakdowns, hook rewrite
                suggestions, retention curve predictions, and a distribution
                pack. CloutIQ is operated by Abdullah A. and is accessible at
                cloutiq.ai.
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className='mb-3 font-heading text-lg font-bold text-foreground'>
                2. What CloutIQ Does and Does Not Guarantee
              </h2>
              <p>
                CloutIQ provides AI-generated analysis based on patterns in
                short-form video content. The scores, predictions, and
                suggestions provided are intended to assist creators in making
                informed pre-production decisions. They are not guarantees of any
                specific outcome.
              </p>
              <p className='mt-3'>CloutIQ makes no guarantee that:</p>
              <ul className='mt-2 list-disc space-y-1 pl-6'>
                <li>
                  Any script scoring above any threshold will achieve a specific
                  number of views, shares, or followers
                </li>
                <li>
                  Any rewritten hook will outperform the original in practice
                </li>
                <li>
                  The retention curve predictions will match actual viewer
                  behaviour on any specific platform
                </li>
                <li>
                  The distribution pack recommendations will result in increased
                  reach or engagement
                </li>
                <li>
                  The service will be free from errors, interruptions, or
                  inaccuracies at all times
                </li>
              </ul>
              <p className='mt-3'>
                Content performance is affected by many variables outside
                CloutIQ&apos;s control, including platform algorithm changes,
                posting time, audience size, trends, and production quality.
                CloutIQ scores script quality, not guaranteed virality.
              </p>
            </section>

            {/* 3 */}
            <section>
              <h2 className='mb-3 font-heading text-lg font-bold text-foreground'>
                3. Payment Terms
              </h2>

              <h3 className='mb-2 text-sm font-semibold text-foreground'>
                Plans and pricing
              </h3>
              <p>CloutIQ offers the following subscription plans:</p>
              <ul className='mt-2 list-disc space-y-1 pl-6'>
                <li>
                  <strong>Free Plan:</strong> 3 script analyses per calendar
                  month at no charge. No credit card required.
                </li>
                <li>
                  <strong>Creator Plan:</strong> Unlimited script analyses per
                  month at $10.00 USD per month, billed monthly.
                </li>
                <li>
                  <strong>Agency Plan:</strong> Available on request for agencies
                  and teams. Contact team@cloutiq.ai for details.
                </li>
              </ul>

              <h3 className='mb-2 mt-4 text-sm font-semibold text-foreground'>
                Billing
              </h3>
              <p>
                Creator Plan subscriptions are billed on a recurring monthly
                basis. Your first payment is taken at the time of upgrade.
                Subsequent payments are taken on the same date each month. All
                payments are processed securely through Stripe. CloutIQ does not
                store your card details.
              </p>

              <h3 className='mb-2 mt-4 text-sm font-semibold text-foreground'>
                Cancellation policy
              </h3>
              <p>
                You may cancel your Creator Plan subscription at any time from
                your account settings page. Cancellation takes effect at the end
                of the current billing period. You retain access to Creator Plan
                features until that date. CloutIQ does not pro-rate partial
                months.
              </p>

              <h3 className='mb-2 mt-4 text-sm font-semibold text-foreground'>
                Refund policy
              </h3>
              <p>
                CloutIQ does not offer refunds on subscription payments already
                processed. If you believe a payment has been taken in error,
                contact team@cloutiq.ai within 7 days of the charge and we will
                review the case. Refunds are issued at CloutIQ&apos;s sole
                discretion.
              </p>

              <h3 className='mb-2 mt-4 text-sm font-semibold text-foreground'>
                Price changes
              </h3>
              <p>
                CloutIQ reserves the right to change subscription pricing.
                Updated pricing will be posted on the website. Continued use of
                the service after the effective date of a price change
                constitutes acceptance of the new price.
              </p>
            </section>

            {/* 4 */}
            <section>
              <h2 className='mb-3 font-heading text-lg font-bold text-foreground'>
                4. Use of Script Content and AI Training
              </h2>
              <p>
                When you submit a script or upload a media file for analysis,
                CloutIQ processes the content solely for the purpose of
                generating your analysis results. CloutIQ does not sell your
                script content to third parties.
              </p>

              <h3 className='mb-2 mt-4 text-sm font-semibold text-foreground'>
                Anonymised benchmark data
              </h3>
              <p>
                By using CloutIQ, you grant CloutIQ a non-exclusive,
                royalty-free licence to use anonymised, aggregated data derived
                from your analyses — including scores, niche category, platform,
                language, and (where provided) post-performance metrics — to
                improve the accuracy and quality of CloutIQ&apos;s scoring
                models and benchmark database.
              </p>
              <p className='mt-3'>
                This means: CloutIQ may record that a fitness script in English
                received a hook strength score of 82 and subsequently received
                47,000 views. CloutIQ will never record or share the actual text
                of your script, your personal identity, or your account details
                in this dataset. The data is used only to make CloutIQ&apos;s
                scores more accurate for all users over time.
              </p>
              <p className='mt-3'>
                If you have questions about how your data is used in the
                benchmark dataset, contact team@cloutiq.ai.
              </p>
            </section>

            {/* 5 */}
            <section>
              <h2 className='mb-3 font-heading text-lg font-bold text-foreground'>
                5. Account Termination
              </h2>

              <h3 className='mb-2 text-sm font-semibold text-foreground'>
                Termination by you
              </h3>
              <p>
                You may close your CloutIQ account at any time by contacting
                team@cloutiq.ai. Upon closure, your account data and analysis
                history will be deleted within 30 days in accordance with our
                Privacy Policy. Anonymised benchmark data contributed prior to
                closure is not deleted as it cannot be re-identified.
              </p>

              <h3 className='mb-2 mt-4 text-sm font-semibold text-foreground'>
                Termination by CloutIQ
              </h3>
              <p>
                CloutIQ reserves the right to suspend or permanently close any
                account that:
              </p>
              <ul className='mt-2 list-disc space-y-1 pl-6'>
                <li>Violates these Terms of Service</li>
                <li>
                  Uses the service to submit content that is illegal, harmful, or
                  abusive
                </li>
                <li>
                  Attempts to reverse-engineer, scrape, or extract the CloutIQ
                  scoring model or API responses at scale
                </li>
                <li>
                  Provides false information during account creation or
                  subscription
                </li>
                <li>
                  Has an outstanding unpaid balance on a subscription account
                </li>
              </ul>
              <p className='mt-3'>
                In cases of termination by CloutIQ for a material breach, no
                refund will be issued for the current billing period. CloutIQ
                will provide notice of termination by email where reasonably
                practicable.
              </p>
            </section>

            {/* 6 */}
            <section>
              <h2 className='mb-3 font-heading text-lg font-bold text-foreground'>
                6. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by applicable law, CloutIQ and
                its operator shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages arising out of or
                related to your use of the service. This includes, without
                limitation:
              </p>
              <ul className='mt-2 list-disc space-y-1 pl-6'>
                <li>
                  Loss of revenue, views, followers, or business opportunity
                  resulting from content that received a high CloutIQ score but
                  did not perform as expected
                </li>
                <li>
                  Any decision made by you in reliance on CloutIQ&apos;s scores,
                  rewrites, or predictions
                </li>
                <li>
                  Interruptions to the service caused by third-party
                  infrastructure providers including Vercel, DigitalOcean,
                  Anthropic, or OpenAI
                </li>
                <li>Loss or corruption of analysis data</li>
              </ul>
              <p className='mt-3'>
                CloutIQ&apos;s total liability to you for any claim arising from
                use of the service shall not exceed the total amount paid by you
                to CloutIQ in the 3 months preceding the event giving rise to
                the claim.
              </p>
            </section>

            {/* 7 */}
            <section>
              <h2 className='mb-3 font-heading text-lg font-bold text-foreground'>
                7. Intellectual Property
              </h2>
              <p>
                CloutIQ and its scoring methodology, user interface, and branding
                are the property of CloutIQ and its operator. You may not copy,
                reproduce, or distribute any part of the CloutIQ service without
                written permission.
              </p>
              <p className='mt-3'>
                Analysis output generated by CloutIQ — including hook rewrites,
                script rewrites, and distribution pack content — is provided for
                your personal or commercial use. You own the original script
                content you submitted. CloutIQ does not claim ownership of your
                content or the AI-generated output delivered to you.
              </p>
            </section>

            {/* 8 */}
            <section>
              <h2 className='mb-3 font-heading text-lg font-bold text-foreground'>
                8. Governing Law
              </h2>
              <p>
                These Terms of Service are governed by and construed in
                accordance with the laws of the United Arab Emirates. Any dispute
                arising out of or in connection with these Terms shall be subject
                to the exclusive jurisdiction of the courts of the United Arab
                Emirates.
              </p>
              <p className='mt-3'>
                If you are accessing CloutIQ from outside the UAE, you are
                responsible for compliance with local laws to the extent
                applicable. The service is intended for use by adults aged 18 and
                over.
              </p>
            </section>

            {/* 9 */}
            <section>
              <h2 className='mb-3 font-heading text-lg font-bold text-foreground'>
                9. Changes to These Terms
              </h2>
              <p>
                CloutIQ may update these Terms of Service from time to time. When
                we do, we will revise the effective date at the top of this page.
                Continued use of the service after the effective date of any
                update constitutes your acceptance of the revised terms.
              </p>
            </section>

            {/* 10 */}
            <section>
              <h2 className='mb-3 font-heading text-lg font-bold text-foreground'>
                10. Contact
              </h2>
              <p>
                For any questions about these Terms of Service, contact us at:
              </p>
              <ul className='mt-2 list-disc space-y-1 pl-6'>
                <li>
                  Email:{' '}
                  <a
                    href='mailto:team@cloutiq.ai'
                    className='text-primary hover:underline'
                  >
                    team@cloutiq.ai
                  </a>
                </li>
                <li>
                  Website:{' '}
                  <a
                    href='https://cloutiq.ai'
                    className='text-primary hover:underline'
                  >
                    cloutiq.ai
                  </a>
                </li>
              </ul>
              <p className='mt-3'>
                We aim to respond to all legal and account enquiries within 2
                business days.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
