import Providers from '@/components/layout/providers';
import { ChatwootWidget } from '@/components/chatwoot';
import { Toaster } from '@/components/ui/sonner';
import { fontVariables } from '@/components/themes/font.config';
import ThemeProvider from '@/components/themes/theme-provider';
import { cn } from '@/lib/utils';
import { GTM_ID } from '@/lib/gtm';
import type { Metadata, Viewport } from 'next';
import NextTopLoader from 'nextjs-toploader';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import '../styles/globals.css';

const META_THEME_COLORS = {
  light: '#f8fafc',
  dark: '#0d1117'
};

export const metadata: Metadata = {
  title: 'CloutIQ',
  description:
    'AI-powered content intelligence for short-form video creators'
};

export const viewport: Viewport = {
  themeColor: META_THEME_COLORS.dark
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin='anonymous'
        />
        <link
          href='https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap'
          rel='stylesheet'
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('theme');
                if (t !== 'light') {
                  document.documentElement.classList.add('dark');
                  localStorage.setItem('theme', 'dark');
                  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '${META_THEME_COLORS.dark}');
                }
              } catch (_) {}
            `
          }}
        />
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`
          }}
        />
      </head>
      <body
        className={cn(
          'bg-background overflow-x-hidden overscroll-none font-sans antialiased',
          fontVariables
        )}
        suppressHydrationWarning
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height='0'
            width='0'
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <NextTopLoader color='#38bdf8' showSpinner={false} height={2} />
        <NuqsAdapter>
          <ThemeProvider
            attribute='class'
            defaultTheme='dark'
            disableTransitionOnChange
            enableColorScheme
          >
            <Providers>
              <Toaster />
              <ChatwootWidget />
              {children}
            </Providers>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
