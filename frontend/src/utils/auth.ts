// Pure utility function to check Clerk configuration. 
// Safe to execute on both server-side and client-side environments.
export const isClerkConfigured = (): boolean => {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
  if (!pk || pk.includes('placeholder') || pk.includes('c2FuZGJveC') || pk.includes('sandbox')) {
    return false;
  }

  try {
    const base64Part = pk.replace(/^pk_(test|live)_/, '').replace(/\$$/, '');
    const decoded = typeof window !== 'undefined'
      ? window.atob(base64Part)
      : Buffer.from(base64Part, 'base64').toString('utf-8');

    if (decoded.includes('sandbox') || decoded.includes('placeholder') || decoded.includes('example.com')) {
      return false;
    }
  } catch {
    // If base64 decoding fails, fallback to basic string checks
  }

  return true;
};
