'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { isClerkConfigured } from '@/utils/auth';
import { 
  MockClerkProvider, 
  MockSignInButton, 
  MockSignOutButton, 
  MockShow 
} from '@/components/ClerkMock';

// Dynamically import Clerk components with code splitting (ssr: false).
// When isClerkConfigured() is false, these dynamic chunks are NEVER requested or executed by the browser!
const RealClerkProvider = dynamic(
  () => import('@clerk/nextjs').then((mod) => mod.ClerkProvider),
  { ssr: false }
);

const RealSignInButton = dynamic(
  () => import('@clerk/nextjs').then((mod) => mod.SignInButton),
  { ssr: false }
);

const RealSignOutButton = dynamic(
  () => import('@clerk/nextjs').then((mod) => mod.SignOutButton),
  { ssr: false }
);

const RealShow = dynamic(
  () => import('@clerk/nextjs').then((mod) => mod.Show),
  { ssr: false }
);

export function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const useReal = isClerkConfigured();
  if (useReal && mounted) {
    const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    return <RealClerkProvider publishableKey={pk}>{children}</RealClerkProvider>;
  }

  return <MockClerkProvider>{children}</MockClerkProvider>;
}

export function SignInButton(props: any) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const useReal = isClerkConfigured();
  if (useReal && mounted) {
    return <RealSignInButton {...props} />;
  }
  return <MockSignInButton {...props} />;
}

export function SignOutButton(props: any) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const useReal = isClerkConfigured();
  if (useReal && mounted) {
    return <RealSignOutButton {...props} />;
  }
  return <MockSignOutButton {...props} />;
}

export function Show(props: any) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const useReal = isClerkConfigured();
  if (useReal && mounted) {
    return <RealShow {...props} />;
  }
  return <MockShow {...props} />;
}
