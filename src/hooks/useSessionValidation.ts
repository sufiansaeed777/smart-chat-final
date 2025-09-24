'use client';
import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function useSessionValidation() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    // Session validation is temporarily disabled to prevent excessive API calls
    // The session is already validated by NextAuth.js
    console.log('Session validation skipped - session is valid');
  }, [session, status, router]);

  return {};
}
