// [...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user }) {
      if (user?.email) {
        await prisma.user.upsert({
          where: { email: user.email },
          update: { name: user.name, image: user.image, lastSeenAt: new Date() },
          create: {
            email: user.email,
            name: user.name,
            image: user.image,
            lastSeenAt: new Date(),
            plan: 'FREE',
          },
        });
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      return url.startsWith('/') ? `${baseUrl}${url}` : baseUrl;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
