import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma'; // ✅ Đường dẫn có thể điều chỉnh tùy dự án

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
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
            plan: 'FREE', // hoặc giá trị mặc định nếu bạn muốn
          },
        });
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      return url.startsWith("/") ? `${baseUrl}${url}` : url;
    }
  }
});

export { handler as GET, handler as POST };