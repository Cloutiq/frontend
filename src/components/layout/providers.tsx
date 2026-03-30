'use client';
import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { PostHogProvider } from '@/components/layout/posthog-provider';
import { GtmTracker } from '@/components/gtm-tracker';

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export default function Providers({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <PostHogProvider>
      <GoogleOAuthProvider clientId={googleClientId}>
        <GtmTracker />
        {children}
      </GoogleOAuthProvider>
    </PostHogProvider>
  );
}
