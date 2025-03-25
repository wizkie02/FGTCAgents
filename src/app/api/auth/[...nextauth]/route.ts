import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { NextAuthOptions, User } from 'next-auth';
import type { AdapterUser } from 'next-auth/adapters';

const extendedAuthOptions = {
  ...authOptions,
  callbacks: {
    ...authOptions.callbacks,
    async signIn({ user }: { user: User | AdapterUser }) {
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
  },
};

const handler = NextAuth(extendedAuthOptions);
export { handler as GET, handler as POST };
export { authOptions };