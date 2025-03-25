// src/lib/auth.ts
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import { type NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
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
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user }) {
      if (user?.email) {
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            image: user.image,
            lastSeenAt: new Date(),
          },
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
    async redirect({ baseUrl }) {
      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
