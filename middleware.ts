import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that should be accessible without authentication
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/product',
  '/pricing',
  '/contact',
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
  '/api/auth',
  '/api/chat',
  '/api/wordpress',
  '/api/webhooks',
];

// Routes that require authentication
const protectedRoutes = [
  '/user-dashboard',
  '/manager-dashboard',
  '/admin-dashboard',
  '/dashboard',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the pathname is a public route or starts with a public route
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`) || pathname.startsWith(`${route}#`)
  );

  // Allow all public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if the pathname is a protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // For protected routes, let Next-Auth handle authentication
  // (You can add session checks here if needed)
  if (isProtectedRoute) {
    // NextAuth will handle the authentication
    return NextResponse.next();
  }

  // Allow all other routes by default
  return NextResponse.next();
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
