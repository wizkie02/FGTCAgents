import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      // Allow access to auth pages even without token
      if (req.nextUrl.pathname.startsWith('/auth/')) {
        return true;
      }
      return !!token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
