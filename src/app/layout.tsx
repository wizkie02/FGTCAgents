// src/app/layout.tsx
'use client';

import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { NextAuthProvider } from './providers';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  );
}
