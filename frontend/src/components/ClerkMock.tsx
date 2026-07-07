'use client';

import React from 'react';

export function MockClerkProvider({ children }: { children: React.ReactNode }) {
  console.log('[Clerk Mock] Active: Clerk auth is bypassed for local sandbox testing.');
  return <>{children}</>;
}

export function MockSignInButton({ children }: { children: React.ReactNode; mode?: string }) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('[Clerk Mock] Redirecting to Dashboard sandbox.');
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  };

  return (
    <span onClick={handleClick} className="contents cursor-pointer">
      {children}
    </span>
  );
}

export function MockSignOutButton({ children }: { children: React.ReactNode; redirectUrl?: string }) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('[Clerk Mock] Redirecting to Landing Page.');
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <span onClick={handleClick} className="contents cursor-pointer">
      {children}
    </span>
  );
}

export function MockShow({
  when,
  children,
  fallback = null
}: {
  when: 'signed-in' | 'signed-out';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isLandingPage = typeof window !== 'undefined' && window.location.pathname === '/';
  const showContent = (when === 'signed-out' && isLandingPage) || (when === 'signed-in' && !isLandingPage);
  return showContent ? <>{children}</> : <>{fallback}</>;
}
