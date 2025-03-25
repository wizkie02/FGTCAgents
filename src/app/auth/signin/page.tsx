'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProviders, signIn } from 'next-auth/react';
import { useState } from 'react';

export default function SignIn() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [providers, setProviders] = useState<any>(null);

  useEffect(() => {
    getProviders().then(setProviders);
  }, []);

  // ✅ Nếu đã đăng nhập → redirect về homepage
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/');
    }
  }, [status, router]);

  if (status === 'loading') return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <h1 className="text-2xl font-bold mb-6">Sign in to FGTC Search</h1>
      <div className="space-y-4">
        {providers &&
          Object.values(providers).map((provider: any) => (
            <button
              key={provider.name}
              onClick={() => signIn(provider.id, { callbackUrl: '/' })} // ✅ Đảm bảo callbackUrl là /
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
            >
              Sign in with {provider.name}
            </button>
          ))}
      </div>
    </div>
  );
}
