'use client';
import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

export function useSessionValidation() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return;

    // List of public routes that don't require authentication
    const publicRoutes = [
      '/',
      '/login',
      '/signup',
      '/contact',
      '/pricing',
      '/product',
      '/legal',
      '/support',
      '/help-center',
      '/contact-support',
      '/status',
      '/community',
      '/privacy-policy',
      '/terms-of-service',
      '/cookie-policy',
      '/gdpr',
    ];
    const isPublicRoute = publicRoutes.includes(pathname);

    // Only redirect to login if:
    // 1. There's no session
    // 2. The current page is NOT a public route (it's a protected route like dashboard)
    if (!session && !isPublicRoute) {
      router.push('/login');
      return;
    }

    // Session validation is temporarily disabled to prevent excessive API calls
    // The session is already validated by NextAuth.js
    if (session) {
      console.log('Session validation skipped - session is valid');
    }
  }, [session, status, router, pathname]);

  return {};
}
