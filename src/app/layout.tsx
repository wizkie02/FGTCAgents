import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "./providers";
import { UserSettingsProvider } from '@/lib/contexts/UserSettingsContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YAPSearch",
  description: "YAPSearch - Your AI Powered Search Assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full dark:bg-gray-900`}>
        <UserSettingsProvider>
          <Providers>{children}</Providers>
        </UserSettingsProvider>
      </body>
    </html>
  );
}
