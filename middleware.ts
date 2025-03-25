// middleware.ts

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Cho phép truy cập nếu đã có JWT
    },
  }
);

export const config = {
    matcher: [
      '/((?!api/auth|_next/static|_next/image|favicon.ico|auth/signin(/.*)?|auth/error|public).*)',
    ],
  };
  